import type { BehaviorRule, BehaviorCondition, BehaviorAction } from "../types";
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

    // Parse IF <condition> THEN <action>
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

    // Parse condition
    const condition = parseCondition(condStr);
    if (!condition) {
      errors.push({ line: lineNum, message: `Unknown condition: "${condStr}". Check spelling and parameters.` });
      continue;
    }

    // Parse action
    const action = parseAction(actionStr);
    if (!action) {
      errors.push({ line: lineNum, message: `Unknown action: "${actionStr}". Check spelling and parameters.` });
      continue;
    }

    // Validate param ranges
    if (condition.name === "self_low_hp" || condition.name === "ally_low_hp" || condition.name === "enemy_low_hp") {
      const num = condition.param as number;
      if (isNaN(num) || num < 1 || num > 99) {
        errors.push({ line: lineNum, message: `HP threshold must be between 1 and 99. Got: ${condition.param}` });
        continue;
      }
    }

    rules.push({
      id: `rule-${priority}`,
      priority,
      condition: CONDITION_TO_BEHAVIOR[condition.name] as BehaviorCondition,
      conditionParam: typeof condition.param === "number" ? condition.param : undefined,
      action: ACTION_TO_BEHAVIOR[action.name] as BehaviorAction,
      actionParam: action.param,
    });
    priority++;
  }

  return { rules, errors };
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
 */
export function rulesToScript(rules: BehaviorRule[]): string {
  const lines: string[] = [
    "// TacticsScript - Unit Behavior Rules",
    "// Each line: IF <condition> THEN <action>",
    "",
  ];

  for (const rule of rules) {
    const condName = Object.entries(CONDITION_TO_BEHAVIOR).find(
      ([, v]) => v === rule.condition
    )?.[0] as ConditionName | undefined;

    const actName = Object.entries(ACTION_TO_BEHAVIOR).find(
      ([, v]) => v === rule.action
    )?.[0] as ActionName | undefined;

    if (!condName || !actName) continue;

    let condStr: string = condName;
    if (rule.conditionParam !== undefined) {
      condStr = `${condName}(${rule.conditionParam})`;
    }

    let actStr: string = actName;
    if (rule.actionParam) {
      actStr = `${actName}("${rule.actionParam}")`;
    }

    if (condName === "always") {
      lines.push(`ELSE ${actStr}`);
    } else {
      lines.push(`IF ${condStr} THEN ${actStr}`);
    }
  }

  return lines.join("\n");
}
