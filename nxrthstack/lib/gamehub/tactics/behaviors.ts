import type { BehaviorCondition, BehaviorAction, BehaviorPreset, BehaviorRule } from "./types";

// ============================================================================
// Behavior Condition & Action Labels
// ============================================================================

export const CONDITION_LABELS: Record<BehaviorCondition, string> = {
  ENEMY_IN_RANGE: "Enemy in attack range",
  ALLY_LOW_HP: "Ally below HP threshold",
  SELF_LOW_HP: "Self below HP threshold",
  NO_ENEMY_IN_RANGE: "No enemy in range",
  ABILITY_READY: "Ability is off cooldown",
  ENEMY_LOW_HP: "Enemy below HP threshold",
  ALWAYS: "Always (fallback)",
};

export const CONDITION_DESCRIPTIONS: Record<BehaviorCondition, string> = {
  ENEMY_IN_RANGE: "At least one enemy is within this unit's attack range.",
  ALLY_LOW_HP: "An allied unit's HP is below the threshold percentage.",
  SELF_LOW_HP: "This unit's HP is below the threshold percentage.",
  NO_ENEMY_IN_RANGE: "No enemies are within this unit's attack range.",
  ABILITY_READY: "The specified ability is off cooldown and ready to use.",
  ENEMY_LOW_HP: "An enemy unit's HP is below the threshold percentage.",
  ALWAYS: "This condition always matches. Use as a fallback rule.",
};

export const ACTION_LABELS: Record<BehaviorAction, string> = {
  ATTACK_NEAREST: "Attack nearest enemy",
  ATTACK_LOWEST_HP: "Attack lowest HP enemy",
  ATTACK_HIGHEST_ATTACK: "Attack highest ATK enemy",
  MOVE_TOWARDS_ENEMY: "Move towards nearest enemy",
  KITE: "Kite (maintain max range)",
  USE_ABILITY: "Use ability",
  HEAL_LOWEST_ALLY: "Heal lowest HP ally",
  HOLD_POSITION: "Hold position",
  MOVE_TO_COVER: "Move to nearest cover tile",
};

export const ACTION_DESCRIPTIONS: Record<BehaviorAction, string> = {
  ATTACK_NEAREST: "Attack the closest enemy unit in range.",
  ATTACK_LOWEST_HP: "Attack the enemy with the lowest current HP.",
  ATTACK_HIGHEST_ATTACK: "Prioritize the enemy with the highest attack stat.",
  MOVE_TOWARDS_ENEMY: "Move one tile closer to the nearest enemy.",
  KITE: "Move away from enemies while staying at maximum attack range.",
  USE_ABILITY: "Use the specified ability on the best target.",
  HEAL_LOWEST_ALLY: "Heal the ally with the lowest HP percentage.",
  HOLD_POSITION: "Stay in the current position and do nothing.",
  MOVE_TO_COVER: "Move towards the nearest cover tile for ranged damage reduction.",
};

// Conditions that need a numeric parameter (HP threshold %)
export const CONDITIONS_WITH_PARAM: BehaviorCondition[] = [
  "ALLY_LOW_HP",
  "SELF_LOW_HP",
  "ENEMY_LOW_HP",
];

// Actions that need a string parameter (ability ID)
export const ACTIONS_WITH_PARAM: BehaviorAction[] = ["USE_ABILITY"];

// ============================================================================
// Behavior Presets
// ============================================================================

let ruleId = 0;
function rule(
  priority: number,
  condition: BehaviorCondition,
  action: BehaviorAction,
  conditionParam?: number,
  actionParam?: string
): BehaviorRule {
  return {
    id: `preset_${++ruleId}`,
    priority,
    condition,
    conditionParam,
    action,
    actionParam,
  };
}

