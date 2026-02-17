import type { EquipmentItem, EquipmentSlot, EquipmentStat, StatType } from "./types";
import type { Rarity } from "./rarities";
import { RARITY_ORDER, RARITY_STAT_COUNT } from "./rarities";

// ============================================================================
// Equipment Generation, Rerolling, and Shop Pricing
// ============================================================================

// --- Stat Ranges by Rarity ---
// [min, max] for primary and secondary stats
interface StatRange {
  primary: [number, number];
  secondary: [number, number];
}

export const STAT_RANGES_BY_RARITY: Record<Rarity, StatRange> = {
  common:    { primary: [1, 3],   secondary: [0, 1] },
  uncommon:  { primary: [2, 5],   secondary: [1, 2] },
  rare:      { primary: [3, 7],   secondary: [1, 3] },
  epic:      { primary: [5, 10],  secondary: [2, 5] },
  legendary: { primary: [8, 14],  secondary: [3, 7] },
  mythic:    { primary: [11, 18], secondary: [5, 10] },
  secret:    { primary: [15, 25], secondary: [7, 14] },
};

// --- Slot-specific stat templates ---
interface SlotTemplate {
  primary: StatType;
  secondaryOptions: StatType[];
}

export const SLOT_TEMPLATES: Record<EquipmentSlot, SlotTemplate> = {
  weapon:     { primary: "attack",     secondaryOptions: ["critChance", "critDamage", "speed"] },
  shield:     { primary: "defense",    secondaryOptions: ["hp", "speed"] },
  helmet:     { primary: "defense",    secondaryOptions: ["hp", "critDamage"] },
  chestpiece: { primary: "hp",         secondaryOptions: ["defense", "attack"] },
  pants:      { primary: "defense",    secondaryOptions: ["speed", "hp"] },
  boots:      { primary: "speed",      secondaryOptions: ["defense", "hp"] },
  ring1:      { primary: "attack",     secondaryOptions: ["hp", "defense", "speed", "critChance", "critDamage"] },
  ring2:      { primary: "critChance", secondaryOptions: ["hp", "defense", "speed", "attack", "critDamage"] },
  necklace:   { primary: "critChance", secondaryOptions: ["critDamage", "attack", "hp"] },
};

// --- Equipment Names ---
const SLOT_NAME_PREFIXES: Record<string, string[]> = {
  weapon:     ["Iron Blade", "Steel Sword", "War Axe", "Battle Mace", "Shadow Dagger"],
  shield:     ["Iron Shield", "Tower Shield", "Buckler", "War Guard", "Bulwark"],
  helmet:     ["Iron Helm", "War Crown", "Battle Hood", "Knight Visor", "Skull Cap"],
  chestpiece: ["Chain Mail", "Plate Armor", "Battle Vest", "War Cuirass", "Scale Tunic"],
  pants:      ["Chain Leggings", "Plate Greaves", "Battle Trousers", "War Pants", "Scale Legs"],
  boots:      ["Iron Boots", "War Treads", "Swift Shoes", "Battle Stompers", "Shadow Steps"],
  ring1:      ["Band of Power", "Signet Ring", "War Band", "Iron Loop", "Shadow Ring"],
  ring2:      ["Mystic Ring", "Fortune Band", "Fate Loop", "Crystal Ring", "Storm Band"],
  necklace:   ["War Pendant", "Battle Charm", "Iron Amulet", "Shadow Locket", "Storm Necklace"],
};

const RARITY_NAME_PREFIX: Record<Rarity, string> = {
  common: "",
  uncommon: "Fine ",
  rare: "Superior ",
  epic: "Exalted ",
  legendary: "Legendary ",
  mythic: "Mythic ",
  secret: "Enigmatic ",
};

// --- Shop Prices ---
export const EQUIPMENT_SHOP_PRICES: Record<Rarity, number> = {
  common: 100,
  uncommon: 250,
  rare: 600,
  epic: 1500,
  legendary: 4000,
  mythic: 10000,
  secret: 0, // Cannot buy secret rarity
};

// Sell refund: 30% of purchase price
export function getSellPrice(rarity: Rarity): number {
  return Math.floor(EQUIPMENT_SHOP_PRICES[rarity] * 0.3);
}

