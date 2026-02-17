// ============================================================================
// Daily Quests System
// ============================================================================

export interface QuestDefinition {
  type: string;
  label: string;
  target: number;
  reward: number;
}

export const QUEST_POOL: QuestDefinition[] = [
  { type: "win_battles", label: "Win 3 Battles", target: 3, reward: 150 },
  { type: "play_battles", label: "Play 5 Battles", target: 5, reward: 100 },
  { type: "enchant_item", label: "Enchant an Item", target: 1, reward: 100 },
  { type: "buy_equipment", label: "Buy Equipment", target: 1, reward: 75 },
  { type: "reroll_item", label: "Reroll an Item", target: 1, reward: 75 },
  { type: "spin_wheel", label: "Spin the Wheel", target: 1, reward: 100 },
  { type: "equip_item", label: "Equip 2 Items", target: 2, reward: 75 },
  { type: "level_up_unit", label: "Level Up a Unit", target: 1, reward: 125 },
  { type: "campaign_clear", label: "Clear 2 Campaign Levels", target: 2, reward: 200 },
  { type: "campaign_3star", label: "Get 3 Stars on a Campaign Level", target: 1, reward: 150 },
  { type: "warfare_battle", label: "Play a Warfare Battle", target: 1, reward: 150 },
  { type: "collect_unit", label: "Get a New Unit", target: 1, reward: 200 },
];

/** Pick 3 random quests from the pool using a daily seed */
export function pickDailyQuests(dateSeed: string): QuestDefinition[] {
  // Simple hash to generate deterministic picks per day
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) {
    hash = ((hash << 5) - hash + dateSeed.charCodeAt(i)) | 0;
  }

  const shuffled = [...QUEST_POOL];
  // Fisher-Yates with seeded "random"
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/** Get today's date string for seeding (UTC) */
export function getTodayDateSeed(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

/** Check if a quest was created today (UTC) */
export function isQuestFromToday(createdAt: Date): boolean {
  const now = new Date();
  return (
    createdAt.getUTCFullYear() === now.getUTCFullYear() &&
    createdAt.getUTCMonth() === now.getUTCMonth() &&
    createdAt.getUTCDate() === now.getUTCDate()
  );
}
