// ============================================================================
// Progression Helpers — Quest progress, achievement unlocks, currency tracking
// ============================================================================

import {
  db,
  tacticsPlayers,
  tacticsDailyQuests,
  tacticsAchievements,
  tacticsUnitInstances,
  tacticsEquipment,
  tacticsWheelSpins,
} from "@/lib/db";
import { eq, and, sql, isNull } from "drizzle-orm";
import { isQuestFromToday } from "@/lib/gamehub/tactics/quests";
import { ACHIEVEMENTS } from "@/lib/gamehub/tactics/achievements";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { RARITY_MAX_LEVEL } from "@/lib/gamehub/tactics/rarities";
import { ALL_EQUIPMENT_SLOTS } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

// ============================================================================
// Quest Progress
// ============================================================================

/** Increment progress on today's matching daily quest for a player */
export async function incrementQuestProgress(
  playerId: string,
  questType: string,
  amount: number = 1
): Promise<void> {
  // Find today's uncompleted quests matching this type
  const quests = await db
    .select()
    .from(tacticsDailyQuests)
    .where(
      and(
        eq(tacticsDailyQuests.playerId, playerId),
        eq(tacticsDailyQuests.questType, questType),
        isNull(tacticsDailyQuests.completedAt)
      )
    );

  const todayQuests = quests.filter((q) => isQuestFromToday(q.createdAt));

  for (const quest of todayQuests) {
    if (quest.progress >= quest.target) continue;
    await db
      .update(tacticsDailyQuests)
      .set({
        progress: sql`LEAST(${tacticsDailyQuests.progress} + ${amount}, ${quest.target})`,
      })
      .where(eq(tacticsDailyQuests.id, quest.id));
  }
}

// ============================================================================
// Currency Spent Tracking
// ============================================================================

/** Atomically increment totalCurrencySpent for big_spender achievement */
export async function addCurrencySpent(
  playerId: string,
  amount: number
): Promise<void> {
  if (amount <= 0) return;
  await db
    .update(tacticsPlayers)
    .set({
      totalCurrencySpent: sql`${tacticsPlayers.totalCurrencySpent} + ${amount}`,
    })
    .where(eq(tacticsPlayers.id, playerId));
}

// ============================================================================
// Achievement Checks
// ============================================================================

/** Check all achievement conditions and unlock any newly-met ones. Returns IDs of newly unlocked achievements. */
export async function checkAndUnlockAchievements(
  playerId: string
): Promise<string[]> {
  const player = await db.query.tacticsPlayers.findFirst({
    where: eq(tacticsPlayers.id, playerId),
  });
  if (!player) return [];

  // Fetch already-unlocked achievement IDs
  const existing = await db
    .select({ achievementId: tacticsAchievements.achievementId })
    .from(tacticsAchievements)
    .where(eq(tacticsAchievements.playerId, playerId));
  const unlockedSet = new Set(existing.map((e) => e.achievementId));

  // Fetch equipment for this player
  const equipmentRows = await db
    .select()
    .from(tacticsEquipment)
    .where(eq(tacticsEquipment.playerId, playerId));
  const equipCount = equipmentRows.length;
  const maxEnchant = equipmentRows.reduce(
    (max, e) => Math.max(max, e.enchantLevel),
    0
  );

  // Fetch unit instances
  const unitInstances = await db
    .select()
    .from(tacticsUnitInstances)
    .where(eq(tacticsUnitInstances.playerId, playerId));

  // Check for jackpot (legendary/mythic/secret wheel spin)
  const jackpotSpin = await db
    .select({ id: tacticsWheelSpins.id })
    .from(tacticsWheelSpins)
    .where(
      and(
        eq(tacticsWheelSpins.playerId, playerId),
        sql`${tacticsWheelSpins.resultRarity} IN ('legendary', 'mythic', 'secret')`
      )
    )
    .limit(1);

  // Derived checks
  const unlockedUnitIds = player.unlockedUnitIds as string[];

  const hasMaxLevelUnit = unitInstances.some((inst) => {
    const maxLevel = RARITY_MAX_LEVEL[inst.rarity as Rarity] ?? 10;
    return inst.level >= maxLevel;
  });

  // Check if any unit has all 9 equipment slots filled
  const equipByUnit: Record<string, Set<string>> = {};
  for (const equip of equipmentRows) {
    if (!equip.unitInstanceId) continue;
    if (!equipByUnit[equip.unitInstanceId])
      equipByUnit[equip.unitInstanceId] = new Set();
    equipByUnit[equip.unitInstanceId].add(equip.slot);
  }
  const hasFullyEquippedUnit = Object.values(equipByUnit).some(
    (slots) => slots.size >= ALL_EQUIPMENT_SLOTS.length
  );

  // Check class_master: own instances from every class
  const ownedClasses = new Set<string>();
  for (const inst of unitInstances) {
    const template = ALL_UNITS[inst.templateId];
    if (template) ownedClasses.add(template.class);
  }
  const allClassesCovered = ownedClasses.size >= 7;

  // Evaluate conditions
  const conditions: Record<string, boolean> = {
    first_blood: player.totalWins >= 1,
    getting_started: equipCount >= 5,
    collector: equipCount >= 20,
    full_roster: unlockedUnitIds.length >= 18,
    enchanter: maxEnchant >= 3,
    master_enchanter: maxEnchant >= 7,
    lucky_10: player.wheelSpinCount >= 10,
    jackpot: jackpotSpin.length > 0,
    veteran: player.totalWins >= 50,
    champion: player.totalWins >= 200,
    legend: player.rating >= 1500,
    grandmaster: player.rating >= 2000,
    streak_master: player.winStreak >= 10,
    max_level: hasMaxLevelUnit,
    gear_up: hasFullyEquippedUnit,
    big_spender: (player.totalCurrencySpent ?? 0) >= 50000,
    class_master: allClassesCovered,
    campaign_10: player.campaignLevel >= 10,
    campaign_50: player.campaignLevel >= 50,
    warfare_win: player.warfareWins >= 1,
  };

  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedSet.has(achievement.id)) continue;
    if (conditions[achievement.id]) {
      await db.insert(tacticsAchievements).values({
        playerId,
        achievementId: achievement.id,
      });
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}
