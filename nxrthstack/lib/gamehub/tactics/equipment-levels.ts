import type { Rarity } from "./rarities";

// ============================================================================
// Equipment Leveling System
// ============================================================================

/** Max equipment level per rarity */
export const EQUIPMENT_MAX_LEVEL: Record<Rarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 15,
  epic: 20,
  legendary: 25,
  mythic: 30,
  secret: 40,
};

/** XP required to reach a given equipment level */
export function equipmentXpForLevel(level: number): number {
  return Math.floor(30 * Math.pow(level, 1.4));
}

/** Total XP needed from level 1 to targetLevel */
export function totalEquipmentXpForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 2; l <= targetLevel; l++) {
    total += equipmentXpForLevel(l);
  }
  return total;
}

/**
 * Compute the scaled value of an equipment stat at a given equipment level.
 * +3% compounding per level above 1.
 */
export function computeEquipmentStatAtLevel(baseValue: number, equipmentLevel: number): number {
  return Math.floor(baseValue * Math.pow(1.03, equipmentLevel - 1));
}

/** Equipment XP rewards per battle */
export function getEquipmentXpReward(won: boolean, isAttacker: boolean): number {
  if (isAttacker) {
    return won ? 30 : 10;
  }
  // Defender
  return won ? 15 : 5;
}
