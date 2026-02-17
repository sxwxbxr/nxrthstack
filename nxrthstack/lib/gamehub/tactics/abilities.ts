import type { Ability } from "./types";

// ============================================================================
// Ability Definitions
// ============================================================================

// --- Tank Abilities ---
export const SHIELD_WALL: Ability = {
  id: "shield_wall",
  name: "Shield Wall",
  cooldownTicks: 80, // 8 seconds
  range: 0,
  effectType: "buff",
  effectValue: 5, // +5 defense
  duration: 30, // 3 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Raise shield, gaining +5 defense for 3 seconds.",
};

export const TAUNT: Ability = {
  id: "taunt",
  name: "Taunt",
  cooldownTicks: 60, // 6 seconds
  range: 3,
  effectType: "debuff",
  effectValue: 0, // forces target to attack this unit (handled in sim)
  duration: 20, // 2 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Force nearby enemy to target you for 2 seconds.",
};

// --- Ranger Abilities ---
export const VOLLEY: Ability = {
  id: "volley",
  name: "Volley",
  cooldownTicks: 60,
  range: 4,
  effectType: "damage",
  effectValue: 8,
  duration: 0,
  aoe: true,
  aoeRadius: 1,
  description: "Rain arrows on an area, dealing 8 damage to all enemies within 1 tile.",
};

export const PIERCING_SHOT: Ability = {
  id: "piercing_shot",
  name: "Piercing Shot",
  cooldownTicks: 50,
  range: 5,
  effectType: "damage",
  effectValue: 15,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "A powerful shot that ignores defense, dealing 15 damage.",
};

// --- Healer Abilities ---
export const HEAL: Ability = {
  id: "heal",
  name: "Heal",
  cooldownTicks: 30, // 3 seconds
  range: 3,
  effectType: "heal",
  effectValue: 12,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Restore 12 HP to an ally.",
};

export const GROUP_HEAL: Ability = {
  id: "group_heal",
  name: "Group Heal",
  cooldownTicks: 80,
  range: 2,
  effectType: "heal",
  effectValue: 8,
  duration: 0,
  aoe: true,
  aoeRadius: 2,
  description: "Restore 8 HP to all allies within 2 tiles.",
};

export const REGENERATION: Ability = {
  id: "regeneration",
  name: "Regeneration",
  cooldownTicks: 60,
  range: 3,
  effectType: "heal",
  effectValue: 3, // per tick for duration
  duration: 30,
  aoe: false,
  aoeRadius: 0,
  description: "Grant an ally regeneration, healing 3 HP over 3 seconds.",
};

export const NATURES_SHIELD: Ability = {
  id: "natures_shield",
  name: "Nature's Shield",
  cooldownTicks: 70,
  range: 3,
  effectType: "buff",
  effectValue: 3, // +3 defense
  duration: 40,
  aoe: false,
  aoeRadius: 0,
  description: "Grant an ally +3 defense for 4 seconds.",
};

// --- Assassin Abilities ---
export const BACKSTAB: Ability = {
  id: "backstab",
  name: "Backstab",
  cooldownTicks: 40,
  range: 1,
  effectType: "dash",
  effectValue: 18, // dash + damage
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Dash to enemy and strike for 18 damage.",
};

export const VANISH: Ability = {
  id: "vanish",
  name: "Vanish",
  cooldownTicks: 80,
  range: 0,
  effectType: "buff",
  effectValue: 100, // "untargetable" flag (defense boost to simulate)
  duration: 20,
  aoe: false,
  aoeRadius: 0,
  description: "Become invisible for 2 seconds, untargetable by enemies.",
};

export const POISON_STRIKE: Ability = {
  id: "poison_strike",
  name: "Poison Strike",
  cooldownTicks: 50,
  range: 1,
  effectType: "debuff",
  effectValue: 3, // damage per tick
  duration: 30,
  aoe: false,
  aoeRadius: 0,
  description: "Poison the target, dealing 3 damage over 3 seconds.",
};

export const SMOKE_BOMB: Ability = {
  id: "smoke_bomb",
  name: "Smoke Bomb",
  cooldownTicks: 70,
  range: 0,
  effectType: "buff",
  effectValue: 4, // evasion (defense boost)
  duration: 30,
  aoe: true,
  aoeRadius: 1,
  description: "Deploy smoke, granting +4 defense to nearby allies for 3 seconds.",
};

export const ALL_ABILITIES: Record<string, Ability> = {
  shield_wall: SHIELD_WALL,
  taunt: TAUNT,
  volley: VOLLEY,
  piercing_shot: PIERCING_SHOT,
  heal: HEAL,
  group_heal: GROUP_HEAL,
  regeneration: REGENERATION,
  natures_shield: NATURES_SHIELD,
  backstab: BACKSTAB,
  vanish: VANISH,
  poison_strike: POISON_STRIKE,
  smoke_bomb: SMOKE_BOMB,
};