// --- Reroll Costs ---
export function getRerollCost(rarity: Rarity, lockedCount: number): number {
  const rarityIndex = RARITY_ORDER.indexOf(rarity);
  const baseCost = 50 * (1 + rarityIndex * 0.5);
  const lockMultiplier = 1 + lockedCount; // Each lock doubles base
  return Math.floor(baseCost * lockMultiplier);
}

// --- Seeded Random ---
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Weighted random stat value: higher values are exponentially rarer.
 * Uses a power curve: value = min + floor((max-min) * random^2)
 */
function weightedStatValue(rng: SeededRandom, min: number, max: number): number {
  const roll = rng.next();
  // Square the roll to skew towards lower values (higher = rarer)
  const curved = roll * roll;
  return min + Math.floor((max - min + 1) * curved);
}

/**
 * Generate a random equipment item.
 */
export function generateEquipment(
  slot: EquipmentSlot,
  rarity: Rarity,
  seed: number
): Omit<EquipmentItem, "id"> {
  const rng = new SeededRandom(seed);
  const template = SLOT_TEMPLATES[slot];
  const ranges = STAT_RANGES_BY_RARITY[rarity];
  const [minStats, maxStats] = RARITY_STAT_COUNT[rarity];
  const statCount = rng.nextInt(minStats, maxStats);

  const stats: EquipmentStat[] = [];

  // Primary stat always included
  stats.push({
    stat: template.primary,
    value: weightedStatValue(rng, ranges.primary[0], ranges.primary[1]),
  });

  // Add secondary stats
  const availableSecondaries = [...template.secondaryOptions];
  for (let i = 1; i < statCount && availableSecondaries.length > 0; i++) {
    const idx = rng.nextInt(0, availableSecondaries.length - 1);
    const stat = availableSecondaries.splice(idx, 1)[0];
    stats.push({
      stat,
      value: weightedStatValue(rng, ranges.secondary[0], ranges.secondary[1]),
    });
  }

  // Generate name
  const names = SLOT_NAME_PREFIXES[slot] ?? ["Equipment"];
  const baseName = names[rng.nextInt(0, names.length - 1)];
  const name = `${RARITY_NAME_PREFIX[rarity]}${baseName}`;

  return {
    slot,
    name,
    rarity,
    stats,
    enchantLevel: 0,
    cursed: false,
    curseStats: [],
  };
}

/**
 * Reroll stats on equipment, preserving locked stats.
 * Returns new stats array.
 */
export function rerollStats(
  equipment: EquipmentItem,
  lockedStatIndices: number[],
  seed: number
): EquipmentStat[] {
  const rng = new SeededRandom(seed);
  const ranges = STAT_RANGES_BY_RARITY[equipment.rarity as Rarity];
  const template = SLOT_TEMPLATES[equipment.slot];

  const newStats: EquipmentStat[] = [];

  for (let i = 0; i < equipment.stats.length; i++) {
    if (lockedStatIndices.includes(i)) {
      // Keep locked stats
      newStats.push({ ...equipment.stats[i] });
    } else {
      // Reroll: use same stat type, new value
      const isPrimary = equipment.stats[i].stat === template.primary;
      const range = isPrimary ? ranges.primary : ranges.secondary;
      newStats.push({
        stat: equipment.stats[i].stat,
        value: weightedStatValue(rng, range[0], range[1]),
      });
    }
  }

  return newStats;
}

/**
 * Get the stat range for a given equipment item's stat index.
 * Used to show possible ranges in the UI.
 */
export function getStatRange(
  equipment: EquipmentItem,
  statIndex: number
): [number, number] {
  const ranges = STAT_RANGES_BY_RARITY[equipment.rarity as Rarity];
  const template = SLOT_TEMPLATES[equipment.slot];
  const isPrimary = equipment.stats[statIndex]?.stat === template.primary;
  return isPrimary ? ranges.primary : ranges.secondary;
}

// All available slots for buying
export const BUYABLE_SLOTS: EquipmentSlot[] = [
  "weapon", "shield", "helmet", "chestpiece", "pants", "boots", "ring1", "ring2", "necklace",
];

// Rarities available in the shop
export const BUYABLE_RARITIES: Rarity[] = [
  "common", "uncommon", "rare", "epic", "legendary", "mythic",
];
