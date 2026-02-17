import type {
  BattleEvent,
  BattleResult,
  BattleStats,
  BattleUnit,
  BehaviorAction,
  BehaviorConditionEntry,
  BehaviorRule,
  ComputedUnitStats,
  GameState,
  Position,
  Squad,
  UnitSide,
} from "./types";
import { ALL_UNITS } from "./units";
import { ALL_ABILITIES } from "./abilities";
import { selectMap } from "./maps";
import { createRng, type SeededRng } from "./rng";
import { findNextStep, tileDistance } from "./pathfinding";
import { hasLineOfSight, isOnCover } from "./los";

/** Optional pre-computed stats keyed by instanceId */
export type StatsOverrideEntry = ComputedUnitStats & { perks?: string[] };
export type StatsOverrideMap = Record<string, StatsOverrideEntry>;

// ============================================================================
// Constants
// ============================================================================

const TICK_RATE = 4; // ticks per second
const MAX_TICKS = 160; // 40 seconds
const COVER_DAMAGE_REDUCTION = 0.25;
const ATTACK_COOLDOWN_TICKS = 4; // 1 second between attacks

// ============================================================================
// Simulation Entry Point
// ============================================================================

export function simulateBattle(
  attackerSquad: Squad,
  defenderSquad: Squad,
  mapId: string,
  seed: number,
  statsOverride?: StatsOverrideMap
): BattleResult {
  const rng = createRng(seed);
  const map = selectMap(seed);
  const actualMapId = mapId || map.id;

  // Initialize game state
  const state: GameState = {
    map,
    units: [
      ...initUnits(attackerSquad, "attacker", statsOverride),
      ...initUnits(defenderSquad, "defender", statsOverride),
    ],
    tick: 0,
    events: [],
    winner: null,
  };

  // Record battle start
  state.events.push({ tick: 0, type: "BATTLE_START" });

  // Attack cooldown tracking
  const attackCooldowns = new Map<string, number>();
  // Track first_strike usage per unit
  const firstStrikeUsed = new Set<string>();

  // Main simulation loop
  while (state.tick < MAX_TICKS && !state.winner) {
    state.tick++;
    simulateTick(state, rng, attackCooldowns, firstStrikeUsed);
    checkWinCondition(state);
  }

  // If timeout, determine winner by remaining HP
  if (!state.winner) {
    resolveTimeout(state);
  }

  // Record battle end
  state.events.push({
    tick: state.tick,
    type: "BATTLE_END",
    winner: state.winner!,
    reason: state.tick >= MAX_TICKS ? "timeout" : "elimination",
  });

  const stats = calculateStats(state);

  return {
    winner: state.winner!,
    events: state.events,
    stats,
    durationTicks: state.tick,
    seed,
    mapId: actualMapId,
  };
}

// ============================================================================
// Initialization
// ============================================================================

function initUnits(squad: Squad, side: UnitSide, statsOverride?: StatsOverrideMap): BattleUnit[] {
  return squad.units.map((su) => {
    const template = ALL_UNITS[su.templateId];
    if (!template) throw new Error(`Unknown unit template: ${su.templateId}`);

    // Use computed stats if available (includes rarity + level + equipment bonuses)
    const computed = statsOverride?.[su.instanceId];
    const maxHp = computed?.maxHp ?? template.maxHp;

    // Perks are computed alongside stats and passed through the override
    const perks = computed?.perks ?? [];

    return {
      instanceId: su.instanceId,
      templateId: su.templateId,
      side,
      position: { ...su.position },
      currentHp: maxHp,
      maxHp,
      attack: computed?.attack ?? template.attack,
      defense: computed?.defense ?? template.defense,
      speed: computed?.speed ?? template.speed,
      attackRange: computed?.attackRange ?? template.attackRange,
      critChance: computed?.critChance ?? template.critChance,
      critMultiplier: computed?.critMultiplier ?? template.critMultiplier,
      abilities: template.abilities.map((a) => ({ ...a })),
      abilityCooldowns: {},
      behaviorRules: su.behaviorRules,
      perks,
      isAlive: true,
      buffs: [],
    };
  });
}

// ============================================================================
// Tick Simulation
// ============================================================================

function simulateTick(
  state: GameState,
  rng: SeededRng,
  attackCooldowns: Map<string, number>,
  firstStrikeUsed: Set<string>
): void {
  // Process buffs (tick down, apply effects like regen/poison)
  processBuffs(state);

  // Process aura perk: healers with "aura" regen nearby allies 2 HP/tick
  for (const unit of state.units) {
    if (!unit.isAlive || !unit.perks.includes("aura")) continue;
    const allies = state.units.filter(
      (u) => u.isAlive && u.side === unit.side && u.instanceId !== unit.instanceId &&
        tileDistance(u.position, unit.position) <= 2
    );
    for (const ally of allies) {
      const heal = Math.min(2, ally.maxHp - ally.currentHp);
      if (heal > 0) {
        ally.currentHp += heal;
        state.events.push({ tick: state.tick, type: "HEAL", unitId: ally.instanceId, value: heal });
      }
    }
  }

  // Sort units by speed (higher = faster), ties broken by RNG
  const aliveUnits = state.units
    .filter((u) => u.isAlive)
    .sort((a, b) => {
      if (b.speed !== a.speed) return b.speed - a.speed;
      return rng.nextFloat() - 0.5;
    });

  const occupiedTiles = getOccupiedTiles(state);

  for (const unit of aliveUnits) {
    if (!unit.isAlive) continue; // may have died this tick

    const action = evaluateBehavior(unit, state, rng);
    if (action) {
      executeAction(unit, action, state, rng, occupiedTiles, attackCooldowns, firstStrikeUsed);
    }
  }
}