export const PRESET_AGGRESSIVE: BehaviorPreset = {
  id: "aggressive",
  name: "Aggressive",
  description: "Rush in and attack the weakest enemy.",
  rules: [
    rule(1, "ENEMY_IN_RANGE", "ATTACK_LOWEST_HP"),
    rule(2, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const PRESET_DEFENSIVE: BehaviorPreset = {
  id: "defensive",
  name: "Defensive",
  description: "Hold position and attack from cover. Retreat when low.",
  rules: [
    rule(1, "SELF_LOW_HP", "MOVE_TO_COVER", 30),
    rule(2, "ENEMY_IN_RANGE", "ATTACK_NEAREST"),
    rule(3, "NO_ENEMY_IN_RANGE", "MOVE_TO_COVER"),
    rule(4, "ALWAYS", "HOLD_POSITION"),
  ],
};

export const PRESET_SUPPORT: BehaviorPreset = {
  id: "support",
  name: "Support",
  description: "Prioritize healing allies, attack only when no one needs help.",
  rules: [
    rule(1, "ALLY_LOW_HP", "HEAL_LOWEST_ALLY", 70),
    rule(2, "ABILITY_READY", "USE_ABILITY", undefined, "group_heal"),
    rule(3, "ENEMY_IN_RANGE", "ATTACK_NEAREST"),
    rule(4, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const PRESET_ASSASSIN: BehaviorPreset = {
  id: "assassin",
  name: "Assassin",
  description: "Target the weakest or most dangerous enemy. Use abilities aggressively.",
  rules: [
    rule(1, "ABILITY_READY", "USE_ABILITY", undefined, "backstab"),
    rule(2, "ENEMY_LOW_HP", "ATTACK_LOWEST_HP", 40),
    rule(3, "ENEMY_IN_RANGE", "ATTACK_HIGHEST_ATTACK"),
    rule(4, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const PRESET_MAGE: BehaviorPreset = {
  id: "mage",
  name: "Mage",
  description: "Cast spells from safety, kite when enemies approach.",
  rules: [
    rule(1, "ABILITY_READY", "USE_ABILITY", undefined, "fireball"),
    rule(2, "ABILITY_READY", "USE_ABILITY", undefined, "arcane_blast"),
    rule(3, "ENEMY_IN_RANGE", "KITE"),
    rule(4, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const PRESET_PALADIN: BehaviorPreset = {
  id: "paladin",
  name: "Paladin",
  description: "Heal wounded allies, tank frontline, use abilities to support.",
  rules: [
    rule(1, "ALLY_LOW_HP", "HEAL_LOWEST_ALLY", 60),
    rule(2, "ABILITY_READY", "USE_ABILITY", undefined, "divine_light"),
    rule(3, "SELF_LOW_HP", "USE_ABILITY", 40, "shield_bash"),
    rule(4, "ENEMY_IN_RANGE", "ATTACK_NEAREST"),
    rule(5, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const PRESET_BERSERKER: BehaviorPreset = {
  id: "berserker",
  name: "Berserker",
  description: "Rage when hurt, cleave with whirlwind, rush enemies.",
  rules: [
    rule(1, "SELF_LOW_HP", "USE_ABILITY", 50, "rage"),
    rule(2, "ABILITY_READY", "USE_ABILITY", undefined, "whirlwind"),
    rule(3, "ENEMY_IN_RANGE", "ATTACK_LOWEST_HP"),
    rule(4, "ALWAYS", "MOVE_TOWARDS_ENEMY"),
  ],
};

export const ALL_PRESETS: Record<string, BehaviorPreset> = {
  aggressive: PRESET_AGGRESSIVE,
  defensive: PRESET_DEFENSIVE,
  support: PRESET_SUPPORT,
  assassin: PRESET_ASSASSIN,
  mage: PRESET_MAGE,
  paladin: PRESET_PALADIN,
  berserker: PRESET_BERSERKER,
};

export const PRESET_LIST = Object.values(ALL_PRESETS);

// Default preset by unit class
export const DEFAULT_PRESET_FOR_CLASS: Record<string, string> = {
  Tank: "defensive",
  Ranger: "aggressive",
  Healer: "support",
  Assassin: "assassin",
  Mage: "mage",
  Paladin: "paladin",
  Berserker: "berserker",
};
