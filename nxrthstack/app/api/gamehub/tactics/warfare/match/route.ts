import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsMatches, tacticsMatchCooldowns, tacticsUnitInstances, tacticsEquipment, users } from "@/lib/db";
import { eq, ne, and, gt, sql, isNotNull, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { simulateBattle, type StatsOverrideMap } from "@/lib/gamehub/tactics/simulation";
import { getMilestonePerks } from "@/lib/gamehub/tactics/milestones";
import { calculateRatingChange, calculateCurrencyReward } from "@/lib/gamehub/tactics/elo";
import { computeUnitStats } from "@/lib/gamehub/tactics/stats";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import type { Squad, UnitInstance, EquipmentItem, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";
import { incrementQuestProgress, checkAndUnlockAchievements } from "@/lib/gamehub/tactics/progression";

const TICK_RATE = 4;
const MAX_TICKS = 240; // 60 seconds for warfare (larger battles)
const COOLDOWN_MINUTES = 30;
const INITIAL_RATING_WINDOW = 200;
const MAX_RATING_WINDOW = 500;

/** POST - Find warfare opponent and simulate battle */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attacker = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!attacker) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const attackSquad = attacker.warfareAttackSquad as Squad | null;
    if (!attackSquad?.units?.length || attackSquad.units.length < 5) {
      return NextResponse.json({ error: "You need a warfare attack squad with at least 5 units." }, { status: 400 });
    }

    const now = new Date();

    // Get active cooldowns
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

    // Find defender with warfare defense squad
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
            isNotNull(tacticsPlayers.warfareDefenseSquad),
            sql`${tacticsPlayers.warfareRating} BETWEEN ${attacker.warfareRating - window} AND ${attacker.warfareRating + window}`
          )
        )
        .limit(20);

      const valid = candidates.filter((c) => {
        const defSquad = c.warfareDefenseSquad as Squad | null;
        return defSquad?.units?.length && defSquad.units.length >= 5;
      });

      if (valid.length > 0 && allValidCandidates.length === 0) {
        allValidCandidates = valid;
      }

      const eligible = valid.filter((c) => !cooldownIds.includes(c.userId));
      if (eligible.length > 0) {
        defender = eligible[Math.floor(Math.random() * eligible.length)];
        break;
      }
    }

    // Fallback: soonest expiry
    if (!defender && allValidCandidates.length > 0) {
      const cooldownMap = new Map(cooldowns.map((c) => [c.defenderId, c.expiresAt]));
      const sorted = allValidCandidates
        .filter((c) => cooldownMap.has(c.userId))
        .sort((a, b) => {
          const aExp = cooldownMap.get(a.userId)!.getTime();
          const bExp = cooldownMap.get(b.userId)!.getTime();
          return aExp - bExp;
        });
      defender = sorted[0] ?? allValidCandidates[0];
    }

    if (!defender) {
      return NextResponse.json(
        { error: "No warfare opponents available. Try again later." },
        { status: 404 }
      );
    }

    const defenderUser = await db.query.users.findFirst({
      where: eq(users.id, defender.userId),
    });

    const defenseSquad = defender.warfareDefenseSquad as Squad;

    const seed = Math.floor(Math.random() * 2147483647);
    const statsOverride: StatsOverrideMap = {};
    await computeSquadStats(attacker.id, attackSquad, statsOverride);
    await computeSquadStats(defender.id, defenseSquad, statsOverride);

    const result = simulateBattle(attackSquad, defenseSquad, "", seed, statsOverride);
    const attackerWon = result.winner === "attacker";

    // Rating changes (using warfare rating)
    const ratingChange = calculateRatingChange(
      attacker.warfareRating,
      defender.warfareRating,
      attackerWon
    );

    const attackerCurrency = calculateCurrencyReward(attackerWon, true);
    const defenderCurrency = calculateCurrencyReward(attackerWon, false);

    // Store match
    const [match] = await db
      .insert(tacticsMatches)
      .values({
        attackerId: session.user.id,
        defenderId: defender.userId,
        attackerRatingBefore: attacker.warfareRating,
        defenderRatingBefore: defender.warfareRating,
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
        matchType: "warfare",
      })
      .returning();

    // Update attacker warfare stats
    await db
      .update(tacticsPlayers)
      .set({
        warfareRating: attacker.warfareRating + ratingChange.attackerChange,
        warfareWins: attackerWon ? attacker.warfareWins + 1 : attacker.warfareWins,
        warfareLosses: attackerWon ? attacker.warfareLosses : attacker.warfareLosses + 1,
        currency: attacker.currency + attackerCurrency,
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, session.user.id));

    // Update defender warfare stats
    await db
      .update(tacticsPlayers)
      .set({
        warfareRating: defender.warfareRating + ratingChange.defenderChange,
        warfareWins: attackerWon ? defender.warfareWins : defender.warfareWins + 1,
        warfareLosses: attackerWon ? defender.warfareLosses + 1 : defender.warfareLosses,
        currency: defender.currency + defenderCurrency,
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, defender.userId));

    // Cooldown
    await db.insert(tacticsMatchCooldowns).values({
      attackerId: session.user.id,
      defenderId: defender.userId,
      expiresAt: new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000),
    });

    // Quest progress
    await incrementQuestProgress(attacker.id, "warfare_battle");

    // Achievement checks
    await checkAndUnlockAchievements(attacker.id);

    return NextResponse.json({
      match: {
        matchId: match.id,
        attackerId: session.user.id,
        attackerName: session.user.name || "You",
        defenderId: defender.userId,
        defenderName: defenderUser?.name || "Unknown",
        attackerRatingBefore: attacker.warfareRating,
        defenderRatingBefore: defender.warfareRating,
        attackerRatingChange: ratingChange.attackerChange,
        defenderRatingChange: ratingChange.defenderChange,
        winner: result.winner,
        durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
        stats: result.stats,
        currencyEarned: attackerCurrency,
        matchType: "warfare",
        createdAt: match.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in warfare match:", error);
    return NextResponse.json({ error: "Failed to process warfare match" }, { status: 500 });
  }
}

async function computeSquadStats(
  playerId: string,
  squad: Squad,
  statsOverride: StatsOverrideMap
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

  const equipment = await db
    .select()
    .from(tacticsEquipment)
    .where(
      and(
        eq(tacticsEquipment.playerId, playerId),
        inArray(tacticsEquipment.unitInstanceId, instanceIds)
      )
    );

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