function processBuffs(state: GameState): void {
  for (const unit of state.units) {
    if (!unit.isAlive) continue;

    // Apply ongoing effects
    for (const buff of unit.buffs) {
      const ability = ALL_ABILITIES[buff.abilityId];
      if (!ability) continue;

      // Regeneration / Totem Pulse (heal over time)
      if ((ability.id === "regeneration" || ability.id === "totem_pulse") && buff.effectType === "buff") {
        const healAmount = Math.min(ability.effectValue, unit.maxHp - unit.currentHp);
        if (healAmount > 0) {
          unit.currentHp += healAmount;
          state.events.push({
            tick: state.tick,
            type: "HEAL",
            unitId: unit.instanceId,
            value: healAmount,
          });
        }
      }
      if (ability.id === "poison_strike" && buff.effectType === "debuff") {
        unit.currentHp -= ability.effectValue;
        state.events.push({
          tick: state.tick,
          type: "DAMAGE",
          unitId: unit.instanceId,
          value: ability.effectValue,
        });
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          unit.isAlive = false;
          state.events.push({
            tick: state.tick,
            type: "DEATH",
            unitId: unit.instanceId,
          });
        }
      }
    }

    // Remove expired buffs
    unit.buffs = unit.buffs.filter((b) => b.expiresAtTick > state.tick);
  }
}

// ============================================================================
// Behavior Evaluation
// ============================================================================

interface ResolvedAction {
  action: BehaviorAction;
  target?: BattleUnit;
  abilityId?: string;
}

function evaluateBehavior(
  unit: BattleUnit,
  state: GameState,
  rng: SeededRng
): ResolvedAction | null {
  const rules = [...unit.behaviorRules].sort((a, b) => a.priority - b.priority);
  const enemies = getEnemies(unit, state);
  const allies = getAllies(unit, state);

  for (const rule of rules) {
    const match = checkConditions(unit, rule, enemies, allies, state);
    if (match) {
      return resolveAction(unit, rule, enemies, allies, state, rng);
    }
  }

  // Default: move towards nearest enemy
  return { action: "MOVE_TOWARDS_ENEMY" };
}

/** Check all conditions for a rule (supports compound AND conditions) */
function checkConditions(
  unit: BattleUnit,
  rule: BehaviorRule,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  state: GameState
): boolean {
  // Compound conditions: ALL must match (AND logic)
  if (rule.conditions && rule.conditions.length > 0) {
    return rule.conditions.every((entry) =>
      checkSingleCondition(unit, entry, enemies, allies, state, rule.actionParam)
    );
  }

  // Legacy single condition
  return checkSingleCondition(
    unit,
    { condition: rule.condition, conditionParam: rule.conditionParam },
    enemies,
    allies,
    state,
    rule.actionParam
  );
}

function checkSingleCondition(
  unit: BattleUnit,
  entry: BehaviorConditionEntry,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  state: GameState,
  actionParam?: string
): boolean {
  const threshold = entry.conditionParam ?? 50;

  switch (entry.condition) {
    case "ENEMY_IN_RANGE": {
      return enemies.some(
        (e) =>
          tileDistance(unit.position, e.position) <= unit.attackRange &&
          hasLineOfSight(state.map.tiles, unit.position, e.position)
      );
    }
    case "ALLY_LOW_HP": {
      return allies.some(
        (a) => a.instanceId !== unit.instanceId && (a.currentHp / a.maxHp) * 100 < threshold
      );
    }
    case "SELF_LOW_HP": {
      return (unit.currentHp / unit.maxHp) * 100 < threshold;
    }
    case "NO_ENEMY_IN_RANGE": {
      return !enemies.some(
        (e) =>
          tileDistance(unit.position, e.position) <= unit.attackRange &&
          hasLineOfSight(state.map.tiles, unit.position, e.position)
      );
    }
    case "ABILITY_READY": {
      // Use conditionStringParam first (new), fall back to actionParam (legacy)
      const abilityId = entry.conditionStringParam ?? actionParam;
      if (!abilityId) return unit.abilities.some((a) => !unit.abilityCooldowns[a.id] || unit.abilityCooldowns[a.id] <= state.tick);
      return !unit.abilityCooldowns[abilityId] || unit.abilityCooldowns[abilityId] <= state.tick;
    }
    case "ENEMY_LOW_HP": {
      return enemies.some((e) => (e.currentHp / e.maxHp) * 100 < threshold);
    }
    case "ALWAYS": {
      return true;
    }
    default:
      return false;
  }
}

