// ============================================================================
// Monaco Language Definition for TacticsScript
// Provides syntax highlighting, autocomplete, and hover tooltips.
// ============================================================================

import { ALL_CONDITIONS, ALL_ACTIONS } from "./grammar";

export const TACTICS_SCRIPT_LANG_ID = "tacticsscript";

/**
 * Register the TacticsScript language with Monaco.
 * Call this once when Monaco is loaded.
 */
export function registerTacticsScriptLanguage(monaco: typeof import("monaco-editor")) {
  // Register the language
  monaco.languages.register({ id: TACTICS_SCRIPT_LANG_ID });

  // Tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(TACTICS_SCRIPT_LANG_ID, {
    keywords: ["IF", "THEN", "ELSE"],
    conditions: ALL_CONDITIONS.map((c) => c.name),
    actions: ALL_ACTIONS.map((a) => a.name),

    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, "comment"],

        // Keywords
        [/\b(IF|THEN|ELSE)\b/, "keyword"],

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
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber).trimStart().toUpperCase();

      const suggestions: import("monaco-editor").languages.CompletionItem[] = [];

      // Suggest IF at start of line
      if (lineContent === "" || lineContent === "I") {
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
          label: "ELSE ...",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "ELSE ${1:action}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Fallback rule (always true)",
          documentation: "Shorthand for IF always THEN <action>",
          range,
        });
      }

      // After IF, suggest conditions
      if (lineContent.startsWith("IF ") && !lineContent.includes("THEN")) {
        for (const cond of ALL_CONDITIONS) {
          const insertText = cond.hasParam
            ? cond.paramType === "number"
              ? `${cond.name}(\${1:50})`
              : `${cond.name}("\${1:ability_id}")`
            : cond.name;

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
      }

      // After THEN or ELSE, suggest actions
      if (lineContent.includes("THEN ") || lineContent.startsWith("ELSE ")) {
        for (const act of ALL_ACTIONS) {
          const insertText = act.hasParam
            ? `${act.name}("\${1:ability_id}")`
            : act.name;

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

      // Always suggest conditions and actions as general completion
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

      // Keywords
      if (text === "IF") {
        return { range, contents: [{ value: "**IF** - Start a behavior rule" }, { value: "Followed by a condition" }] };
      }
      if (text === "THEN") {
        return { range, contents: [{ value: "**THEN** - Specify the action" }, { value: "Followed by an action to perform" }] };
      }
      if (text === "ELSE") {
        return { range, contents: [{ value: "**ELSE** - Fallback rule" }, { value: "Action to perform when no other rule matches" }] };
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
