// ============================================================================
// Achievements System — One-time milestone rewards
// ============================================================================

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  reward: number;
  icon: string; // Icon component name
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first_blood", name: "First Blood", description: "Win your first battle", reward: 100, icon: "Swords" },
  { id: "getting_started", name: "Getting Started", description: "Own 5 equipment pieces", reward: 150, icon: "Package" },
  { id: "collector", name: "Collector", description: "Own 20 equipment pieces", reward: 500, icon: "Package" },
  { id: "full_roster", name: "Full Roster", description: "Unlock all 18 unit templates", reward: 300, icon: "Users" },
  { id: "enchanter", name: "Enchanter", description: "Enchant an item to +3", reward: 200, icon: "Wand" },
  { id: "master_enchanter", name: "Master Enchanter", description: "Enchant an item to +7", reward: 1000, icon: "Wand" },
  { id: "lucky_10", name: "Lucky Streak", description: "Spin the wheel 10 times", reward: 500, icon: "Dices" },
  { id: "jackpot", name: "Jackpot", description: "Get Legendary or better from the wheel", reward: 750, icon: "Star" },
  { id: "veteran", name: "Veteran", description: "Win 50 battles", reward: 500, icon: "Trophy" },
  { id: "champion", name: "Champion", description: "Win 200 battles", reward: 1500, icon: "Trophy" },
  { id: "legend", name: "Legend", description: "Reach 1500 rating", reward: 1000, icon: "Crown" },
  { id: "grandmaster", name: "Grandmaster", description: "Reach 2000 rating", reward: 3000, icon: "Crown" },
  { id: "streak_master", name: "Streak Master", description: "Get a 10 win streak", reward: 500, icon: "Flame" },
  { id: "max_level", name: "Max Level", description: "Max-level any unit", reward: 1000, icon: "Star" },
  { id: "gear_up", name: "Gear Up", description: "Fully equip a unit (9 slots)", reward: 500, icon: "Shield" },
  { id: "big_spender", name: "Big Spender", description: "Spend 50,000 total currency", reward: 2000, icon: "Coins" },
  { id: "class_master", name: "Class Master", description: "Own a unit from every class", reward: 500, icon: "BookOpen" },
  { id: "campaign_10", name: "Dungeon Crawler", description: "Clear campaign level 10", reward: 500, icon: "Map" },
  { id: "campaign_50", name: "Campaign Veteran", description: "Clear campaign level 50", reward: 2000, icon: "Map" },
  { id: "warfare_win", name: "War Machine", description: "Win a Warfare battle", reward: 300, icon: "Shield" },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