function resolveAction(
  unit: BattleUnit,
  rule: BehaviorRule,
  enemies: BattleUnit[],
  allies: BattleUnit[],
  state: GameState,
  rng: SeededRng
): ResolvedAction {
  switch (rule.action) {
    case "ATTACK_NEAREST": {
      const target = findNearestEnemy(unit, enemies);
      return { action: "ATTACK_NEAREST", target: target ?? undefined };
    }
    case "ATTACK_LOWEST_HP": {
      const target = findLowestHpEnemy(enemies);
      return { action: "ATTACK_LOWEST_HP", target: target ?? undefined };
    }
    case "ATTACK_HIGHEST_ATTACK": {
      const target = findHighestAttackEnemy(enemies);
      return { action: "ATTACK_HIGHEST_ATTACK", target: target ?? undefined };
    }
    case "MOVE_TOWARDS_ENEMY": {
      const target = findNearestEnemy(unit, enemies);
      return { action: "MOVE_TOWARDS_ENEMY", target: target ?? undefined };
    }
    case "KITE": {
      const target = findNearestEnemy(unit, enemies);
      return { action: "KITE", target: target ?? undefined };
    }
    case "USE_ABILITY": {
      const abilityId = rule.actionParam ?? unit.abilities[0]?.id;
      const ability = ALL_ABILITIES[abilityId];
      if (ability) {
        // Self-targeted abilities (range 0): rage, counter_stance, shadow_dodge, aoe_taunt, etc.
        if (ability.range === 0) {
          return { action: "USE_ABILITY", target: unit, abilityId };
        }
        if (ability.effectType === "heal" || ability.effectType === "buff") {
          const target = findLowestHpAlly(unit, allies);
          return { action: "USE_ABILITY", target: target ?? undefined, abilityId };
        }
        const target = findNearestEnemy(unit, enemies);
        return { action: "USE_ABILITY", target: target ?? undefined, abilityId };
      }
      return { action: "ATTACK_NEAREST", target: findNearestEnemy(unit, enemies) ?? undefined };
    }
    case "HEAL_LOWEST_ALLY": {
      const target = findLowestHpAlly(unit, allies);
      const healAbility = unit.abilities.find((a) => a.effectType === "heal");
      return {
        action: "HEAL_LOWEST_ALLY",
        target: target ?? undefined,
        abilityId: healAbility?.id,
      };
    }
    case "HOLD_POSITION": {
      return { action: "HOLD_POSITION" };
    }
    case "MOVE_TO_COVER": {
      return { action: "MOVE_TO_COVER" };
    }
    default:
      return { action: "HOLD_POSITION" };
  }
}

// ============================================================================
// Action Execution
// ============================================================================

