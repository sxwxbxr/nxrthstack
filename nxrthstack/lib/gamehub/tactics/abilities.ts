import type { Ability } from "./types";

// ============================================================================
// Ability Definitions
// Tick rate: 4 ticks/sec. Cooldowns and durations are in ticks.
// ============================================================================

// --- Tank Abilities ---
export const SHIELD_WALL: Ability = {
  id: "shield_wall",
  name: "Shield Wall",
  cooldownTicks: 32, // 8 seconds
  range: 0,
  effectType: "buff",
  effectValue: 5, // +5 defense
  duration: 12, // 3 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Raise shield, gaining +5 defense for 3 seconds.",
};

export const TAUNT: Ability = {
  id: "taunt",
  name: "Taunt",
  cooldownTicks: 24, // 6 seconds
  range: 3,
  effectType: "debuff",
  effectValue: 0, // forces target to attack this unit (handled in sim)
  duration: 8, // 2 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Force nearby enemy to target you for 2 seconds.",
};

// --- Ranger Abilities ---
export const VOLLEY: Ability = {
  id: "volley",
  name: "Volley",
  cooldownTicks: 24, // 6 seconds
  range: 4,
  effectType: "damage",
  effectValue: 12,
  duration: 0,
  aoe: true,
  aoeRadius: 1,
  description: "Rain arrows on an area, dealing 12 damage to all enemies within 1 tile.",
};

export const PIERCING_SHOT: Ability = {
  id: "piercing_shot",
  name: "Piercing Shot",
  cooldownTicks: 20, // 5 seconds
  range: 5,
  effectType: "damage",
  effectValue: 22,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "A powerful shot that ignores defense, dealing 22 damage.",
};

// --- Healer Abilities ---
export const HEAL: Ability = {
  id: "heal",
  name: "Heal",
  cooldownTicks: 12, // 3 seconds
  range: 3,
  effectType: "heal",
  effectValue: 15,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Restore 15 HP to an ally.",
};

export const GROUP_HEAL: Ability = {
  id: "group_heal",
  name: "Group Heal",
  cooldownTicks: 32, // 8 seconds
  range: 2,
  effectType: "heal",
  effectValue: 12,
  duration: 0,
  aoe: true,
  aoeRadius: 2,
  description: "Restore 12 HP to all allies within 2 tiles.",
};

export const REGENERATION: Ability = {
  id: "regeneration",
  name: "Regeneration",
  cooldownTicks: 24, // 6 seconds
  range: 3,
  effectType: "heal",
  effectValue: 4, // per tick for duration
  duration: 12, // 3 seconds (48 HP total)
  aoe: false,
  aoeRadius: 0,
  description: "Grant an ally regeneration, healing 4 HP per tick over 3 seconds.",
};

export const NATURES_SHIELD: Ability = {
  id: "natures_shield",
  name: "Nature's Shield",
  cooldownTicks: 28, // 7 seconds
  range: 3,
  effectType: "buff",
  effectValue: 4, // +4 defense
  duration: 16, // 4 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Grant an ally +4 defense for 4 seconds.",
};

// --- Assassin Abilities ---
export const BACKSTAB: Ability = {
  id: "backstab",
  name: "Backstab",
  cooldownTicks: 16, // 4 seconds
  range: 1,
  effectType: "dash",
  effectValue: 24, // dash + damage
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Dash to enemy and strike for 24 damage.",
};

export const VANISH: Ability = {
  id: "vanish",
  name: "Vanish",
  cooldownTicks: 32, // 8 seconds
  range: 0,
  effectType: "buff",
  effectValue: 100, // "untargetable" flag
  duration: 8, // 2 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Become invisible for 2 seconds, untargetable by enemies.",
};

export const POISON_STRIKE: Ability = {
  id: "poison_strike",
  name: "Poison Strike",
  cooldownTicks: 20, // 5 seconds
  range: 1,
  effectType: "debuff",
  effectValue: 5, // damage per tick
  duration: 12, // 3 seconds (60 total DoT)
  aoe: false,
  aoeRadius: 0,
  description: "Poison the target, dealing 5 damage per tick over 3 seconds.",
};

export const SMOKE_BOMB: Ability = {
  id: "smoke_bomb",
  name: "Smoke Bomb",
  cooldownTicks: 28, // 7 seconds
  range: 0,
  effectType: "buff",
  effectValue: 4, // defense boost
  duration: 12, // 3 seconds
  aoe: true,
  aoeRadius: 1,
  description: "Deploy smoke, granting +4 defense to nearby allies for 3 seconds.",
};

// --- Mage Abilities ---
export const FIREBALL: Ability = {
  id: "fireball",
  name: "Fireball",
  cooldownTicks: 24, // 6 seconds
  range: 5,
  effectType: "damage",
  effectValue: 18,
  duration: 0,
  aoe: true,
  aoeRadius: 1,
  description: "Hurl a fireball that explodes on impact, dealing 18 magic damage in an area.",
};

export const ARCANE_BLAST: Ability = {
  id: "arcane_blast",
  name: "Arcane Blast",
  cooldownTicks: 20, // 5 seconds
  range: 4,
  effectType: "damage",
  effectValue: 28,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "A concentrated burst of arcane energy dealing 28 damage, ignoring 50% of defense.",
};

