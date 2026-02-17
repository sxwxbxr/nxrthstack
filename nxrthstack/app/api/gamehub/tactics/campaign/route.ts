import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsCampaignAttempts, tacticsUnitInstances, tacticsEquipment } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { simulateBattle, type StatsOverrideMap } from "@/lib/gamehub/tactics/simulation";
import { generateCampaignSquad, getCampaignReward, calculateStars, getCampaignDifficulty } from "@/lib/gamehub/tactics/campaign";
import { computeUnitStats } from "@/lib/gamehub/tactics/stats";
import { getMilestonePerks } from "@/lib/gamehub/tactics/milestones";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import type { Squad, UnitInstance, EquipmentItem, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";
import { incrementQuestProgress, checkAndUnlockAchievements } from "@/lib/gamehub/tactics/progression";

const TICK_RATE = 4;
const MAX_TICKS = 160;

/** GET - Campaign info: current level, next enemy preview, difficulty */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const nextLevel = player.campaignLevel + 1;
    const { displayInfo } = generateCampaignSquad(nextLevel);
    const difficulty = getCampaignDifficulty(nextLevel);

    // Reward preview (assuming 1-star win)
    const rewardPreview = {
      win1Star: getCampaignReward(nextLevel, true, 1),
      win2Star: getCampaignReward(nextLevel, true, 2),
      win3Star: getCampaignReward(nextLevel, true, 3),
      loss: getCampaignReward(nextLevel, false, 0),
    };

    // Get past attempts for star display
    const pastAttempts = await db
      .select({
        level: tacticsCampaignAttempts.level,
        won: tacticsCampaignAttempts.won,
        stars: tacticsCampaignAttempts.stars,
      })
      .from(tacticsCampaignAttempts)
      .where(eq(tacticsCampaignAttempts.playerId, player.id));

    // Best stars per level
    const bestStars: Record<number, number> = {};
    for (const attempt of pastAttempts) {
      if (attempt.won) {
        bestStars[attempt.level] = Math.max(bestStars[attempt.level] ?? 0, attempt.stars);
      }
    }

    return NextResponse.json({
      currentLevel: player.campaignLevel,
      nextLevel,
      difficulty,
      enemyPreview: displayInfo.map((u) => ({
        templateId: u.templateId,
        name: ALL_UNITS[u.templateId]?.name ?? u.templateId,
        rarity: u.rarity,
        level: u.level,
      })),
      rewardPreview,
      bestStars,
    });
  } catch (error) {
    console.error("Error fetching campaign info:", error);
    return NextResponse.json({ error: "Failed to fetch campaign info" }, { status: 500 });
  }
}

/** POST - Fight the next campaign level */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const attackSquad = player.attackSquad as Squad | null;
    if (!attackSquad?.units?.length) {
      return NextResponse.json({ error: "You need an attack squad to fight." }, { status: 400 });
    }

    const level = player.campaignLevel + 1;
    const { squad: botSquad, statsOverride: botStats, displayInfo } = generateCampaignSquad(level);
    const difficulty = getCampaignDifficulty(level);

    // Compute player's attack squad stats
    const statsOverride: StatsOverrideMap = { ...botStats };
    await computePlayerSquadStats(player.id, attackSquad, statsOverride);

    // Simulate
    const seed = Math.floor(Math.random() * 2147483647);
    const result = simulateBattle(attackSquad, botSquad, "", seed, statsOverride);
    const won = result.winner === "attacker";

    // Calculate stars
    const unitsLost = result.stats.attackerUnitsLost;
    const stars = won ? calculateStars(result.durationTicks, unitsLost, MAX_TICKS) : 0;

    // Calculate reward
    const currencyEarned = getCampaignReward(level, won, stars);

    // Update player
    const updates: Record<string, unknown> = {
      currency: player.currency + currencyEarned,
      updatedAt: new Date(),
    };
    if (won && level > player.campaignLevel) {
      updates.campaignLevel = level;
    }

    await db
      .update(tacticsPlayers)
      .set(updates)
      .where(eq(tacticsPlayers.userId, session.user.id));

    // Record attempt
    await db.insert(tacticsCampaignAttempts).values({
      playerId: player.id,
      level,
      won,
      stars,
      currencyEarned,
      durationTicks: result.durationTicks,
    });

    // Quest progress
    if (won) {
      await incrementQuestProgress(player.id, "campaign_clear");
      if (stars >= 3) {
        await incrementQuestProgress(player.id, "campaign_3star");
      }
    }

    // Achievement checks
    await checkAndUnlockAchievements(player.id);

    return NextResponse.json({
      level,
      won,
      stars,
      currencyEarned,
      difficulty,
      durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
      stats: result.stats,
      enemySquad: displayInfo.map((u) => ({
        templateId: u.templateId,
        name: ALL_UNITS[u.templateId]?.name ?? u.templateId,
        rarity: u.rarity,
        level: u.level,
      })),
      newCampaignLevel: won ? Math.max(level, player.campaignLevel) : player.campaignLevel,
    });
  } catch (error) {
    console.error("Error in campaign battle:", error);
    return NextResponse.json({ error: "Failed to process campaign battle" }, { status: 500 });
  }
}

/** Compute stats for player's squad units */
async function computePlayerSquadStats(
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
