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
  maxHp: 100,
  attack: 14,
  defense: 8,
  speed: 3,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [SHIELD_WALL],
  spriteKey: "knight",
  unlockCost: 0, // starter
  description: "A heavily armored warrior who leads the charge. Excels at soaking damage and holding the frontline.",
};

export const GUARDIAN: UnitTemplate = {
  id: "guardian",
  name: "Guardian",
  class: "Tank",
  maxHp: 85,
  attack: 11,
  defense: 7,
  speed: 4,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [TAUNT],
  spriteKey: "guardian",
  unlockCost: 200,
  description: "A stalwart protector who forces enemies to attack them. Draws fire away from fragile allies.",
};

// --- Rangers ---
export const ARCHER: UnitTemplate = {
  id: "archer",
  name: "Archer",
  class: "Ranger",
  maxHp: 55,
  attack: 16,
  defense: 3,
  speed: 5,
  attackRange: 4,
  critChance: 0.1,
  critMultiplier: 1.8,
  abilities: [VOLLEY],
  spriteKey: "archer",
  unlockCost: 0, // starter
  description: "A versatile ranged attacker who rains arrows on enemy clusters. Deadly in groups but fragile up close.",
};

export const SNIPER: UnitTemplate = {
  id: "sniper",
  name: "Sniper",
  class: "Ranger",
  maxHp: 45,
  attack: 20,
  defense: 2,
  speed: 4,
  attackRange: 5,
  critChance: 0.2,
  critMultiplier: 2.0,
  abilities: [PIERCING_SHOT],
  spriteKey: "sniper",
  unlockCost: 300,
  description: "Extreme range marksman with armor-piercing rounds. Devastating crits but paper-thin defenses.",
};

// --- Healers ---
export const CLERIC: UnitTemplate = {
  id: "cleric",
  name: "Cleric",
  class: "Healer",
  maxHp: 65,
  attack: 8,
  defense: 4,
  speed: 5,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [HEAL, GROUP_HEAL],
  spriteKey: "cleric",
  unlockCost: 0, // starter
  description: "A versatile battlefield medic with powerful single-target and group healing. Essential for prolonged fights.",
};

export const DRUID: UnitTemplate = {
  id: "druid",
  name: "Druid",
  class: "Healer",
  maxHp: 60,
  attack: 10,
  defense: 4,
  speed: 5,
  attackRange: 2,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [REGENERATION, NATURES_SHIELD],
  spriteKey: "druid",
  unlockCost: 250,
  description: "Nature's guardian who channels sustained healing and defensive buffs. Keeps allies alive through attrition.",
};

// --- Assassins ---
export const SHADOW: UnitTemplate = {
  id: "shadow",
  name: "Shadow",
  class: "Assassin",
  maxHp: 50,
  attack: 20,
  defense: 2,
  speed: 7,
  attackRange: 1,
  critChance: 0.2,
  critMultiplier: 2.0,
  abilities: [BACKSTAB, VANISH],
  spriteKey: "shadow",
  unlockCost: 0, // starter
  description: "A deadly phantom who dashes into the backline, delivers lethal strikes, then vanishes into thin air.",
};

export const ROGUE: UnitTemplate = {
  id: "rogue",
  name: "Rogue",
  class: "Assassin",
  maxHp: 55,
  attack: 17,
  defense: 3,
  speed: 6,
  attackRange: 1,
  critChance: 0.15,
  critMultiplier: 1.8,
  abilities: [POISON_STRIKE, SMOKE_BOMB],
  spriteKey: "rogue",
  unlockCost: 250,
  description: "A cunning trickster who poisons enemies and deploys smoke for allied defense. Wins through attrition.",
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

/** Lookup by template ID */
export const UNIT_MAP: Record<string, UnitTemplate> = ALL_UNITS;
