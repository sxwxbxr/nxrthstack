import type { UnitTemplate } from "./types";
import {
  SHIELD_WALL,
  TAUNT,
  VOLLEY,
  PIERCING_SHOT,
  HEAL,
  GROUP_HEAL,
  REGENERATION,
  NATURES_SHIELD,
  BACKSTAB,
  VANISH,
  POISON_STRIKE,
  SMOKE_BOMB,
} from "./abilities";

// ============================================================================
// Unit Templates - 8 units (2 per class)
// ============================================================================

// --- Tanks ---
export const KNIGHT: UnitTemplate = {
  id: "knight",
  name: "Knight",
  class: "Tank",
  maxHp: 120,
  attack: 10,
  defense: 8,
  speed: 3,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [SHIELD_WALL],
  spriteKey: "knight",
  unlockCost: 0, // starter
  description: "A heavily armored warrior. High HP and defense, slow but powerful.",
};

export const GUARDIAN: UnitTemplate = {
  id: "guardian",
  name: "Guardian",
  class: "Tank",
  maxHp: 100,
  attack: 8,
  defense: 7,
  speed: 4,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [TAUNT],
  spriteKey: "guardian",
  unlockCost: 200,
  description: "A protector who forces enemies to attack them. Moderate stats with taunt.",
};

// --- Rangers ---
export const ARCHER: UnitTemplate = {
  id: "archer",
  name: "Archer",
  class: "Ranger",
  maxHp: 70,
  attack: 12,
  defense: 3,
  speed: 5,
  attackRange: 4,
  critChance: 0.1,
  critMultiplier: 1.8,
  abilities: [VOLLEY],
  spriteKey: "archer",
  unlockCost: 0, // starter
  description: "A ranged attacker with area damage. Good range, fragile.",
};

export const SNIPER: UnitTemplate = {
  id: "sniper",
  name: "Sniper",
  class: "Ranger",
  maxHp: 55,
  attack: 16,
  defense: 2,
  speed: 4,
  attackRange: 5,
  critChance: 0.2,
  critMultiplier: 2.0,
  abilities: [PIERCING_SHOT],
  spriteKey: "sniper",
  unlockCost: 300,
  description: "Extreme range and damage. Very fragile but devastating crits.",
};

// --- Healers ---
export const CLERIC: UnitTemplate = {
  id: "cleric",
  name: "Cleric",
  class: "Healer",
  maxHp: 80,
  attack: 6,
  defense: 4,
  speed: 5,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [HEAL, GROUP_HEAL],
  spriteKey: "cleric",
  unlockCost: 0, // starter
  description: "A versatile healer with single-target and group healing.",
};

export const DRUID: UnitTemplate = {
  id: "druid",
  name: "Druid",
  class: "Healer",
  maxHp: 75,
  attack: 7,
  defense: 4,
  speed: 5,
  attackRange: 2,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [REGENERATION, NATURES_SHIELD],
  spriteKey: "druid",
  unlockCost: 250,
  description: "Nature's guardian. Grants regeneration and defensive buffs to allies.",
};

// --- Assassins ---
export const SHADOW: UnitTemplate = {
  id: "shadow",
  name: "Shadow",
  class: "Assassin",
  maxHp: 60,
  attack: 15,
  defense: 2,
  speed: 7,
  attackRange: 1,
  critChance: 0.2,
  critMultiplier: 2.0,
  abilities: [BACKSTAB, VANISH],
  spriteKey: "shadow",
  unlockCost: 0, // starter
  description: "A deadly striker. Dashes in, deals massive damage, vanishes.",
};

export const ROGUE: UnitTemplate = {
  id: "rogue",
  name: "Rogue",
  class: "Assassin",
  maxHp: 65,
  attack: 13,
  defense: 3,
  speed: 6,
  attackRange: 1,
  critChance: 0.15,
  critMultiplier: 1.8,
  abilities: [POISON_STRIKE, SMOKE_BOMB],
  spriteKey: "rogue",
  unlockCost: 250,
  description: "A cunning fighter. Poisons enemies and creates cover with smoke.",
};

// --- Lookup ---
export const ALL_UNITS: Record<string, UnitTemplate> = {
  knight: KNIGHT,
  guardian: GUARDIAN,
  archer: ARCHER,
  sniper: SNIPER,
  cleric: CLERIC,
  druid: DRUID,
  shadow: SHADOW,
  rogue: ROGUE,
};

export const STARTER_UNIT_IDS = ["knight", "archer", "cleric", "shadow"];

export const UNIT_LIST = Object.values(ALL_UNITS);
