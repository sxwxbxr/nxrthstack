// ============================================================================
// Monaco Language Definition for TacticsScript
// Provides syntax highlighting, autocomplete, and hover tooltips.
// ============================================================================

import { ALL_CONDITIONS, ALL_ACTIONS } from "./grammar";

export const TACTICS_SCRIPT_LANG_ID = "tacticsscript";

/** Ability info for unit-specific suggestions */
export interface AbilityInfo {
  id: string;
  name: string;
  cooldownTicks?: number;
  description?: string;
}

/**
 * Register the TacticsScript language with Monaco.
 * Call this once when Monaco is loaded.
 * Pass unitAbilities to enable unit-specific ability suggestions.
 */
export function registerTacticsScriptLanguage(
  monaco: typeof import("monaco-editor"),
  unitAbilities?: AbilityInfo[]
) {
  // Only register the language once
  const languages = monaco.languages.getLanguages();
  if (!languages.some((l) => l.id === TACTICS_SCRIPT_LANG_ID)) {
    monaco.languages.register({ id: TACTICS_SCRIPT_LANG_ID });
  }

  // Tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(TACTICS_SCRIPT_LANG_ID, {
    keywords: ["IF", "THEN", "ELSE", "AND"],
    conditions: ALL_CONDITIONS.map((c) => c.name),
    actions: ALL_ACTIONS.map((a) => a.name),

    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, "comment"],

        // Keywords (including AND)
        [/\b(IF|THEN|ELSE|AND)\b/, "keyword"],

        // Conditions (green)
        [
          /\b(enemy_in_range|no_enemy_in_range|self_low_hp|ally_low_hp|enemy_low_hp|ability_ready|always)\b/,
          "type",
        ],

        // Actions (orange)
        [
          /\b(attack_nearest|attack_lowest_hp|attack_highest_attack|move_towards_enemy|kite|use_ability|heal_lowest_ally|hold_position|move_to_cover)\b/,
          "function",
        ],

        // String literals (yellow)
        [/"[^"]*"/, "string"],

        // Numbers (cyan)
        [/\b\d+\b/, "number"],

        // Parentheses
        [/[()]/, "delimiter"],
      ],
    },
  });

  // Completion provider
  monaco.languages.registerCompletionItemProvider(TACTICS_SCRIPT_LANG_ID, {
    triggerCharacters: ['"'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const lineUpper = lineContent.trimStart().toUpperCase();
      const textBefore = lineContent.substring(0, position.column - 1);

      const suggestions: import("monaco-editor").languages.CompletionItem[] = [];

      // Check if we're inside quotes after ability_ready( or use_ability(
      const abilityParamMatch = textBefore.match(/(ability_ready|use_ability)\("([^"]*)$/i);
      if (abilityParamMatch && unitAbilities && unitAbilities.length > 0) {
        const quoteRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - (abilityParamMatch[2]?.length ?? 0),
          endColumn: position.column,
        };
        for (const ability of unitAbilities) {
          suggestions.push({
            label: ability.id,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: ability.id,
            detail: ability.name,
            documentation: ability.description
              ? `${ability.description}${ability.cooldownTicks ? ` (CD: ${ability.cooldownTicks / 4}s)` : ""}`
              : undefined,
            range: quoteRange,
          });
        }
        return { suggestions };
      }

      // Suggest IF at start of line
      if (lineUpper === "" || lineUpper === "I") {
        suggestions.push({
          label: "IF ... THEN ...",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "IF ${1:condition} THEN ${2:action}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Create a behavior rule",
          documentation: "Format: IF <condition> THEN <action>",
          range,
        });

        suggestions.push({
          label: "IF ... AND ... THEN ...",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "IF ${1:condition1} AND ${2:condition2} THEN ${3:action}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Create a compound rule",
          documentation: "Format: IF <cond1> AND <cond2> THEN <action>",
          range,
        });

        suggestions.push({
          label: "ELSE ...",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "ELSE ${1:action}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Fallback rule (always true)",
          documentation: "Shorthand for IF always THEN <action>",
          range,
        });
      }

      // After IF or AND, suggest conditions
      const afterIfOrAnd = (lineUpper.startsWith("IF ") && !lineUpper.includes("THEN")) ||
        textBefore.match(/\bAND\s+$/i);
      if (afterIfOrAnd) {
        for (const cond of ALL_CONDITIONS) {
          let insertText: string;
          if (cond.hasParam) {
            if (cond.paramType === "number") {
              insertText = `${cond.name}(\${1:50})`;
            } else if (unitAbilities && unitAbilities.length > 0) {
              // Suggest first unit ability as default
              insertText = `${cond.name}("\${1:${unitAbilities[0].id}}")`;
            } else {
              insertText = `${cond.name}("\${1:ability_id}")`;
            }
          } else {
            insertText = cond.name;
          }

          suggestions.push({
            label: cond.name,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText,
            insertTextRules: cond.hasParam
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            detail: "Condition",
            documentation: cond.description,
            range,
          });
        }

        // Also suggest AND keyword if we're between IF and THEN
        if (lineUpper.startsWith("IF ") && !lineUpper.includes("THEN")) {
          suggestions.push({
            label: "AND",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "AND ",
            detail: "Combine conditions",
            documentation: "Add another condition that must also be true",
            range,
          });
        }
      }

      // After THEN or ELSE, suggest actions
      if (lineUpper.includes("THEN ") || lineUpper.startsWith("ELSE ")) {
        for (const act of ALL_ACTIONS) {
          let insertText: string;
          if (act.hasParam) {
            if (unitAbilities && unitAbilities.length > 0) {
              insertText = `${act.name}("\${1:${unitAbilities[0].id}}")`;
            } else {
              insertText = `${act.name}("\${1:ability_id}")`;
            }
          } else {
            insertText = act.name;
          }

          suggestions.push({
            label: act.name,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText,
            insertTextRules: act.hasParam
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            detail: "Action",
            documentation: act.description,
            range,
          });
        }
      }

      // General fallback completion
      if (suggestions.length === 0) {
        for (const cond of ALL_CONDITIONS) {
          suggestions.push({
            label: cond.name,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: cond.name,
            detail: "Condition",
            documentation: cond.description,
            range,
          });
        }
        for (const act of ALL_ACTIONS) {
          suggestions.push({
            label: act.name,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: act.name,
            detail: "Action",
            documentation: act.description,
            range,
          });
        }
      }

      return { suggestions };
    },
  });

  // Hover provider
  monaco.languages.registerHoverProvider(TACTICS_SCRIPT_LANG_ID, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const text = word.word;
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Check conditions
      const cond = ALL_CONDITIONS.find((c) => c.name === text);
      if (cond) {
        return {
          range,
          contents: [
            { value: `**Condition: ${cond.name}**` },
            { value: cond.description },
            ...(cond.hasParam ? [{ value: `Parameter: ${cond.paramType}` }] : []),
          ],
        };
      }

      // Check actions
      const act = ALL_ACTIONS.find((a) => a.name === text);
      if (act) {
        return {
          range,
          contents: [
            { value: `**Action: ${act.name}**` },
            { value: act.description },
            ...(act.hasParam ? [{ value: `Parameter: ${act.paramType}` }] : []),
          ],
        };
      }

      // Check unit abilities (hover on ability ID in quotes)
      if (unitAbilities) {
        const ability = unitAbilities.find((a) => a.id === text);
        if (ability) {
          return {
            range,
            contents: [
              { value: `**Ability: ${ability.name}**` },
              ...(ability.description ? [{ value: ability.description }] : []),
              ...(ability.cooldownTicks ? [{ value: `Cooldown: ${ability.cooldownTicks / 4}s` }] : []),
            ],
          };
        }
      }

      // Keywords
      if (text === "IF") {
        return { range, contents: [{ value: "**IF** - Start a behavior rule" }, { value: "Followed by one or more conditions" }] };
      }
      if (text === "THEN") {
        return { range, contents: [{ value: "**THEN** - Specify the action" }, { value: "Followed by an action to perform" }] };
      }
      if (text === "ELSE") {
        return { range, contents: [{ value: "**ELSE** - Fallback rule" }, { value: "Action to perform when no other rule matches" }] };
      }
      if (text === "AND") {
        return { range, contents: [{ value: "**AND** - Combine conditions" }, { value: "All conditions must be true for the rule to trigger" }] };
      }

      return null;
    },
  });

  // Language configuration (brackets, comments, etc.)
  monaco.languages.setLanguageConfiguration(TACTICS_SCRIPT_LANG_ID, {
    comments: { lineComment: "//" },
    brackets: [["(", ")"]],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
  });
}