function executeAction(
  unit: BattleUnit,
  action: ResolvedAction,
  state: GameState,
  rng: SeededRng,
  occupiedTiles: Set<string>,
  attackCooldowns: Map<string, number>,
  firstStrikeUsed: Set<string>
): void {
  switch (action.action) {
    case "ATTACK_NEAREST":
    case "ATTACK_LOWEST_HP":
    case "ATTACK_HIGHEST_ATTACK": {
      if (!action.target) {
        moveTowardsNearestEnemy(unit, state, occupiedTiles);
        return;
      }
      const dist = tileDistance(unit.position, action.target.position);
      const los = hasLineOfSight(state.map.tiles, unit.position, action.target.position);
      if (dist <= unit.attackRange && los) {
        performAttack(unit, action.target, state, rng, attackCooldowns, firstStrikeUsed);
      } else {
        // shadow_step: first move teleports to target
        if (unit.perks.includes("shadow_step") && !firstStrikeUsed.has(unit.instanceId + "_move")) {
          firstStrikeUsed.add(unit.instanceId + "_move");
          const adjPos = findAdjacentPosition(unit, action.target.position, state);
          if (adjPos) {
            const oldKey = `${unit.position.x},${unit.position.y}`;
            occupiedTiles.delete(oldKey);
            occupiedTiles.add(`${adjPos.x},${adjPos.y}`);
            state.events.push({
              tick: state.tick, type: "MOVE", unitId: unit.instanceId,
              fromPosition: { ...unit.position }, toPosition: adjPos,
            });
            unit.position = adjPos;
          }
        } else {
          moveTowards(unit, action.target.position, state, occupiedTiles);
        }
      }
      break;
    }
    case "MOVE_TOWARDS_ENEMY": {
      if (action.target) {
        moveTowards(unit, action.target.position, state, occupiedTiles);
      }
      break;
    }
    case "KITE": {
      if (!action.target) return;
      const dist = tileDistance(unit.position, action.target.position);
      if (dist < unit.attackRange) {
        // Move away
        moveAwayFrom(unit, action.target.position, state, occupiedTiles);
      } else if (dist === unit.attackRange) {
        const los = hasLineOfSight(state.map.tiles, unit.position, action.target.position);
        if (los) performAttack(unit, action.target, state, rng, attackCooldowns);
      } else {
        moveTowards(unit, action.target.position, state, occupiedTiles);
      }
      break;
    }
    case "USE_ABILITY": {
      const abilityId = action.abilityId;
      if (!abilityId) return;
      const ability = ALL_ABILITIES[abilityId];
      if (!ability) return;

      // Check cooldown
      if (unit.abilityCooldowns[abilityId] && unit.abilityCooldowns[abilityId] > state.tick) {
        // Ability on cooldown, fall back to basic attack or move
        if (action.target) {
          const dist = tileDistance(unit.position, action.target.position);
          if (dist <= unit.attackRange) {
            performAttack(unit, action.target, state, rng, attackCooldowns);
          } else {
            moveTowards(unit, action.target.position, state, occupiedTiles);
          }
        }
        return;
      }

      if (!action.target) return;
      const dist = tileDistance(unit.position, action.target.position);

      if (dist <= ability.range) {
        performAbility(unit, action.target, ability.id, state, rng, firstStrikeUsed);
        unit.abilityCooldowns[abilityId] = state.tick + ability.cooldownTicks;
      } else {
        moveTowards(unit, action.target.position, state, occupiedTiles);
      }
      break;
    }
    case "HEAL_LOWEST_ALLY": {
      if (!action.target || !action.abilityId) {
        // No heal ability, just hold
        return;
      }
      const ability = ALL_ABILITIES[action.abilityId];
      if (!ability) return;

      if (unit.abilityCooldowns[ability.id] && unit.abilityCooldowns[ability.id] > state.tick) {
        return; // On cooldown
      }

      const dist = tileDistance(unit.position, action.target.position);
      if (dist <= ability.range) {
        performAbility(unit, action.target, ability.id, state, rng, firstStrikeUsed);
        unit.abilityCooldowns[ability.id] = state.tick + ability.cooldownTicks;
      } else {
        moveTowards(unit, action.target.position, state, occupiedTiles);
      }
      break;
    }
    case "HOLD_POSITION":
      break;
    case "MOVE_TO_COVER": {
      const coverPos = findNearestCoverTile(unit, state, occupiedTiles);
      if (coverPos) {
        moveTowards(unit, coverPos, state, occupiedTiles);
      }
      break;
    }
  }
}

// ============================================================================
// Combat Actions
// ============================================================================

