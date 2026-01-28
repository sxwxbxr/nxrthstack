export type AchievementCategory = "pokemon" | "minecraft" | "r6" | "general";
export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  rarity: AchievementRarity;
  isSecret?: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // General Achievements
  {
    key: "first_login",
    name: "Welcome to GameHub",
    description: "Log in to GameHub for the first time",
    icon: "Star",
    category: "general",
    points: 5,
    rarity: "common",
  },
  {
    key: "feedback_submitted",
    name: "Voice Heard",
    description: "Submit a feature request or bug report",
    icon: "MessageSquare",
    category: "general",
    points: 10,
    rarity: "common",
  },
  {
    key: "profile_complete",
    name: "Identity Established",
    description: "Complete your profile with name and avatar",
    icon: "User",
    category: "general",
    points: 10,
    rarity: "common",
  },
  {
    key: "discord_connected",
    name: "Discord Linked",
    description: "Connect your Discord account",
    icon: "Link",
    category: "general",
    points: 15,
    rarity: "uncommon",
  },

  // Pokemon Achievements
  {
    key: "first_shiny",
    name: "Sparkle Hunter",
    description: "Record your first shiny Pokemon encounter",
    icon: "Sparkles",
    category: "pokemon",
    points: 20,
    rarity: "uncommon",
  },
  {
    key: "shiny_master",
    name: "Shiny Master",
    description: "Record 100 shiny Pokemon encounters",
    icon: "Award",
    category: "pokemon",
    points: 100,
    rarity: "legendary",
  },
  {
    key: "team_created",
    name: "Team Assembler",
    description: "Create your first Pokemon team",
    icon: "Users",
    category: "pokemon",
    points: 10,
    rarity: "common",
  },
  {
    key: "team_perfectionist",
    name: "Team Perfectionist",
    description: "Create a team with full type coverage",
    icon: "Shield",
    category: "pokemon",
    points: 25,
    rarity: "rare",
  },
  {
    key: "save_edited",
    name: "Save Surgeon",
    description: "Edit your first Pokemon save file",
    icon: "Edit",
    category: "pokemon",
    points: 15,
    rarity: "uncommon",
  },
  {
    key: "iv_calculator_used",
    name: "Stat Analyst",
    description: "Use the IV calculator to analyze a Pokemon",
    icon: "Calculator",
    category: "pokemon",
    points: 10,
    rarity: "common",
  },

  // R6 Achievements
  {
    key: "first_match",
    name: "First Blood",
    description: "Complete your first R6 1v1 match",
    icon: "Swords",
    category: "r6",
    points: 10,
    rarity: "common",
  },
  {
    key: "match_streak_5",
    name: "On Fire",
    description: "Win 5 matches in a row",
    icon: "Flame",
    category: "r6",
    points: 30,
    rarity: "rare",
  },
  {
    key: "tournament_join",
    name: "Tournament Contender",
    description: "Join your first tournament",
    icon: "Trophy",
    category: "r6",
    points: 15,
    rarity: "uncommon",
  },
  {
    key: "tournament_win",
    name: "Tournament Champion",
    description: "Win a tournament",
    icon: "Crown",
    category: "r6",
    points: 50,
    rarity: "epic",
  },
  {
    key: "flawless_victory",
    name: "Flawless Victory",
    description: "Win a match without dying",
    icon: "Zap",
    category: "r6",
    points: 25,
    rarity: "rare",
    isSecret: true,
  },
  {
    key: "lobby_host",
    name: "Party Starter",
    description: "Create your first lobby",
    icon: "Home",
    category: "r6",
    points: 5,
    rarity: "common",
  },

  // Minecraft Achievements
  {
    key: "server_checked",
    name: "Server Scout",
    description: "Check your first Minecraft server status",
    icon: "Server",
    category: "minecraft",
    points: 5,
    rarity: "common",
  },
  {
    key: "enchant_plan_created",
    name: "Enchantment Scholar",
    description: "Create your first enchantment plan",
    icon: "BookOpen",
    category: "minecraft",
    points: 10,
    rarity: "common",
  },
  {
    key: "max_enchants",
    name: "Enchantment Master",
    description: "Plan a fully enchanted item with all compatible enchantments",
    icon: "Wand",
    category: "minecraft",
    points: 25,
    rarity: "rare",
  },
];

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  uncommon: "text-green-400 bg-green-500/10 border-green-500/20",
  rare: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  epic: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  legendary: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

export const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  pokemon: "text-red-400",
  minecraft: "text-green-400",
  r6: "text-orange-400",
  general: "text-blue-400",
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  pokemon: "Pokemon",
  minecraft: "Minecraft",
  r6: "Rainbow Six",
  general: "General",
};

export function getAchievementByKey(key: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.key === key);
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

export function calculateTotalPoints(unlockedKeys: string[]): number {
  return unlockedKeys.reduce((total, key) => {
    const achievement = getAchievementByKey(key);
    return total + (achievement?.points || 0);
  }, 0);
}
