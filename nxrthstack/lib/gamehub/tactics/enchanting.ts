import type { EquipmentItem, EquipmentStat, StatType } from "./types";
import type { Rarity } from "./rarities";
import { RARITY_ORDER } from "./rarities";

// ============================================================================
// Wizard Tower - Enchanting System
// ============================================================================

// Max enchant level
export const MAX_ENCHANT_LEVEL = 7;

// Enchant costs: baseCost * rarityMult * (1 + enchantLevel * 0.5)
const BASE_ENCHANT_COST = 200;

export function getEnchantCost(rarity: Rarity, enchantLevel: number, safe?: boolean): number {
  const rarityIdx = RARITY_ORDER.indexOf(rarity);
  const rarityMult = 1 + rarityIdx * 0.3;
  const base = Math.floor(BASE_ENCHANT_COST * rarityMult * (1 + enchantLevel * 0.5));
  return safe ? base * 3 : base;
}

// Success rates per enchant level (0→1, 1→2, etc.)
const BASE_SUCCESS_RATES: number[] = [0.90, 0.75, 0.60, 0.45, 0.30, 0.15, 0.05];

// Rarity modifier (common gets bonus, mythic gets penalty)
const RARITY_SUCCESS_MOD: Record<Rarity, number> = {
  common: 0.10,
  uncommon: 0.05,
  rare: 0.0,
  epic: -0.03,
  legendary: -0.05,
  mythic: -0.10,
  secret: -0.08,
};

export function getSuccessRate(rarity: Rarity, enchantLevel: number): number {
  if (enchantLevel >= MAX_ENCHANT_LEVEL) return 0;
  const base = BASE_SUCCESS_RATES[enchantLevel] ?? 0.05;
  const mod = RARITY_SUCCESS_MOD[rarity] ?? 0;
  return Math.max(0.01, Math.min(0.99, base + mod));
}

// Neutral chance on failure
const NEUTRAL_CHANCE = 0.10;

export type EnchantResult = "success" | "curse" | "neutral";

const ENCHANT_STAT_TYPES: StatType[] = ["hp", "attack", "defense", "speed", "critChance", "critDamage"];

/**
 * Attempt to enchant equipment.
 * Returns the result and updated equipment fields.
 */
export function attemptEnchant(
  equipment: EquipmentItem,
  seed: number,
  safe?: boolean
): {
  result: EnchantResult;
  newEnchantLevel: number;
  statBoost?: EquipmentStat;
  curseStat?: EquipmentStat;
} {
  const rng = createSimpleRng(seed);
  const successRate = getSuccessRate(equipment.rarity as Rarity, equipment.enchantLevel);

  const roll = rng();

  if (roll < successRate) {
    // Success: +1 enchant level, boost a random stat
    const statIdx = Math.floor(rng() * equipment.stats.length);
    const boostValue = 1 + Math.floor(rng() * 3); // 1-3

    return {
      result: "success",
      newEnchantLevel: equipment.enchantLevel + 1,
      statBoost: {
        stat: equipment.stats[statIdx]?.stat ?? "attack",
        value: boostValue,
      },
    };
  }

  // Failure
  if (safe || rng() < NEUTRAL_CHANCE) {
    // Safe mode: always neutral on failure. Regular mode: 10% neutral chance.
    return {
      result: "neutral",
      newEnchantLevel: equipment.enchantLevel,
    };
  }

  // Curse: add or worsen a curse stat (only in regular mode)
  const curseStat = ENCHANT_STAT_TYPES[Math.floor(rng() * ENCHANT_STAT_TYPES.length)];
  const curseValue = 1 + Math.floor(rng() * 3); // 1-3

  return {
    result: "curse",
    newEnchantLevel: equipment.enchantLevel,
    curseStat: {
      stat: curseStat,
      value: curseValue,
    },
  };
}

/** Simple seeded random for enchanting */
function createSimpleRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}