function performAttack(
  attacker: BattleUnit,
  target: BattleUnit,
  state: GameState,
  rng: SeededRng,
  attackCooldowns: Map<string, number>,
  firstStrikeUsed?: Set<string>
): void {
  // Check attack cooldown
  const cooldownKey = attacker.instanceId;
  if (attackCooldowns.has(cooldownKey) && attackCooldowns.get(cooldownKey)! > state.tick) {
    return;
  }
  attackCooldowns.set(cooldownKey, state.tick + ATTACK_COOLDOWN_TICKS);

  // Check if target is vanished (buff value 100)
  if (target.buffs.some((b) => b.abilityId === "vanish")) {
    return; // Can't target vanished units
  }

  // Dodge check: shadow_dodge buff gives 50% dodge chance
  if (target.buffs.some((b) => b.abilityId === "shadow_dodge")) {
    if (rng.chance(0.5)) return; // Attack dodged
  }

  // Piercing perk: ignore 25% of target defense
  // Spell pierce perk (Mage): ignore 50% of target defense
  let defenseReduction = 1;
  if (attacker.perks.includes("spell_pierce")) defenseReduction = 0.5;
  else if (attacker.perks.includes("piercing")) defenseReduction = 0.75;
  const effectiveDefense = target.defense * defenseReduction;

  // Rage buff: add attack boost from rage ability
  const attackBuff = attacker.buffs
    .filter((b) => b.effectType === "buff" && b.abilityId === "rage")
    .reduce((sum, b) => sum + b.value, 0);
  const effectiveAttack = attacker.attack + attackBuff;

  const isCrit = rng.chance(attacker.critChance);
  const baseDamage = Math.max(1, effectiveAttack - effectiveDefense / 2);

  // Headshot perk: crits deal +50% bonus
  const critMult = isCrit
    ? attacker.critMultiplier * (attacker.perks.includes("headshot") ? 1.5 : 1)
    : 1;

  let damage = Math.round(baseDamage * critMult);

  // First strike perk: first attack does 1.5× damage
  if (attacker.perks.includes("first_strike") && firstStrikeUsed && !firstStrikeUsed.has(attacker.instanceId)) {
    firstStrikeUsed.add(attacker.instanceId);
    damage = Math.round(damage * 1.5);
  }

  // Blood rage perk (Berserker): +30% damage when below 30% HP
  if (attacker.perks.includes("blood_rage") && attacker.currentHp < attacker.maxHp * 0.3) {
    damage = Math.round(damage * 1.3);
  }

  // Defense buffs (only actual defense-boosting abilities)
  const DEFENSE_BUFF_IDS = new Set(["shield_wall", "natures_shield", "smoke_bomb", "holy_aura"]);
  const defenseBoost = target.buffs
    .filter((b) => b.effectType === "buff" && DEFENSE_BUFF_IDS.has(b.abilityId))
    .reduce((sum, b) => sum + b.value, 0);
  if (defenseBoost > 0) {
    damage = Math.max(1, damage - defenseBoost);
  }

  // Cover reduction (ranged attacks only)
  if (attacker.attackRange > 1 && isOnCover(state.map.tiles, target.position)) {
    damage = Math.max(1, Math.round(damage * (1 - COVER_DAMAGE_REDUCTION)));
  }

  // Fortify perk: 20% less damage when below 50% HP
  if (target.perks.includes("fortify") && target.currentHp < target.maxHp * 0.5) {
    damage = Math.max(1, Math.round(damage * 0.8));
  }

  // Blessed aura perk (Paladin): nearby allies with this perk reduce damage by 10%
  const nearbyPaladins = state.units.filter(
    (u) => u.isAlive && u.side === target.side && u.instanceId !== target.instanceId &&
      u.perks.includes("blessed_aura") && tileDistance(u.position, target.position) <= 2
  );
  if (nearbyPaladins.length > 0) {
    damage = Math.max(1, Math.round(damage * 0.9));
  }

  // Divine shield perk (Paladin): absorb first hit completely
  if (target.perks.includes("divine_shield") && !(firstStrikeUsed && firstStrikeUsed.has(target.instanceId + "_divine"))) {
    if (firstStrikeUsed) firstStrikeUsed.add(target.instanceId + "_divine");
    damage = 0;
  }

  state.events.push({
    tick: state.tick,
    type: "ATTACK",
    unitId: attacker.instanceId,
    targetId: target.instanceId,
    fromPosition: { ...attacker.position },
    toPosition: { ...target.position },
  });

  applyDamage(target, damage, state, isCrit, firstStrikeUsed);

  // Thorns perk: reflect 15% melee damage
  if (target.isAlive && target.perks.includes("thorns") && attacker.attackRange <= 1) {
    const thornsDmg = Math.max(1, Math.round(damage * 0.15));
    applyDamage(attacker, thornsDmg, state, false, firstStrikeUsed);
  }

  // Counter stance buff: reflect 50% melee damage
  if (target.isAlive && target.buffs.some((b) => b.abilityId === "counter_stance") && attacker.attackRange <= 1) {
    const reflectDmg = Math.max(1, Math.round(damage * 0.5));
    applyDamage(attacker, reflectDmg, state, false, firstStrikeUsed);
  }
}