// --- Paladin Abilities ---
export const SHIELD_BASH: Ability = {
  id: "shield_bash",
  name: "Shield Bash",
  cooldownTicks: 20, // 5 seconds
  range: 1,
  effectType: "dash",
  effectValue: 16,
  duration: 4, // 1 second stun
  aoe: false,
  aoeRadius: 0,
  description: "Dash to enemy and bash with shield for 16 damage, stunning for 1 second.",
};

export const DIVINE_LIGHT: Ability = {
  id: "divine_light",
  name: "Divine Light",
  cooldownTicks: 28, // 7 seconds
  range: 2,
  effectType: "heal",
  effectValue: 10,
  duration: 0,
  aoe: true,
  aoeRadius: 2,
  description: "Bathe the area in holy light, healing all allies within 2 tiles for 10 HP.",
};

export const HOLY_AURA: Ability = {
  id: "holy_aura",
  name: "Holy Aura",
  cooldownTicks: 32, // 8 seconds
  range: 0,
  effectType: "buff",
  effectValue: 3, // +3 defense to self + nearby
  duration: 16, // 4 seconds
  aoe: true,
  aoeRadius: 2,
  description: "Emit a holy aura granting +3 defense to self and nearby allies for 4 seconds.",
};

// --- Berserker Abilities ---
export const RAGE: Ability = {
  id: "rage",
  name: "Rage",
  cooldownTicks: 24, // 6 seconds
  range: 0,
  effectType: "buff",
  effectValue: 8, // +8 attack
  duration: 16, // 4 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Enter a berserker rage, gaining +8 attack for 4 seconds. Stronger when low HP.",
};

export const WHIRLWIND: Ability = {
  id: "whirlwind",
  name: "Whirlwind",
  cooldownTicks: 20, // 5 seconds
  range: 1,
  effectType: "damage",
  effectValue: 14,
  duration: 0,
  aoe: true,
  aoeRadius: 1,
  description: "Spin wildly, dealing 14 damage to all enemies within 1 tile.",
};

export const COUNTER_STANCE: Ability = {
  id: "counter_stance",
  name: "Counter Stance",
  cooldownTicks: 28, // 7 seconds
  range: 0,
  effectType: "buff",
  effectValue: 50, // 50% damage reflected
  duration: 12, // 3 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Enter a defensive stance, reflecting 50% of melee damage received for 3 seconds.",
};

// --- Extra Unit Abilities ---
export const AOE_TAUNT: Ability = {
  id: "aoe_taunt",
  name: "Warcry",
  cooldownTicks: 28, // 7 seconds
  range: 0,
  effectType: "debuff",
  effectValue: 0,
  duration: 8, // 2 seconds
  aoe: true,
  aoeRadius: 2,
  description: "Let out a fearsome warcry, forcing all enemies within 2 tiles to target you.",
};

export const BOLT_SHOT: Ability = {
  id: "bolt_shot",
  name: "Bolt Shot",
  cooldownTicks: 16, // 4 seconds
  range: 3,
  effectType: "damage",
  effectValue: 20,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Fire a heavy bolt that pierces armor, dealing 20 damage and ignoring 25% defense.",
};

export const TOTEM_PULSE: Ability = {
  id: "totem_pulse",
  name: "Totem Pulse",
  cooldownTicks: 24, // 6 seconds
  range: 2,
  effectType: "heal",
  effectValue: 3, // per tick
  duration: 16, // 4 seconds = 48 total in AoE
  aoe: true,
  aoeRadius: 2,
  description: "Place a healing totem that pulses 3 HP/tick to all allies within 2 tiles for 4 seconds.",
};

export const SHURIKEN: Ability = {
  id: "shuriken",
  name: "Shuriken Throw",
  cooldownTicks: 12, // 3 seconds
  range: 3,
  effectType: "damage",
  effectValue: 12,
  duration: 0,
  aoe: false,
  aoeRadius: 0,
  description: "Throw a shuriken at range for 12 damage. Low cooldown for consistent ranged pressure.",
};

export const SHADOW_DODGE: Ability = {
  id: "shadow_dodge",
  name: "Shadow Dodge",
  cooldownTicks: 24, // 6 seconds
  range: 0,
  effectType: "buff",
  effectValue: 50, // 50% dodge chance
  duration: 12, // 3 seconds
  aoe: false,
  aoeRadius: 0,
  description: "Enter a heightened state, gaining 50% dodge chance for 3 seconds.",
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
  fireball: FIREBALL,
  arcane_blast: ARCANE_BLAST,
  shield_bash: SHIELD_BASH,
  divine_light: DIVINE_LIGHT,
  holy_aura: HOLY_AURA,
  rage: RAGE,
  whirlwind: WHIRLWIND,
  counter_stance: COUNTER_STANCE,
  aoe_taunt: AOE_TAUNT,
  bolt_shot: BOLT_SHOT,
  totem_pulse: TOTEM_PULSE,
  shuriken: SHURIKEN,
  shadow_dodge: SHADOW_DODGE,
};
