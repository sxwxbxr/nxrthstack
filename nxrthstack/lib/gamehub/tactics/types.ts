// ============================================================================
// Async PvP Tactics - Core Types
// ============================================================================

// --- Unit Classes ---
export type UnitClass = "Tank" | "Ranger" | "Healer" | "Assassin" | "Mage" | "Paladin" | "Berserker";

export interface ClassInfo {
  tagline: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export const CLASS_DESCRIPTIONS: Record<UnitClass, ClassInfo> = {
  Tank: {
    tagline: "Frontline Protectors",
    description:
      "Tanks are the backbone of any squad. With the highest HP and defense, they absorb damage and protect squishier allies. They shine in melee combat and can force enemies to focus them.",
    strengths: ["Highest HP pool", "Strong defense", "Can protect allies"],
    weaknesses: ["Slow movement speed", "Low damage output", "Short attack range"],
  },
  Ranger: {
    tagline: "Precision Strikers",
    description:
      "Rangers deal devastating damage from afar. With long attack range and high critical hit potential, they excel at eliminating priority targets before they get close. Positioning is key.",
    strengths: ["Long attack range", "High damage", "Strong critical hits"],
    weaknesses: ["Very fragile", "Low defense", "Vulnerable in melee"],
  },
  Healer: {
    tagline: "Battlefield Medics",
    description:
      "Healers keep your squad fighting. They restore HP, apply regeneration, and provide defensive buffs. A well-positioned healer can turn the tide of any battle.",
    strengths: ["Sustained healing", "Defensive buffs", "Good survivability"],
    weaknesses: ["Low damage output", "Dependent on positioning", "Limited offense"],
  },
  Assassin: {
    tagline: "Shadow Killers",
    description:
      "Assassins are glass cannons that specialize in eliminating high-value targets. With the highest speed and damage, they strike fast and hard. Their abilities let them dash in and vanish from danger.",
    strengths: ["Highest speed", "Burst damage", "Evasion abilities"],
    weaknesses: ["Very low HP", "Low defense", "Abilities require close range"],
  },
  Mage: {
    tagline: "Arcane Devastators",
    description:
      "Mages channel devastating magical energy from afar. Their spells can bypass armor and hit multiple targets. Fragile but deadly when protected by tanks and healers.",
    strengths: ["Bypasses defense", "AoE magic damage", "Long cast range"],
    weaknesses: ["Very fragile", "Slow movement", "Long cooldowns"],
  },
  Paladin: {
    tagline: "Holy Warriors",
    description:
      "Paladins blend martial prowess with divine magic. They can tank damage, heal allies, and buff nearby units. Jack-of-all-trades who anchor any formation.",
    strengths: ["Hybrid tank/healer", "Group buffs", "Self-sustain"],
    weaknesses: ["Lower damage than pure DPS", "Short range", "Spread thin between roles"],
  },
  Berserker: {
    tagline: "Raging Destroyers",
    description:
      "Berserkers grow stronger as they take damage. Their rage mechanic turns near-death into devastating power. High risk, high reward melee fighters.",
    strengths: ["Damage scales with missing HP", "AoE melee", "Survive lethal damage"],
    weaknesses: ["Must be low HP for max power", "No ranged options", "Moderate defense"],
  },
};

// --- Grid / Map ---
export type TileType = "ground" | "obstacle" | "cover";

export interface Position {
  x: number;
  y: number;
}

export interface GridTile {
  type: TileType;
  x: number;
  y: number;
}

export interface BattleMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  attackerDeployRows: number[];
  defenderDeployRows: number[];
}

// --- Abilities ---
export type AbilityEffectType = "damage" | "heal" | "buff" | "debuff" | "dash";

export interface Ability {
  id: string;
  name: string;
  cooldownTicks: number;
  range: number;
  effectType: AbilityEffectType;
  effectValue: number;
  duration: number; // ticks, 0 = instant
  aoe: boolean; // area of effect
  aoeRadius: number; // tiles
  description: string;
}

// --- Unit Templates ---
export interface UnitTemplate {
  id: string;
  name: string;
  class: UnitClass;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number; // action priority + movement (higher = faster)
  attackRange: number; // tiles
  critChance: number; // 0-1
  critMultiplier: number;
  abilities: Ability[];
  spriteKey: string;
  unlockCost: number; // soft currency
  description: string;
}

// --- Behavior System ---
export type BehaviorCondition =
  | "ENEMY_IN_RANGE"
  | "ALLY_LOW_HP"
  | "SELF_LOW_HP"
  | "NO_ENEMY_IN_RANGE"
  | "ABILITY_READY"
  | "ENEMY_LOW_HP"
  | "ALWAYS";

