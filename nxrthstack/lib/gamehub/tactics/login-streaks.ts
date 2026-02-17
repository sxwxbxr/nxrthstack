// ============================================================================
// Login Streak Rewards
// ============================================================================

export interface StreakReward {
  day: number;
  currency: number;
  bonusEquipment: boolean; // Day 7 gives bonus equipment
}

const STREAK_CYCLE: StreakReward[] = [
  { day: 1, currency: 50, bonusEquipment: false },
  { day: 2, currency: 75, bonusEquipment: false },
  { day: 3, currency: 100, bonusEquipment: false },
  { day: 4, currency: 150, bonusEquipment: false },
  { day: 5, currency: 200, bonusEquipment: false },
  { day: 6, currency: 250, bonusEquipment: false },
  { day: 7, currency: 300, bonusEquipment: true },
];

/** Get the reward for a given streak day (cycles every 7 days) */
export function getStreakReward(streakDay: number): StreakReward {
  const idx = ((streakDay - 1) % 7);
  return STREAK_CYCLE[idx];
}

/** Get today's date string (UTC) for streak tracking */
export function getTodayString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

/** Check if lastLoginDate was yesterday (for streak continuation) */
export function wasYesterday(lastLoginDate: string): boolean {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;
  return lastLoginDate === yesterdayStr;
}

/** Get streak preview (current day + next 7 days) */
export function getStreakPreview(currentStreak: number): StreakReward[] {
  return Array.from({ length: 7 }, (_, i) => getStreakReward(currentStreak + i + 1));
}
