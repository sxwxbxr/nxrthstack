import type { Rarity } from "./rarities";
import { RARITY_ORDER } from "./rarities";
import { EQUIPMENT_SHOP_PRICES } from "./equipment";

// ============================================================================
// Equipment Fusion — Combine 3 same-rarity items into 1 higher-rarity item
// ============================================================================

/** Fusion cost: 50% of next-rarity shop price */
export const FUSION_COSTS: Record<Rarity, number> = {
  common: Math.floor(EQUIPMENT_SHOP_PRICES.uncommon * 0.5),     // 125
  uncommon: Math.floor(EQUIPMENT_SHOP_PRICES.rare * 0.5),       // 300
  rare: Math.floor(EQUIPMENT_SHOP_PRICES.epic * 0.5),           // 750
  epic: Math.floor(EQUIPMENT_SHOP_PRICES.legendary * 0.5),      // 2000
  legendary: Math.floor(EQUIPMENT_SHOP_PRICES.mythic * 0.5),    // 5000
  mythic: 0, // Cannot fuse mythic (would need secret which isn't buyable)
  secret: 0, // Cannot fuse secret
};

/** Get the next rarity tier */
export function getNextRarity(rarity: Rarity): Rarity | null {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) return null;
  return RARITY_ORDER[idx + 1];
}

/** Check if a rarity can be fused */
export function canFuseRarity(rarity: Rarity): boolean {
  const next = getNextRarity(rarity);
  return next !== null && rarity !== "mythic" && rarity !== "secret";
}

/** Get fusion cost for a given rarity */
export function getFusionCost(rarity: Rarity): number {
  return FUSION_COSTS[rarity];
}
