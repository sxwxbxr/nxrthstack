import type { BehaviorRule, BehaviorCondition, BehaviorAction, BehaviorConditionEntry } from "../types";
import {
  type ConditionName,
  type ActionName,
  ALL_CONDITIONS,
  ALL_ACTIONS,
  CONDITION_TO_BEHAVIOR,
  ACTION_TO_BEHAVIOR,
  MAX_RULES,
} from "./grammar";

// ============================================================================
// TacticsScript Parser
// Tokenizer → Parser → BehaviorRule[] output
// Supports compound conditions: IF cond1 AND cond2 THEN action
// ============================================================================

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  rules: BehaviorRule[];
  errors: ParseError[];
}

const CONDITION_NAMES = new Set(ALL_CONDITIONS.map((c) => c.name));
const ACTION_NAMES = new Set(ALL_ACTIONS.map((a) => a.name));

interface ParsedCondition {
  name: ConditionName;
  param?: string | number;
}

interface ParsedAction {
  name: ActionName;
  param?: string;
}

/**
 * Parse a TacticsScript source string into BehaviorRule[].
 * Returns both rules and any errors found.
 * Supports compound conditions: IF cond1 AND cond2 THEN action
 */
export function parseTacticsScript(source: string): ParseResult {
  const lines = source.split("\n");
  const rules: BehaviorRule[] = [];
  const errors: ParseError[] = [];
  let priority = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("//")) continue;

    // Check rule limit
    if (rules.length >= MAX_RULES) {
      errors.push({ line: lineNum, message: `Maximum ${MAX_RULES} rules allowed. This rule will be ignored.` });
      continue;
    }

    // Parse ELSE shorthand: ELSE <action>
    if (trimmed.toUpperCase().startsWith("ELSE ")) {
      const actionStr = trimmed.slice(5).trim();
      const action = parseAction(actionStr);
      if (!action) {
        errors.push({ line: lineNum, message: `Unknown action: "${actionStr}". Check spelling.` });
        continue;
      }

      rules.push({
        id: `rule-${priority}`,
        priority,
        condition: "ALWAYS" as BehaviorCondition,
        action: ACTION_TO_BEHAVIOR[action.name] as BehaviorAction,
        actionParam: action.param,
      });
      priority++;
      continue;
    }

    // Parse IF <condition(s)> THEN <action>
    const ifMatch = trimmed.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i);
    if (!ifMatch) {
      errors.push({
        line: lineNum,
        message: `Invalid syntax. Expected: IF <condition> THEN <action>`,
      });
      continue;
    }

    const condStr = ifMatch[1].trim();
    const actionStr = ifMatch[2].trim();

    // Parse compound conditions (split by AND)
    const condParts = splitByAnd(condStr);
    const parsedConditions: ParsedCondition[] = [];
    let hasError = false;

    for (const part of condParts) {
      const condition = parseCondition(part.trim());
      if (!condition) {
        errors.push({ line: lineNum, message: `Unknown condition: "${part.trim()}". Check spelling and parameters.` });
        hasError = true;
        break;
      }

      // Validate param ranges
      if (condition.name === "self_low_hp" || condition.name === "ally_low_hp" || condition.name === "enemy_low_hp") {
        const num = condition.param as number;
        if (isNaN(num) || num < 1 || num > 99) {
          errors.push({ line: lineNum, message: `HP threshold must be between 1 and 99. Got: ${condition.param}` });
          hasError = true;
          break;
        }
      }

      parsedConditions.push(condition);
    }

    if (hasError) continue;

    // Parse action
    const action = parseAction(actionStr);
    if (!action) {
      errors.push({ line: lineNum, message: `Unknown action: "${actionStr}". Check spelling and parameters.` });
      continue;
    }

    // Build the rule
    const firstCond = parsedConditions[0];

    // Build conditions array for compound conditions
    const conditions: BehaviorConditionEntry[] = parsedConditions.map((pc) => ({
      condition: CONDITION_TO_BEHAVIOR[pc.name] as BehaviorCondition,
      conditionParam: typeof pc.param === "number" ? pc.param : undefined,
      conditionStringParam: typeof pc.param === "string" ? pc.param : undefined,
    }));

    rules.push({
      id: `rule-${priority}`,
      priority,
      // Legacy single condition (first condition for backward compat)
      condition: CONDITION_TO_BEHAVIOR[firstCond.name] as BehaviorCondition,
      conditionParam: typeof firstCond.param === "number" ? firstCond.param : undefined,
      // Compound conditions (always present for new rules)
      conditions: conditions.length > 1 ? conditions : undefined,
      action: ACTION_TO_BEHAVIOR[action.name] as BehaviorAction,
      actionParam: action.param,
    });
    priority++;
  }

  return { rules, errors };
}

