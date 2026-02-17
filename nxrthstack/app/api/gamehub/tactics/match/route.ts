import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsMatches, tacticsMatchCooldowns, tacticsUnitInstances, tacticsEquipment, users } from "@/lib/db";
import { eq, ne, and, gt, sql, isNotNull, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { simulateBattle, type StatsOverrideMap } from "@/lib/gamehub/tactics/simulation";
import { getMilestonePerks } from "@/lib/gamehub/tactics/milestones";
import { calculateRatingChange, calculateCurrencyReward } from "@/lib/gamehub/tactics/elo";
import { computeUnitStats } from "@/lib/gamehub/tactics/stats";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { xpForLevel, RARITY_MAX_LEVEL } from "@/lib/gamehub/tactics/rarities";
import { EQUIPMENT_MAX_LEVEL, equipmentXpForLevel, getEquipmentXpReward } from "@/lib/gamehub/tactics/equipment-levels";
import type { Squad, UnitInstance, EquipmentItem, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

const TICK_RATE = 4;
const COOLDOWN_MINUTES = 30;
const INITIAL_RATING_WINDOW = 200;
const MAX_RATING_WINDOW = 500;

/** POST - Find opponent and simulate battle */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch attacker profile
    const attacker = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!attacker) {
      return NextResponse.json({ error: "Player not found. Visit tactics dashboard first." }, { status: 404 });
    }

    const attackSquad = attacker.attackSquad as Squad | null;
    if (!attackSquad?.units?.length) {
      return NextResponse.json({ error: "You need an attack squad to battle." }, { status: 400 });
    }

    // Find a defender within rating window
    const now = new Date();

    // Get active cooldowns for this attacker
    const cooldowns = await db
      .select({ defenderId: tacticsMatchCooldowns.defenderId, expiresAt: tacticsMatchCooldowns.expiresAt })
      .from(tacticsMatchCooldowns)
      .where(
        and(
          eq(tacticsMatchCooldowns.attackerId, session.user.id),
          gt(tacticsMatchCooldowns.expiresAt, now)
        )
      );
    const cooldownIds = cooldowns.map((c) => c.defenderId);

    // Try expanding rating window to find an opponent
    type PlayerRow = typeof tacticsPlayers.$inferSelect;
    let defender: PlayerRow | null = null;
    let allValidCandidates: PlayerRow[] = [];
    for (let window = INITIAL_RATING_WINDOW; window <= MAX_RATING_WINDOW; window += 100) {
      const candidates = await db
        .select()
        .from(tacticsPlayers)
        .where(
          and(
            ne(tacticsPlayers.userId, session.user.id),
            isNotNull(tacticsPlayers.defenseSquad),
            sql`${tacticsPlayers.rating} BETWEEN ${attacker.rating - window} AND ${attacker.rating + window}`
          )
        )
        .limit(20);

      // Track all valid candidates (valid defense squad) for cooldown fallback
      const valid = candidates.filter((c) => {
        const defSquad = c.defenseSquad as Squad | null;
        return defSquad?.units?.length && defSquad.units.length >= 3;
      });
      if (valid.length > 0 && allValidCandidates.length === 0) {
        allValidCandidates = valid;
      }

      // Filter out cooldowns
      const eligible = valid.filter((c) => !cooldownIds.includes(c.userId));

      if (eligible.length > 0) {
        // Pick random defender from eligible
        defender = eligible[Math.floor(Math.random() * eligible.length)];
        break;
      }
    }

    // Fallback: if all opponents are on cooldown, pick the one whose cooldown expires soonest
    if (!defender && allValidCandidates.length > 0) {
      const cooldownMap = new Map(cooldowns.map((c) => [c.defenderId, c.expiresAt]));
      const sorted = allValidCandidates
        .filter((c) => cooldownMap.has(c.userId))
        .sort((a, b) => {
          const aExp = cooldownMap.get(a.userId)!.getTime();
          const bExp = cooldownMap.get(b.userId)!.getTime();
          return aExp - bExp; // soonest expiry first
        });
      defender = sorted[0] ?? allValidCandidates[0];
    }

    if (!defender) {
      return NextResponse.json(
        { error: "No opponents available. Try again later." },
        { status: 404 }
      );
    }

    // Get defender's user info for display
    const defenderUser = await db.query.users.findFirst({
      where: eq(users.id, defender.userId),
    });

    const defenseSquad = defender.defenseSquad as Squad;

    // Generate seed and simulate
    const seed = Math.floor(Math.random() * 2147483647);
    const mapId = ""; // selectMap will pick based on seed

    // Compute stats with rarity, level, and equipment for both squads
    const statsOverride: StatsOverrideMap = {};
    await computeSquadStats(attacker.id, attackSquad, statsOverride);
    await computeSquadStats(defender.id, defenseSquad, statsOverride);

    const result = simulateBattle(attackSquad, defenseSquad, mapId, seed, statsOverride);
    const attackerWon = result.winner === "attacker";

    // Calculate rating changes
    const ratingChange = calculateRatingChange(
      attacker.rating,
      defender.rating,
      attackerWon
    );

    let attackerCurrency = calculateCurrencyReward(attackerWon, true);
    const defenderCurrency = calculateCurrencyReward(attackerWon, false);

    // Win streak bonus
    const newStreak = attackerWon ? (attacker.winStreak ?? 0) + 1 : 0;
    const streakBonus = attackerWon ? Math.min(50, newStreak * 10) : 0;
    attackerCurrency += streakBonus;

    // First win of the day bonus
    let isFirstWin = false;
    if (attackerWon) {
      const lastWin = attacker.lastFirstWinAt;
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      if (!lastWin || lastWin < todayStart) {
        isFirstWin = true;
        attackerCurrency *= 2; // double reward for first win
      }
    }

    // Store match result
    const [match] = await db
      .insert(tacticsMatches)
      .values({
        attackerId: session.user.id,
        defenderId: defender.userId,
        attackerRatingBefore: attacker.rating,
        defenderRatingBefore: defender.rating,
        attackerRatingChange: ratingChange.attackerChange,
        defenderRatingChange: ratingChange.defenderChange,
        attackerSquadSnapshot: attackSquad,
        defenderSquadSnapshot: defenseSquad,
        mapId: result.mapId,
        seed,
        winner: result.winner,
        durationTicks: result.durationTicks,
        durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
        stats: result.stats,
        events: result.events,
      })
      .returning();

    // Update attacker rating, currency, wins/losses, streak, first win
    await db
      .update(tacticsPlayers)
      .set({
        rating: attacker.rating + ratingChange.attackerChange,
        currency: attacker.currency + attackerCurrency,
        totalWins: attackerWon ? attacker.totalWins + 1 : attacker.totalWins,
        totalLosses: attackerWon ? attacker.totalLosses : attacker.totalLosses + 1,
        winStreak: newStreak,
        ...(isFirstWin ? { lastFirstWinAt: now } : {}),
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, session.user.id));

    // Update defender rating, currency, wins/losses
    await db
      .update(tacticsPlayers)
      .set({
        rating: defender.rating + ratingChange.defenderChange,
        currency: defender.currency + defenderCurrency,
        totalWins: attackerWon ? defender.totalWins : defender.totalWins + 1,
        totalLosses: attackerWon ? defender.totalLosses + 1 : defender.totalLosses,
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, defender.userId));

    // Add cooldown
    await db.insert(tacticsMatchCooldowns).values({
      attackerId: session.user.id,
      defenderId: defender.userId,
      expiresAt: new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000),
    });

    // Award XP to participating unit instances
    const ratingDiff = Math.abs(attacker.rating - defender.rating);
    await awardXp(attacker.id, attackSquad, attackerWon, ratingDiff, true);
    await awardXp(defender.id, defenseSquad, !attackerWon, ratingDiff, false);

    // Award XP to equipped equipment
    await awardEquipmentXp(attacker.id, attackSquad, attackerWon, true);
    await awardEquipmentXp(defender.id, defenseSquad, !attackerWon, false);

    return NextResponse.json({
      match: {
        matchId: match.id,
        attackerId: session.user.id,
        attackerName: session.user.name || "You",
        defenderId: defender.userId,
        defenderName: defenderUser?.name || "Unknown",
        attackerRatingBefore: attacker.rating,
        defenderRatingBefore: defender.rating,
        attackerRatingChange: ratingChange.attackerChange,
        defenderRatingChange: ratingChange.defenderChange,
        winner: result.winner,
        durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
        stats: result.stats,
        currencyEarned: attackerCurrency,
        streakBonus,
        winStreak: newStreak,
        isFirstWin,
        createdAt: match.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in tactics match:", error);
    return NextResponse.json(
      { error: "Failed to process match" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

/** Compute stats for all units in a squad and populate statsOverride map */
async function computeSquadStats(
  playerId: string,
  squad: Squad,
  statsOverride: StatsOverrideMap
): Promise<void> {
  // Get all unit instance IDs from the squad
  const instanceIds = squad.units
    .map((u) => u.unitInstanceId)
    .filter((id): id is string => !!id);

  if (instanceIds.length === 0) return;

  // Fetch unit instances
  const instances = await db
    .select()
    .from(tacticsUnitInstances)
    .where(
      and(
        eq(tacticsUnitInstances.playerId, playerId),
        inArray(tacticsUnitInstances.id, instanceIds)
      )
    );

  // Fetch equipment for these instances
  const equipment = await db
    .select()
    .from(tacticsEquipment)
    .where(
      and(
        eq(tacticsEquipment.playerId, playerId),
        inArray(tacticsEquipment.unitInstanceId, instanceIds)
      )
    );

  // Group equipment by unit instance
  const equipByUnit: Record<string, EquipmentItem[]> = {};
  for (const equip of equipment) {
    const uid = equip.unitInstanceId!;
    if (!equipByUnit[uid]) equipByUnit[uid] = [];
    equipByUnit[uid].push({
      id: equip.id,
      slot: equip.slot as EquipmentItem["slot"],
      name: equip.name,
      rarity: equip.rarity as Rarity,
      stats: equip.stats as EquipmentStat[],
      enchantLevel: equip.enchantLevel,
      cursed: equip.cursed,
      curseStats: equip.curseStats as EquipmentStat[],
      equipmentLevel: equip.equipmentLevel,
      equipmentXp: equip.equipmentXp,
    });
  }

  // Compute stats for each unit
  for (const su of squad.units) {
    const inst = instances.find((i) => i.id === su.unitInstanceId);
    if (!inst) continue;

    const template = ALL_UNITS[su.templateId];
    if (!template) continue;

    const unitInst: UnitInstance = {
      id: inst.id,
      templateId: inst.templateId,
      rarity: inst.rarity as Rarity,
      level: inst.level,
      xp: inst.xp,
    };

    const unitEquip = equipByUnit[inst.id] ?? [];
    const computed = computeUnitStats(template, unitInst, unitEquip);
    const perks = getMilestonePerks(template.class as import("@/lib/gamehub/tactics/types").UnitClass, inst.level);
    statsOverride[su.instanceId] = { ...computed, perks };
  }
}

/** Award XP to all unit instances in a squad after battle */
async function awardXp(
  playerId: string,
  squad: Squad,
  won: boolean,
  ratingDiff: number,
  isAttacker: boolean
): Promise<void> {
  const instanceIds = squad.units
    .map((u) => u.unitInstanceId)
    .filter((id): id is string => !!id);

  if (instanceIds.length === 0) return;

  const instances = await db
    .select()
    .from(tacticsUnitInstances)
    .where(
      and(
        eq(tacticsUnitInstances.playerId, playerId),
        inArray(tacticsUnitInstances.id, instanceIds)
      )
    );

  let totalXpAwarded = 0;

  for (const inst of instances) {
    // Base XP: winners get more
    let xpGain: number;
    if (isAttacker) {
      xpGain = won ? 50 + Math.min(25, Math.floor(ratingDiff / 20)) : 20;
    } else {
      // Defense team gets less XP
      xpGain = won ? 15 : 5;
    }

    const maxLevel = RARITY_MAX_LEVEL[inst.rarity as Rarity] ?? 10;
    if (inst.level >= maxLevel) continue; // Already at max level

    let newXp = inst.xp + xpGain;
    let newLevel = inst.level;

    // Check for level ups
    while (newLevel < maxLevel) {
      const needed = xpForLevel(newLevel + 1);
      if (newXp >= needed) {
        newXp -= needed;
        newLevel++;
      } else {
        break;
      }
    }

    totalXpAwarded += xpGain;

    await db
      .update(tacticsUnitInstances)
      .set({ xp: newXp, level: newLevel })
      .where(eq(tacticsUnitInstances.id, inst.id));
  }

  // Track total XP earned on player
  if (totalXpAwarded > 0) {
    await db
      .update(tacticsPlayers)
      .set({
        totalXpEarned: sql`${tacticsPlayers.totalXpEarned} + ${totalXpAwarded}`,
      })
      .where(eq(tacticsPlayers.id, playerId));
  }
}

/** Award XP to all equipped equipment on units in a squad after battle */
async function awardEquipmentXp(
  playerId: string,
  squad: Squad,
  won: boolean,
  isAttacker: boolean
): Promise<void> {
  const instanceIds = squad.units
    .map((u) => u.unitInstanceId)
    .filter((id): id is string => !!id);

  if (instanceIds.length === 0) return;

  // Fetch all equipment on these unit instances
  const equippedItems = await db
    .select()
    .from(tacticsEquipment)
    .where(
      and(
        eq(tacticsEquipment.playerId, playerId),
        inArray(tacticsEquipment.unitInstanceId, instanceIds)
      )
    );

  const xpReward = getEquipmentXpReward(won, isAttacker);

  for (const item of equippedItems) {
    const maxLevel = EQUIPMENT_MAX_LEVEL[item.rarity as Rarity] ?? 5;
    if (item.equipmentLevel >= maxLevel) continue;

    let newXp = item.equipmentXp + xpReward;
    let newLevel = item.equipmentLevel;

    while (newLevel < maxLevel) {
      const needed = equipmentXpForLevel(newLevel + 1);
      if (newXp >= needed) {
        newXp -= needed;
        newLevel++;
      } else {
        break;
      }
    }

    await db
      .update(tacticsEquipment)
      .set({ equipmentXp: newXp, equipmentLevel: newLevel })
      .where(eq(tacticsEquipment.id, item.id));
  }
}
