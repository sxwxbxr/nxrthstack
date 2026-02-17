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
  FIREBALL,
  ARCANE_BLAST,
  SHIELD_BASH,
  DIVINE_LIGHT,
  HOLY_AURA,
  RAGE,
  WHIRLWIND,
  COUNTER_STANCE,
  AOE_TAUNT,
  BOLT_SHOT,
  TOTEM_PULSE,
  SHURIKEN,
  SHADOW_DODGE,
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

// --- Tanks (extra) ---
export const WARDEN: UnitTemplate = {
  id: "warden",
  name: "Warden",
  class: "Tank",
  maxHp: 120,
  attack: 12,
  defense: 9,
  speed: 3,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [AOE_TAUNT, SHIELD_WALL],
  spriteKey: "warden",
  unlockCost: 350,
  description: "An imposing fortress of armor who forces entire groups to focus them. Unmatched at protecting backline allies.",
};

// --- Rangers (extra) ---
export const CROSSBOWMAN: UnitTemplate = {
  id: "crossbowman",
  name: "Crossbowman",
  class: "Ranger",
  maxHp: 50,
  attack: 18,
  defense: 3,
  speed: 5,
  attackRange: 3,
  critChance: 0.12,
  critMultiplier: 1.8,
  abilities: [BOLT_SHOT, VOLLEY],
  spriteKey: "crossbowman",
  unlockCost: 300,
  description: "A medium-range marksman with armor-piercing bolts. Trades range for raw damage output.",
};

// --- Healers (extra) ---
export const SHAMAN: UnitTemplate = {
  id: "shaman",
  name: "Shaman",
  class: "Healer",
  maxHp: 55,
  attack: 9,
  defense: 3,
  speed: 5,
  attackRange: 2,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [TOTEM_PULSE, HEAL],
  spriteKey: "shaman",
  unlockCost: 300,
  description: "A spirit channeler who places healing totems that pulse regeneration to nearby allies. Best for sustained healing.",
};

// --- Assassins (extra) ---
export const NINJA: UnitTemplate = {
  id: "ninja",
  name: "Ninja",
  class: "Assassin",
  maxHp: 45,
  attack: 18,
  defense: 2,
  speed: 8,
  attackRange: 2,
  critChance: 0.18,
  critMultiplier: 2.0,
  abilities: [SHURIKEN, SHADOW_DODGE],
  spriteKey: "ninja",
  unlockCost: 350,
  description: "A swift warrior who throws shurikens from range and dodges incoming attacks. Versatile and hard to pin down.",
};

// --- Mages ---
export const WIZARD: UnitTemplate = {
  id: "wizard",
  name: "Wizard",
  class: "Mage",
  maxHp: 50,
  attack: 22,
  defense: 2,
  speed: 4,
  attackRange: 5,
  critChance: 0.08,
  critMultiplier: 1.8,
  abilities: [FIREBALL, ARCANE_BLAST],
  spriteKey: "wizard",
  unlockCost: 400,
  description: "A master of destructive magic who hurls fireballs and arcane blasts from extreme range. Fragile but devastating.",
};

export const SORCERER: UnitTemplate = {
  id: "sorcerer",
  name: "Sorcerer",
  class: "Mage",
  maxHp: 55,
  attack: 25,
  defense: 1,
  speed: 3,
  attackRange: 4,
  critChance: 0.1,
  critMultiplier: 2.0,
  abilities: [ARCANE_BLAST, FIREBALL],
  spriteKey: "sorcerer",
  unlockCost: 450,
  description: "A glass cannon who channels the most raw arcane power. Highest single-target magic damage in the game.",
};

// --- Paladins ---
export const TEMPLAR: UnitTemplate = {
  id: "templar",
  name: "Templar",
  class: "Paladin",
  maxHp: 90,
  attack: 13,
  defense: 6,
  speed: 4,
  attackRange: 1,
  critChance: 0.05,
  critMultiplier: 1.5,
  abilities: [SHIELD_BASH, DIVINE_LIGHT],
  spriteKey: "templar",
  unlockCost: 400,
  description: "A holy knight who charges into battle and heals nearby allies. The ultimate frontline support hybrid.",
};

export const CRUSADER: UnitTemplate = {
  id: "crusader",
  name: "Crusader",
  class: "Paladin",
  maxHp: 80,
  attack: 15,
  defense: 5,
  speed: 4,
  attackRange: 1,
  critChance: 0.08,
  critMultiplier: 1.6,
  abilities: [HOLY_AURA, SHIELD_BASH],
  spriteKey: "crusader",
  unlockCost: 400,
  description: "A zealous warrior whose holy aura protects all nearby allies. More offensive than the Templar.",
};

// --- Berserkers ---
export const BARBARIAN: UnitTemplate = {
  id: "barbarian",
  name: "Barbarian",
  class: "Berserker",
  maxHp: 70,
  attack: 22,
  defense: 3,
  speed: 5,
  attackRange: 1,
  critChance: 0.12,
  critMultiplier: 1.8,
  abilities: [RAGE, WHIRLWIND],
  spriteKey: "barbarian",
  unlockCost: 350,
  description: "A wild warrior who enters a devastating rage. The lower the HP, the harder the hits.",
};

export const GLADIATOR: UnitTemplate = {
  id: "gladiator",
  name: "Gladiator",
  class: "Berserker",
  maxHp: 65,
  attack: 19,
  defense: 4,
  speed: 5,
  attackRange: 1,
  critChance: 0.1,
  critMultiplier: 1.8,
  abilities: [COUNTER_STANCE, WHIRLWIND],
  spriteKey: "gladiator",
  unlockCost: 350,
  description: "A disciplined arena fighter who reflects damage back at attackers. Punishes anyone who targets them.",
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
  warden: WARDEN,
  crossbowman: CROSSBOWMAN,
  shaman: SHAMAN,
  ninja: NINJA,
  wizard: WIZARD,
  sorcerer: SORCERER,
  templar: TEMPLAR,
  crusader: CRUSADER,
  barbarian: BARBARIAN,
  gladiator: GLADIATOR,
};

export const STARTER_UNIT_IDS = ["knight", "archer", "cleric", "shadow"];

export const UNIT_LIST = Object.values(ALL_UNITS);

/** Lookup by template ID */
export const UNIT_MAP: Record<string, UnitTemplate> = ALL_UNITS;
