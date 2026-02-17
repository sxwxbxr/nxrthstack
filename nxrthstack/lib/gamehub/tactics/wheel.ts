import type { Rarity } from "./rarities";
import { RARITY_ORDER } from "./rarities";
import { UNIT_LIST } from "./units";

// ============================================================================
// Lucky Wheel
// ============================================================================

export const WHEEL_BASE_COST = 500;

/** Escalating cost: 500 * (1 + spinCount * 0.2) */
export function getWheelCost(spinCount: number): number {
  return Math.floor(WHEEL_BASE_COST * (1 + spinCount * 0.2));
}

/** Rarity weights for the wheel */
export const WHEEL_RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: "common", weight: 40 },
  { rarity: "uncommon", weight: 25 },
  { rarity: "rare", weight: 18 },
  { rarity: "epic", weight: 10 },
  { rarity: "legendary", weight: 5 },
  { rarity: "mythic", weight: 1.5 },
  { rarity: "secret", weight: 0.5 },
];

const TOTAL_WEIGHT = WHEEL_RARITY_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);

/** Duplicate compensation: 50% of the wheel cost */
export function getDuplicateCompensation(costPaid: number): number {
  return Math.floor(costPaid * 0.5);
}

/** Spin the wheel and get a result */
export function spinWheel(seed: number): { templateId: string; rarity: Rarity } {
  let s = seed;
  const rng = () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };

  // Pick rarity
  let roll = rng() * TOTAL_WEIGHT;
  let rarity: Rarity = "common";
  for (const w of WHEEL_RARITY_WEIGHTS) {
    roll -= w.weight;
    if (roll <= 0) {
      rarity = w.rarity;
      break;
    }
  }

  // Pick random unit template
  const unitIdx = Math.floor(rng() * UNIT_LIST.length);
  const templateId = UNIT_LIST[unitIdx].id;

  return { templateId, rarity };
}

/** Get display data for the wheel segments */
export function getWheelSegments(): { templateId: string; rarity: Rarity; unitName: string; weight: number }[] {
  const segments: { templateId: string; rarity: Rarity; unitName: string; weight: number }[] = [];

  for (const w of WHEEL_RARITY_WEIGHTS) {
    for (const unit of UNIT_LIST) {
      segments.push({
        templateId: unit.id,
        rarity: w.rarity,
        unitName: unit.name,
        weight: w.weight / UNIT_LIST.length,
      });
    }
  }

  return segments;
}
