// ============================================================================
// TacticsScript Grammar Definition
// A beginner-friendly scripting language for unit AI behavior rules.
// ============================================================================

/**
 * TacticsScript Syntax:
 *
 * Each line is a rule in the format:
 *   IF <condition> THEN <action>
 *
 * Optional parameters in parentheses:
 *   IF self_low_hp(30) THEN heal_lowest_ally
 *   IF ability_ready("shield_wall") THEN use_ability("shield_wall")
 *
 * Special rules:
 *   ELSE <action>           // Fallback if no other rule matched (same as IF always THEN ...)
 *
 * Comments:
 *   // This is a comment
 *
 * Maximum 10 rules per script.
 *
 * Available Conditions:
 *   enemy_in_range       - An enemy is within attack range
 *   no_enemy_in_range    - No enemy within attack range
 *   self_low_hp(%)       - Unit's HP is below X% (e.g., self_low_hp(30))
 *   ally_low_hp(%)       - An ally's HP is below X%
 *   enemy_low_hp(%)      - An enemy's HP is below X%
 *   ability_ready("id")  - A specific ability is off cooldown
 *   always               - Always true (use as last rule / fallback)
 *
 * Available Actions:
 *   attack_nearest          - Attack the closest enemy
 *   attack_lowest_hp        - Attack the enemy with lowest HP
 *   attack_highest_attack   - Attack the enemy with highest ATK
 *   move_towards_enemy      - Move closer to nearest enemy
 *   kite                    - Attack then move away (ranger style)
 *   use_ability("id")       - Use a specific ability
 *   heal_lowest_ally        - Heal the ally with lowest HP
 *   hold_position           - Don't move, attack if in range
 *   move_to_cover           - Move to nearest cover tile
 */

export type ConditionName =
  | "enemy_in_range"
  | "no_enemy_in_range"
  | "self_low_hp"
  | "ally_low_hp"
  | "enemy_low_hp"
  | "ability_ready"
  | "always";

export type ActionName =
  | "attack_nearest"
  | "attack_lowest_hp"
  | "attack_highest_attack"
  | "move_towards_enemy"
  | "kite"
  | "use_ability"
  | "heal_lowest_ally"
  | "hold_position"
  | "move_to_cover";

export const ALL_CONDITIONS: { name: ConditionName; hasParam: boolean; paramType: "number" | "string" | null; description: string }[] = [
  { name: "enemy_in_range", hasParam: false, paramType: null, description: "An enemy is within your attack range" },
  { name: "no_enemy_in_range", hasParam: false, paramType: null, description: "No enemies are within your attack range" },
  { name: "self_low_hp", hasParam: true, paramType: "number", description: "Your HP is below this percentage (1-99)" },
  { name: "ally_low_hp", hasParam: true, paramType: "number", description: "Any ally's HP is below this percentage" },
  { name: "enemy_low_hp", hasParam: true, paramType: "number", description: "Any enemy's HP is below this percentage" },
  { name: "ability_ready", hasParam: true, paramType: "string", description: "The specified ability is off cooldown" },
  { name: "always", hasParam: false, paramType: null, description: "Always true - use as a fallback rule" },
];

export const ALL_ACTIONS: { name: ActionName; hasParam: boolean; paramType: "string" | null; description: string }[] = [
  { name: "attack_nearest", hasParam: false, paramType: null, description: "Attack the closest enemy" },
  { name: "attack_lowest_hp", hasParam: false, paramType: null, description: "Attack the enemy with the lowest HP" },
  { name: "attack_highest_attack", hasParam: false, paramType: null, description: "Attack the enemy with the highest ATK stat" },
  { name: "move_towards_enemy", hasParam: false, paramType: null, description: "Move towards the nearest enemy" },
  { name: "kite", hasParam: false, paramType: null, description: "Attack then back away (great for ranged units)" },
  { name: "use_ability", hasParam: true, paramType: "string", description: "Use a specific ability by its ID" },
  { name: "heal_lowest_ally", hasParam: false, paramType: null, description: "Heal the ally with the lowest HP" },
  { name: "hold_position", hasParam: false, paramType: null, description: "Stay put and attack anything in range" },
  { name: "move_to_cover", hasParam: false, paramType: null, description: "Move to the nearest cover tile for protection" },
];

export const CONDITION_TO_BEHAVIOR: Record<ConditionName, string> = {
  enemy_in_range: "ENEMY_IN_RANGE",
  no_enemy_in_range: "NO_ENEMY_IN_RANGE",
  self_low_hp: "SELF_LOW_HP",
  ally_low_hp: "ALLY_LOW_HP",
  enemy_low_hp: "ENEMY_LOW_HP",
  ability_ready: "ABILITY_READY",
  always: "ALWAYS",
};

export const ACTION_TO_BEHAVIOR: Record<ActionName, string> = {
  attack_nearest: "ATTACK_NEAREST",
  attack_lowest_hp: "ATTACK_LOWEST_HP",
  attack_highest_attack: "ATTACK_HIGHEST_ATTACK",
  move_towards_enemy: "MOVE_TOWARDS_ENEMY",
  kite: "KITE",
  use_ability: "USE_ABILITY",
  heal_lowest_ally: "HEAL_LOWEST_ALLY",
  hold_position: "HOLD_POSITION",
  move_to_cover: "MOVE_TO_COVER",
};

export const MAX_RULES = 10;
