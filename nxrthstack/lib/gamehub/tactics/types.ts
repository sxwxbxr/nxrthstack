// ============================================================================
// Async PvP Tactics - Core Types
// ============================================================================

// --- Unit Classes ---
export type UnitClass = "Tank" | "Ranger" | "Healer" | "Assassin";

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

export interface BehaviorRule {
  id: string;
  priority: number;
  condition: BehaviorCondition;
  conditionParam?: number; // e.g., HP threshold %
  action: BehaviorAction;
  actionParam?: string; // e.g., ability ID
}

export interface BehaviorPreset {
  id: string;
  name: string;
  description: string;
  rules: BehaviorRule[];
}

// --- Squad ---
export interface SquadUnit {
  templateId: string;
  instanceId: string;
  behaviorRules: BehaviorRule[];
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