/**
 * Split a condition string by AND keyword, respecting parentheses.
 * e.g. "ability_ready("heal") AND self_low_hp(30)" → ["ability_ready(\"heal\")", "self_low_hp(30)"]
 */
function splitByAnd(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  const tokens = str.split(/\s+/);
  for (const token of tokens) {
    if (token.toUpperCase() === "AND" && depth === 0 && current.trim()) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    // Track parentheses depth
    for (const ch of token) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
    }
    current += (current ? " " : "") + token;
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function parseCondition(str: string): ParsedCondition | null {
  // Check for parameterized condition: name(param)
  const paramMatch = str.match(/^(\w+)\((.+?)\)$/);
  if (paramMatch) {
    const name = paramMatch[1] as ConditionName;
    if (!CONDITION_NAMES.has(name)) return null;

    const condDef = ALL_CONDITIONS.find((c) => c.name === name);
    if (!condDef?.hasParam) return null;

    let param: string | number = paramMatch[2];
    // Strip quotes from string params
    if (param.startsWith('"') && param.endsWith('"')) {
      param = param.slice(1, -1);
    } else if (condDef.paramType === "number") {
      param = parseInt(param, 10);
    }

    return { name, param };
  }

  // Simple condition (no params)
  const name = str as ConditionName;
  if (CONDITION_NAMES.has(name)) {
    const condDef = ALL_CONDITIONS.find((c) => c.name === name);
    if (condDef?.hasParam) return null; // Requires param but none given
    return { name };
  }

  return null;
}

function parseAction(str: string): ParsedAction | null {
  // Check for parameterized action: name("param")
  const paramMatch = str.match(/^(\w+)\((.+?)\)$/);
  if (paramMatch) {
    const name = paramMatch[1] as ActionName;
    if (!ACTION_NAMES.has(name)) return null;

    const actDef = ALL_ACTIONS.find((a) => a.name === name);
    if (!actDef?.hasParam) return null;

    let param = paramMatch[2];
    // Strip quotes
    if (param.startsWith('"') && param.endsWith('"')) {
      param = param.slice(1, -1);
    }

    return { name, param };
  }

  // Simple action (no params)
  const name = str as ActionName;
  if (ACTION_NAMES.has(name)) {
    return { name };
  }

  return null;
}

/**
 * Generate a TacticsScript source from existing BehaviorRule[].
 * Used when switching from Simple to Advanced mode.
 * Supports compound conditions (AND syntax).
 */
export function rulesToScript(rules: BehaviorRule[]): string {
  const lines: string[] = [
    "// TacticsScript - Unit Behavior Rules",
    "// Each line: IF <condition> THEN <action>",
    "// Use AND for compound conditions: IF cond1 AND cond2 THEN action",
    "",
  ];

  for (const rule of rules) {
    const actName = Object.entries(ACTION_TO_BEHAVIOR).find(
      ([, v]) => v === rule.action
    )?.[0] as ActionName | undefined;
    if (!actName) continue;

    let actStr: string = actName;
    if (rule.actionParam) {
      actStr = `${actName}("${rule.actionParam}")`;
    }

    // Compound conditions
    if (rule.conditions && rule.conditions.length > 1) {
      const condStrs = rule.conditions.map((c) => conditionEntryToScript(c));
      if (condStrs.some((s) => !s)) continue;
      lines.push(`IF ${condStrs.join(" AND ")} THEN ${actStr}`);
      continue;
    }

    // Single condition (legacy or single-entry)
    const condEntry = rule.conditions?.[0] ?? {
      condition: rule.condition,
      conditionParam: rule.conditionParam,
    };

    const condScript = conditionEntryToScript(condEntry);
    if (!condScript) continue;

    const condName = Object.entries(CONDITION_TO_BEHAVIOR).find(
      ([, v]) => v === condEntry.condition
    )?.[0] as ConditionName | undefined;

    if (condName === "always") {
      lines.push(`ELSE ${actStr}`);
    } else {
      lines.push(`IF ${condScript} THEN ${actStr}`);
    }
  }

  return lines.join("\n");
}

function conditionEntryToScript(entry: BehaviorConditionEntry | { condition: string; conditionParam?: number; conditionStringParam?: string }): string | null {
  const condName = Object.entries(CONDITION_TO_BEHAVIOR).find(
    ([, v]) => v === entry.condition
  )?.[0] as ConditionName | undefined;
  if (!condName) return null;

  if (entry.conditionStringParam) {
    return `${condName}("${entry.conditionStringParam}")`;
  }
  if (entry.conditionParam !== undefined) {
    return `${condName}(${entry.conditionParam})`;
  }
  return condName;
}