function performAbility(
  caster: BattleUnit,
  target: BattleUnit,
  abilityId: string,
  state: GameState,
  rng: SeededRng,
  firstStrikeUsed?: Set<string>
): void {
  const ability = ALL_ABILITIES[abilityId];
  if (!ability) return;

  state.events.push({
    tick: state.tick,
    type: "ABILITY",
    unitId: caster.instanceId,
    targetId: target.instanceId,
    abilityId,
    fromPosition: { ...caster.position },
    toPosition: { ...target.position },
  });

  // Arcane mastery perk: abilities deal +25% damage
  const masteryMult = caster.perks.includes("arcane_mastery") ? 1.25 : 1;

  switch (ability.effectType) {
    case "damage": {
      // AoE damage
      if (ability.aoe) {
        const targets = getUnitsInRadius(target.position, ability.aoeRadius, state, caster.side === "attacker" ? "defender" : "attacker");
        for (const t of targets) {
          const dmg = Math.round(ability.effectValue * masteryMult);
          applyDamage(t, dmg, state, false, firstStrikeUsed);
        }
      } else {
        // Piercing shot ignores all defense
        if (abilityId === "piercing_shot") {
          const dmg = Math.round(ability.effectValue * masteryMult);
          applyDamage(target, dmg, state, false, firstStrikeUsed);
        }
        // Arcane blast ignores 50% defense
        else if (abilityId === "arcane_blast") {
          const effectiveDef = target.defense * 0.5;
          const dmg = Math.max(1, Math.round((ability.effectValue - effectiveDef / 2) * masteryMult));
          applyDamage(target, dmg, state, false, firstStrikeUsed);
        }
        // Bolt shot ignores 25% defense
        else if (abilityId === "bolt_shot") {
          const effectiveDef = target.defense * 0.75;
          const dmg = Math.max(1, Math.round((ability.effectValue - effectiveDef / 2) * masteryMult));
          applyDamage(target, dmg, state, false, firstStrikeUsed);
        } else {
          const dmg = Math.max(1, Math.round((ability.effectValue - target.defense / 2) * masteryMult));
          applyDamage(target, dmg, state, false, firstStrikeUsed);
        }
      }
      break;
    }
    case "heal": {
      if (ability.aoe) {
        const targets = getUnitsInRadius(caster.position, ability.aoeRadius, state, caster.side);
        if (ability.duration > 0) {
          // AoE HoT (totem_pulse): apply heal-over-time buff to all allies in radius
          for (const t of targets) {
            t.buffs.push({
              abilityId,
              effectType: "buff",
              value: ability.effectValue,
              expiresAtTick: state.tick + ability.duration,
            });
            state.events.push({
              tick: state.tick,
              type: "BUFF",
              unitId: t.instanceId,
              abilityId,
              value: ability.effectValue,
            });
          }
        } else {
          // Instant AoE heal (group_heal, divine_light)
          for (const t of targets) {
            applyHeal(t, ability.effectValue, state);
          }
        }
      } else if (ability.duration > 0) {
        // Single-target HoT (regeneration)
        target.buffs.push({
          abilityId,
          effectType: "buff",
          value: ability.effectValue,
          expiresAtTick: state.tick + ability.duration,
        });
        state.events.push({
          tick: state.tick,
          type: "BUFF",
          unitId: target.instanceId,
          abilityId,
          value: ability.effectValue,
        });
      } else {
        applyHeal(target, ability.effectValue, state);
      }
      break;
    }
    case "buff": {
      if (ability.aoe) {
        // AoE buff: apply to all allies in radius (holy_aura, smoke_bomb)
        const targets = getUnitsInRadius(caster.position, ability.aoeRadius, state, caster.side);
        for (const t of targets) {
          t.buffs.push({
            abilityId,
            effectType: "buff",
            value: ability.effectValue,
            expiresAtTick: state.tick + ability.duration,
          });
          state.events.push({
            tick: state.tick,
            type: "BUFF",
            unitId: t.instanceId,
            abilityId,
            value: ability.effectValue,
          });
        }
      } else if (ability.range === 0) {
        // Self-buff: rage, counter_stance, shadow_dodge, vanish, shield_wall
        caster.buffs.push({
          abilityId,
          effectType: "buff",
          value: ability.effectValue,
          expiresAtTick: state.tick + ability.duration,
        });
        state.events.push({
          tick: state.tick,
          type: "BUFF",
          unitId: caster.instanceId,
          abilityId,
          value: ability.effectValue,
        });
      } else {
        // Targeted buff: natures_shield, etc.
        target.buffs.push({
          abilityId,
          effectType: "buff",
          value: ability.effectValue,
          expiresAtTick: state.tick + ability.duration,
        });
        state.events.push({
          tick: state.tick,
          type: "BUFF",
          unitId: target.instanceId,
          abilityId,
          value: ability.effectValue,
        });
      }
      break;
    }
    case "debuff": {
      if (ability.duration > 0) {
        if (ability.aoe) {
          // AoE debuff: apply to all enemies in radius (aoe_taunt)
          const enemySide = caster.side === "attacker" ? "defender" : "attacker";
          const targets = getUnitsInRadius(caster.position, ability.aoeRadius, state, enemySide);
          for (const t of targets) {
            t.buffs.push({
              abilityId,
              effectType: "debuff",
              value: ability.effectValue,
              expiresAtTick: state.tick + ability.duration,
            });
            state.events.push({
              tick: state.tick,
              type: "DEBUFF",
              unitId: t.instanceId,
              abilityId,
              value: ability.effectValue,
            });
          }
        } else {
          target.buffs.push({
            abilityId,
            effectType: "debuff",
            value: ability.effectValue,
            expiresAtTick: state.tick + ability.duration,
          });
          state.events.push({
            tick: state.tick,
            type: "DEBUFF",
            unitId: target.instanceId,
            abilityId,
            value: ability.effectValue,
          });
        }
      }
      break;
    }
    case "dash": {
      // Move to adjacent tile of target and deal damage
      const adjPos = findAdjacentPosition(caster, target.position, state);
      if (adjPos) {
        state.events.push({
          tick: state.tick,
          type: "MOVE",
          unitId: caster.instanceId,
          fromPosition: { ...caster.position },
          toPosition: adjPos,
        });
        caster.position = adjPos;
      }
      applyDamage(target, ability.effectValue, state, false, firstStrikeUsed);
      break;
    }
  }
}

function applyDamage(
  target: BattleUnit,
  damage: number,
  state: GameState,
  isCrit: boolean,
  firstStrikeUsed?: Set<string>
): void {
  const actualDamage = Math.min(target.currentHp, damage);
  target.currentHp -= actualDamage;

  state.events.push({
    tick: state.tick,
    type: "DAMAGE",
    unitId: target.instanceId,
    value: actualDamage,
    isCrit,
  });

  if (target.currentHp <= 0) {
    // Last stand perk (Berserker): survive one lethal hit at 1 HP per battle
    if (
      target.perks.includes("last_stand") &&
      firstStrikeUsed &&
      !firstStrikeUsed.has(target.instanceId + "_last_stand")
    ) {
      firstStrikeUsed.add(target.instanceId + "_last_stand");
      target.currentHp = 1;
      state.events.push({
        tick: state.tick,
        type: "BUFF",
        unitId: target.instanceId,
        abilityId: "last_stand",
        value: 1,
      });
    } else {
      target.currentHp = 0;
      target.isAlive = false;
      state.events.push({
        tick: state.tick,
        type: "DEATH",
        unitId: target.instanceId,
        toPosition: { ...target.position },
      });
    }
  }
}