export type BehaviorAction =
  | "ATTACK_NEAREST"
  | "ATTACK_LOWEST_HP"
  | "ATTACK_HIGHEST_ATTACK"
  | "MOVE_TOWARDS_ENEMY"
  | "KITE"
  | "USE_ABILITY"
  | "HEAL_LOWEST_ALLY"
  | "HOLD_POSITION"
  | "MOVE_TO_COVER";

export interface BehaviorConditionEntry {
  condition: BehaviorCondition;
  conditionParam?: number;        // HP threshold %
  conditionStringParam?: string;  // Ability ID for ability_ready
}

export interface BehaviorRule {
  id: string;
  priority: number;
  condition: BehaviorCondition;               // legacy single condition
  conditionParam?: number;                    // legacy HP threshold %
  conditions?: BehaviorConditionEntry[];      // compound conditions (AND logic)
  action: BehaviorAction;
  actionParam?: string; // e.g., ability ID
}

export interface BehaviorPreset {
  id: string;
  name: string;
  description: string;
  rules: BehaviorRule[];
}

// --- Equipment ---
export type EquipmentSlot =
  | "weapon"
  | "shield"
  | "helmet"
  | "chestpiece"
  | "pants"
  | "boots"
  | "ring1"
  | "ring2"
  | "necklace";

export const ALL_EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "weapon", "shield", "helmet", "chestpiece", "pants", "boots", "ring1", "ring2", "necklace",
];

export type StatType = "hp" | "attack" | "defense" | "speed" | "critChance" | "critDamage";

export interface EquipmentStat {
  stat: StatType;
  value: number;
}

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  rarity: import("./rarities").Rarity;
  stats: EquipmentStat[];
  enchantLevel: number;
  cursed: boolean;
  curseStats: EquipmentStat[];
  equipmentLevel: number;
  equipmentXp: number;
}

// --- Unit Instances ---
export interface UnitInstance {
  id: string;
  templateId: string;
  rarity: import("./rarities").Rarity;
  level: number;
  xp: number;
}

// --- Computed Stats (after rarity, level, equipment) ---
export interface ComputedUnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  critChance: number;
  critMultiplier: number;
}

// --- Squad ---
export interface SquadUnit {
  unitInstanceId?: string; // links to tactics_unit_instances (new)
  templateId: string;
  instanceId: string;
  behaviorRules: BehaviorRule[];
  behaviorScript?: string; // TacticsScript source (advanced mode)
  position: Position;
}

export interface Squad {
  units: SquadUnit[];
}

// --- Battle Simulation ---
export type BattleEventType =
  | "MOVE"
  | "ATTACK"
  | "ABILITY"
  | "DAMAGE"
  | "HEAL"
  | "DEATH"
  | "BUFF"
  | "DEBUFF"
  | "BATTLE_START"
  | "BATTLE_END";

export interface BattleEvent {
  tick: number;
  type: BattleEventType;
  unitId?: string;
  targetId?: string;
  fromPosition?: Position;
  toPosition?: Position;
  value?: number;
  abilityId?: string;
  isCrit?: boolean;
  winner?: "attacker" | "defender";
  reason?: string;
}

export type UnitSide = "attacker" | "defender";

export interface BattleUnit {
  instanceId: string;
  templateId: string;
  side: UnitSide;
  position: Position;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  critChance: number;
  critMultiplier: number;
  abilities: Ability[];
  abilityCooldowns: Record<string, number>; // abilityId → tick when ready
  behaviorRules: BehaviorRule[];
  perks: string[];
  isAlive: boolean;
  buffs: ActiveBuff[];
}

export interface ActiveBuff {
  abilityId: string;
  effectType: "buff" | "debuff";
  value: number;
  expiresAtTick: number;
}

export interface GameState {
  map: BattleMap;
  units: BattleUnit[];
  tick: number;
  events: BattleEvent[];
  winner: "attacker" | "defender" | null;
}

export interface BattleStats {
  attackerDamageDealt: number;
  defenderDamageDealt: number;
  attackerUnitsLost: number;
  defenderUnitsLost: number;
  attackerHealingDone: number;
  defenderHealingDone: number;
  totalTicks: number;
}

export interface BattleResult {
  winner: "attacker" | "defender";
  events: BattleEvent[];
  stats: BattleStats;
  durationTicks: number;
  seed: number;
  mapId: string;
}

// --- Match / Rating ---
export interface RatingChange {
  attackerChange: number;
  defenderChange: number;
}

export interface MatchData {
  matchId: string;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  attackerRatingBefore: number;
  defenderRatingBefore: number;
  attackerRatingChange: number;
  defenderRatingChange: number;
  winner: "attacker" | "defender";
  durationSeconds: number;
  stats: BattleStats;
  currencyEarned: number;
  createdAt: string;
}
