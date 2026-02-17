import type { UnitTemplate, ComputedUnitStats, EquipmentItem, UnitInstance, StatType } from "./types";
import { RARITY_STAT_MULTIPLIER, type Rarity } from "./rarities";

// ============================================================================
// Stat Computation Layer
// Computes final unit stats from: base template + rarity + level + equipment
// ============================================================================

// Primary stat per class (gets bonus from leveling)
const CLASS_PRIMARY_STATS: Record<string, StatType[]> = {
  Tank: ["hp", "defense"],
  Ranger: ["attack", "critChance"],
  Healer: ["hp", "speed"],
  Assassin: ["attack", "speed"],
};

// Level bonus: +1 per 5 levels to each primary stat for the class
function getLevelBonus(unitClass: string, level: number, stat: StatType): number {
  const primaries = CLASS_PRIMARY_STATS[unitClass] ?? [];
  if (!primaries.includes(stat)) return 0;

  return Math.floor(level / 5);
}

// Sum equipment stat bonuses for a specific stat
function getEquipmentBonus(equipment: EquipmentItem[], stat: StatType): number {
  let total = 0;
  for (const item of equipment) {
    for (const s of item.stats) {
      if (s.stat === stat) total += s.value;
    }
    // Subtract curse penalties
    if (item.cursed && item.curseStats) {
      for (const s of item.curseStats) {
        if (s.stat === stat) total -= s.value;
      }
    }
  }
  return total;
}

/**
 * Compute final unit stats for battle or display.
 * Formula: floor(baseStat * rarityMultiplier + levelBonus + equipmentBonus)
 */
export function computeUnitStats(
  template: UnitTemplate,
  instance?: UnitInstance | null,
  equipment?: EquipmentItem[]
): ComputedUnitStats {
  const rarity: Rarity = instance?.rarity ?? "common";
  const level = instance?.level ?? 1;
  const mult = RARITY_STAT_MULTIPLIER[rarity];
  const equip = equipment ?? [];

  return {
    maxHp: Math.floor(
      template.maxHp * mult +
      getLevelBonus(template.class, level, "hp") * 5 + // HP bonus is ×5
      getEquipmentBonus(equip, "hp")
    ),
    attack: Math.floor(
      template.attack * mult +
      getLevelBonus(template.class, level, "attack") +
      getEquipmentBonus(equip, "attack")
    ),
    defense: Math.floor(
      template.defense * mult +
      getLevelBonus(template.class, level, "defense") +
      getEquipmentBonus(equip, "defense")
    ),
    speed: Math.floor(
      template.speed * mult +
      getLevelBonus(template.class, level, "speed") +
      getEquipmentBonus(equip, "speed")
    ),
    attackRange: template.attackRange, // range unaffected by rarity/level
    critChance: Math.min(
      0.75, // cap at 75%
      template.critChance * mult +
      getLevelBonus(template.class, level, "critChance") * 0.01 +
      getEquipmentBonus(equip, "critChance") * 0.01
    ),
    critMultiplier: Math.min(
      3.0, // cap at 3x
      template.critMultiplier +
      getEquipmentBonus(equip, "critDamage") * 0.05
    ),
  };
}

/**
 * Get a breakdown of stat sources for UI display.
 */
export function getStatBreakdown(
  template: UnitTemplate,
  instance?: UnitInstance | null,
  equipment?: EquipmentItem[]
): Record<StatType, { base: number; rarity: number; level: number; equipment: number; total: number }> {
  const rarity: Rarity = instance?.rarity ?? "common";
  const level = instance?.level ?? 1;
  const mult = RARITY_STAT_MULTIPLIER[rarity];
  const equip = equipment ?? [];

  const stats: StatType[] = ["hp", "attack", "defense", "speed", "critChance", "critDamage"];
  const breakdown: Record<string, { base: number; rarity: number; level: number; equipment: number; total: number }> = {};

  for (const stat of stats) {
    const base = stat === "hp" ? template.maxHp
      : stat === "attack" ? template.attack
      : stat === "defense" ? template.defense
      : stat === "speed" ? template.speed
      : stat === "critChance" ? Math.round(template.critChance * 100)
      : stat === "critDamage" ? Math.round(template.critMultiplier * 100)
      : 0;

    const rarityBonus = Math.floor(base * (mult - 1));
    const levelBonus = stat === "hp"
      ? getLevelBonus(template.class, level, stat) * 5
      : getLevelBonus(template.class, level, stat);
    const equipBonus = getEquipmentBonus(equip, stat);

    breakdown[stat] = {
      base,
      rarity: rarityBonus,
      level: levelBonus,
      equipment: equipBonus,
      total: base + rarityBonus + levelBonus + equipBonus,
    };
  }

  return breakdown as Record<StatType, { base: number; rarity: number; level: number; equipment: number; total: number }>;
}