function applyHeal(
  target: BattleUnit,
  amount: number,
  state: GameState
): void {
  // Overheal perk: healing can exceed max HP by 10%
  const healCap = target.perks.includes("overheal")
    ? Math.floor(target.maxHp * 1.1)
    : target.maxHp;
  const actualHeal = Math.min(healCap - target.currentHp, amount);
  target.currentHp += actualHeal;

  if (actualHeal > 0) {
    state.events.push({
      tick: state.tick,
      type: "HEAL",
      unitId: target.instanceId,
      value: actualHeal,
    });
  }
}

// ============================================================================
// Movement
// ============================================================================

function moveTowards(
  unit: BattleUnit,
  target: Position,
  state: GameState,
  occupiedTiles: Set<string>
): void {
  const next = findNextStep(state.map.tiles, unit.position, target, occupiedTiles);
  if (next) {
    const oldKey = `${unit.position.x},${unit.position.y}`;
    const newKey = `${next.x},${next.y}`;
    occupiedTiles.delete(oldKey);
    occupiedTiles.add(newKey);

    state.events.push({
      tick: state.tick,
      type: "MOVE",
      unitId: unit.instanceId,
      fromPosition: { ...unit.position },
      toPosition: next,
    });
    unit.position = next;
  }
}

function moveTowardsNearestEnemy(
  unit: BattleUnit,
  state: GameState,
  occupiedTiles: Set<string>
): void {
  const enemies = getEnemies(unit, state);
  const nearest = findNearestEnemy(unit, enemies);
  if (nearest) {
    moveTowards(unit, nearest.position, state, occupiedTiles);
  }
}

function moveAwayFrom(
  unit: BattleUnit,
  threat: Position,
  state: GameState,
  occupiedTiles: Set<string>
): void {
  // Find the direction away from threat and try to move there
  const dx = unit.position.x - threat.x;
  const dy = unit.position.y - threat.y;

  const candidates: Position[] = [];
  if (dx >= 0) candidates.push({ x: unit.position.x + 1, y: unit.position.y });
  if (dx <= 0) candidates.push({ x: unit.position.x - 1, y: unit.position.y });
  if (dy >= 0) candidates.push({ x: unit.position.x, y: unit.position.y + 1 });
  if (dy <= 0) candidates.push({ x: unit.position.x, y: unit.position.y - 1 });

  const grid = state.map.tiles;
  for (const pos of candidates) {
    if (
      pos.x >= 0 && pos.x < grid[0].length &&
      pos.y >= 0 && pos.y < grid.length &&
      grid[pos.y][pos.x] !== "obstacle" &&
      !occupiedTiles.has(`${pos.x},${pos.y}`)
    ) {
      const oldKey = `${unit.position.x},${unit.position.y}`;
      occupiedTiles.delete(oldKey);
      occupiedTiles.add(`${pos.x},${pos.y}`);

      state.events.push({
        tick: state.tick,
        type: "MOVE",
        unitId: unit.instanceId,
        fromPosition: { ...unit.position },
        toPosition: pos,
      });
      unit.position = pos;
      return;
    }
  }
}

// ============================================================================
// Win Condition
// ============================================================================

function checkWinCondition(state: GameState): void {
  const attackersAlive = state.units.filter((u) => u.side === "attacker" && u.isAlive);
  const defendersAlive = state.units.filter((u) => u.side === "defender" && u.isAlive);

  if (attackersAlive.length === 0) {
    state.winner = "defender";
  } else if (defendersAlive.length === 0) {
    state.winner = "attacker";
  }
}

function resolveTimeout(state: GameState): void {
  const attackerHp = state.units
    .filter((u) => u.side === "attacker" && u.isAlive)
    .reduce((sum, u) => sum + u.currentHp, 0);
  const defenderHp = state.units
    .filter((u) => u.side === "defender" && u.isAlive)
    .reduce((sum, u) => sum + u.currentHp, 0);

  // Defender wins ties (defender advantage on timeout)
  state.winner = attackerHp > defenderHp ? "attacker" : "defender";
}

// ============================================================================
// Helpers
// ============================================================================

function getOccupiedTiles(state: GameState): Set<string> {
  const set = new Set<string>();
  for (const u of state.units) {
    if (u.isAlive) set.add(`${u.position.x},${u.position.y}`);
  }
  return set;
}

function getEnemies(unit: BattleUnit, state: GameState): BattleUnit[] {
  return state.units.filter((u) => u.isAlive && u.side !== unit.side);
}

