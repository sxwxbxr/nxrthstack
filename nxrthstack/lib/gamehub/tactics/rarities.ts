// ============================================================================
// Rarity System
// ============================================================================

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "secret";

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "secret",
];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  secret: "Secret",
};

// Tailwind-compatible color classes
export const RARITY_COLORS: Record<Rarity, string> = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-orange-400",
  mythic: "text-red-400",
  secret: "text-pink-400",
};

export const RARITY_BG_COLORS: Record<Rarity, string> = {
  common: "bg-gray-500/10",
  uncommon: "bg-green-500/10",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-orange-500/10",
  mythic: "bg-red-500/10",
  secret: "bg-pink-500/10",
};

export const RARITY_BORDERS: Record<Rarity, string> = {
  common: "border-gray-500/30",
  uncommon: "border-green-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-orange-500/30",
  mythic: "border-red-500/30",
  secret: "border-pink-500/30",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "",
  uncommon: "",
  rare: "shadow-blue-500/20 shadow-lg",
  epic: "shadow-purple-500/20 shadow-lg",
  legendary: "shadow-orange-500/25 shadow-xl",
  mythic: "shadow-red-500/30 shadow-xl",
  secret: "shadow-pink-500/40 shadow-2xl",
};

// Stat multipliers per rarity (applied to base template stats)
export const RARITY_STAT_MULTIPLIER: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.05,
  rare: 1.12,
  epic: 1.2,
  legendary: 1.3,
  mythic: 1.42,
  secret: 1.55,
};

// Max troop level per rarity
export const RARITY_MAX_LEVEL: Record<Rarity, number> = {
  common: 10,
  uncommon: 20,
  rare: 30,
  epic: 40,
  legendary: 50,
  mythic: 60,
  secret: 75,
};

// XP required to reach a given level
const BASE_XP = 50;
export function xpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, 1.3));
}

// Total XP needed from level 1 to targetLevel
export function totalXpForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 2; l <= targetLevel; l++) {
    total += xpForLevel(l);
  }
  return total;
}

// Rarity index (for comparisons)
export function rarityIndex(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

// Equipment stat count per rarity
export const RARITY_STAT_COUNT: Record<Rarity, [number, number]> = {
  common: [1, 1],
  uncommon: [1, 2],
  rare: [1, 2],
  epic: [2, 3],
  legendary: [2, 3],
  mythic: [2, 3],
  secret: [3, 3],
};