function getAllies(unit: BattleUnit, state: GameState): BattleUnit[] {
  return state.units.filter((u) => u.isAlive && u.side === unit.side);
}

function findNearestEnemy(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  if (enemies.length === 0) return null;
  let nearest = enemies[0];
  let minDist = tileDistance(unit.position, enemies[0].position);
  for (let i = 1; i < enemies.length; i++) {
    // Skip vanished enemies
    if (enemies[i].buffs.some((b) => b.abilityId === "vanish")) continue;
    const d = tileDistance(unit.position, enemies[i].position);
    if (d < minDist) {
      minDist = d;
      nearest = enemies[i];
    }
  }
  return nearest;
}

function findLowestHpEnemy(enemies: BattleUnit[]): BattleUnit | null {
  const visible = enemies.filter((e) => !e.buffs.some((b) => b.abilityId === "vanish"));
  if (visible.length === 0) return null;
  return visible.reduce((min, e) => (e.currentHp < min.currentHp ? e : min));
}

function findHighestAttackEnemy(enemies: BattleUnit[]): BattleUnit | null {
  const visible = enemies.filter((e) => !e.buffs.some((b) => b.abilityId === "vanish"));
  if (visible.length === 0) return null;
  return visible.reduce((max, e) => (e.attack > max.attack ? e : max));
}

function findLowestHpAlly(unit: BattleUnit, allies: BattleUnit[]): BattleUnit | null {
  const damaged = allies.filter((a) => a.currentHp < a.maxHp && a.instanceId !== unit.instanceId);
  if (damaged.length === 0) return null;
  return damaged.reduce((min, a) => (a.currentHp / a.maxHp < min.currentHp / min.maxHp ? a : min));
}

function findNearestCoverTile(
  unit: BattleUnit,
  state: GameState,
  occupiedTiles: Set<string>
): Position | null {
  let nearest: Position | null = null;
  let minDist = Infinity;

  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      if (state.map.tiles[y][x] === "cover" && !occupiedTiles.has(`${x},${y}`)) {
        const d = tileDistance(unit.position, { x, y });
        if (d < minDist) {
          minDist = d;
          nearest = { x, y };
        }
      }
    }
  }
  return nearest;
}

function getUnitsInRadius(
  center: Position,
  radius: number,
  state: GameState,
  side: UnitSide
): BattleUnit[] {
  return state.units.filter(
    (u) => u.isAlive && u.side === side && tileDistance(u.position, center) <= radius
  );
}

function findAdjacentPosition(
  unit: BattleUnit,
  target: Position,
  state: GameState
): Position | null {
  const grid = state.map.tiles;
  const occupied = getOccupiedTiles(state);
  const directions = [
    { x: target.x - 1, y: target.y },
    { x: target.x + 1, y: target.y },
    { x: target.x, y: target.y - 1 },
    { x: target.x, y: target.y + 1 },
  ];

  let best: Position | null = null;
  let bestDist = Infinity;

  for (const pos of directions) {
    if (
      pos.x >= 0 && pos.x < grid[0].length &&
      pos.y >= 0 && pos.y < grid.length &&
      grid[pos.y][pos.x] !== "obstacle" &&
      (!occupied.has(`${pos.x},${pos.y}`) || (pos.x === unit.position.x && pos.y === unit.position.y))
    ) {
      const d = tileDistance(unit.position, pos);
      if (d < bestDist) {
        bestDist = d;
        best = pos;
      }
    }
  }
  return best;
}

function calculateStats(state: GameState): BattleStats {
  let attackerDamageDealt = 0;
  let defenderDamageDealt = 0;
  let attackerUnitsLost = 0;
  let defenderUnitsLost = 0;
  let attackerHealingDone = 0;
  let defenderHealingDone = 0;

  for (const event of state.events) {
    if (event.type === "DAMAGE" && event.unitId && event.value) {
      const unit = state.units.find((u) => u.instanceId === event.unitId);
      if (unit) {
        // Damage TO this unit means the OTHER side dealt it
        if (unit.side === "attacker") defenderDamageDealt += event.value;
        else attackerDamageDealt += event.value;
      }
    }
    if (event.type === "HEAL" && event.unitId && event.value) {
      const unit = state.units.find((u) => u.instanceId === event.unitId);
      if (unit) {
        if (unit.side === "attacker") attackerHealingDone += event.value;
        else defenderHealingDone += event.value;
      }
    }
    if (event.type === "DEATH" && event.unitId) {
      const unit = state.units.find((u) => u.instanceId === event.unitId);
      if (unit) {
        if (unit.side === "attacker") attackerUnitsLost++;
        else defenderUnitsLost++;
      }
    }
  }

  return {
    attackerDamageDealt,
    defenderDamageDealt,
    attackerUnitsLost,
    defenderUnitsLost,
    attackerHealingDone,
    defenderHealingDone,
    totalTicks: state.tick,
  };
}
