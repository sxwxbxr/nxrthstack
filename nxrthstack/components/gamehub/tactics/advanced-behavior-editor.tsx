"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { BehaviorRule } from "@/lib/gamehub/tactics/types";
import { parseTacticsScript, type ParseError } from "@/lib/gamehub/tactics/tacticsscript/parser";
import { ALL_CONDITIONS, ALL_ACTIONS, MAX_RULES } from "@/lib/gamehub/tactics/tacticsscript/grammar";

// Dynamic import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface AdvancedBehaviorEditorProps {
  initialScript: string;
  unitAbilities: { id: string; name: string }[];
  onSave: (rules: BehaviorRule[], script: string) => void;
  onCancel: () => void;
}

export function AdvancedBehaviorEditor({
  initialScript,
  unitAbilities,
  onSave,
  onCancel,
}: AdvancedBehaviorEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [ruleCount, setRuleCount] = useState(0);
  const [showDocs, setShowDocs] = useState(true);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  useEffect(() => {
    // Parse on script change
    const result = parseTacticsScript(script);
    setErrors(result.errors);
    setRuleCount(result.rules.length);
  }, [script]);

  function handleEditorMount(editor: unknown, monaco: typeof import("monaco-editor")) {
    monacoRef.current = monaco;

    // Register language
    import("@/lib/gamehub/tactics/tacticsscript/monaco-lang").then(({ registerTacticsScriptLanguage }) => {
      registerTacticsScriptLanguage(monaco);
    });
  }

  function handleValidate() {
    const result = parseTacticsScript(script);
    setErrors(result.errors);
    setRuleCount(result.rules.length);
  }

  function handleSave() {
    const result = parseTacticsScript(script);
    if (result.errors.length > 0) return;
    onSave(result.rules, script);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Code className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Advanced Mode</span>
          <span className="text-xs text-muted-foreground">
            ({ruleCount}/{MAX_RULES} rules)
          </span>
        </div>
        <button
          onClick={() => setShowDocs(!showDocs)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.BookOpen className="h-3.5 w-3.5" />
          {showDocs ? "Hide" : "Show"} Guide
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="rounded-lg border border-border overflow-hidden">
          <MonacoEditor
            height="300px"
            defaultLanguage="tacticsscript"
            value={script}
            onChange={(value) => setScript(value ?? "")}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              suggestOnTriggerCharacters: true,
            }}
          />
        </div>

        {/* Documentation Panel */}
        {showDocs && (
          <div className="rounded-lg border border-border bg-card p-4 max-h-[300px] overflow-y-auto text-xs space-y-4">
            <TacticsScriptDocs unitAbilities={unitAbilities} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <Icons.AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-400">
                <span className="font-medium">Line {err.line}:</span> {err.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleValidate}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Icons.Check className="inline h-4 w-4 mr-1" />
          Validate
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={errors.length > 0}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Save Rules
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Inline Documentation for Beginners
// ============================================================================

function TacticsScriptDocs({ unitAbilities }: { unitAbilities: { id: string; name: string }[] }) {
  return (
    <>
      <div>
        <p className="font-bold text-primary mb-1">Welcome to TacticsScript!</p>
        <p className="text-muted-foreground leading-relaxed">
          TacticsScript is a simple language for controlling your unit&apos;s AI.
          Each line is a rule that tells your unit what to do in battle.
          Rules are checked from top to bottom — the first rule that matches wins.
        </p>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Basic Syntax</p>
        <p className="text-muted-foreground mb-2">
          Every rule follows this format:
        </p>
        <pre className="bg-background rounded border border-border p-2 text-green-400">
          IF &lt;condition&gt; THEN &lt;action&gt;
        </pre>
        <p className="text-muted-foreground mt-2">
          The last rule should be a fallback using <code className="text-yellow-400">ELSE</code>:
        </p>
        <pre className="bg-background rounded border border-border p-2 text-green-400">
          ELSE attack_nearest
        </pre>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Example Script</p>
        <pre className="bg-background rounded border border-border p-2 text-green-400 whitespace-pre-wrap">
{`// Protect yourself first
IF self_low_hp(30) THEN move_to_cover

// Use ability when ready
IF ability_ready("shield_wall") THEN use_ability("shield_wall")

// Attack weak enemies
IF enemy_low_hp(25) THEN attack_lowest_hp

// Default: attack nearest
ELSE attack_nearest`}
        </pre>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Conditions</p>
        <p className="text-muted-foreground mb-2">
          Conditions check the battlefield state. Some take a parameter in parentheses:
        </p>
        <div className="space-y-1">
          {ALL_CONDITIONS.map((c) => (
            <div key={c.name} className="flex gap-2">
              <code className="text-cyan-400 shrink-0 font-mono">
                {c.name}{c.hasParam ? (c.paramType === "number" ? "(50)" : '("id")') : ""}
              </code>
              <span className="text-muted-foreground">{c.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Actions</p>
        <p className="text-muted-foreground mb-2">
          Actions tell your unit what to do when a condition is true:
        </p>
        <div className="space-y-1">
          {ALL_ACTIONS.map((a) => (
            <div key={a.name} className="flex gap-2">
              <code className="text-orange-400 shrink-0 font-mono">
                {a.name}{a.hasParam ? '("id")' : ""}
              </code>
              <span className="text-muted-foreground">{a.description}</span>
            </div>
          ))}
        </div>
      </div>

      {unitAbilities.length > 0 && (
        <div>
          <p className="font-semibold text-foreground mb-1">This Unit&apos;s Abilities</p>
          <p className="text-muted-foreground mb-2">
            Use these IDs with <code className="text-orange-400">use_ability</code> and <code className="text-cyan-400">ability_ready</code>:
          </p>
          <div className="space-y-1">
            {unitAbilities.map((a) => (
              <div key={a.id} className="flex gap-2">
                <code className="text-yellow-400 font-mono">&quot;{a.id}&quot;</code>
                <span className="text-muted-foreground">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-semibold text-foreground mb-1">Tips</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            <span className="text-green-400">1.</span> Rules are checked top-to-bottom.
            Put important rules (like &quot;run when low HP&quot;) at the top.
          </li>
          <li>
            <span className="text-green-400">2.</span> Always end with a fallback: <code className="text-yellow-400">ELSE attack_nearest</code>
          </li>
          <li>
            <span className="text-green-400">3.</span> Comments start with <code className="text-gray-400">//</code> — use them to explain your strategy!
          </li>
          <li>
            <span className="text-green-400">4.</span> HP thresholds are percentages (1-99).
            Lower = more desperate.
          </li>
          <li>
            <span className="text-green-400">5.</span> Maximum {MAX_RULES} rules per unit.
          </li>
          <li>
            <span className="text-green-400">6.</span> Type to get autocomplete suggestions!
          </li>
        </ul>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">What is coding?</p>
        <p className="text-muted-foreground leading-relaxed">
          Coding is giving instructions to a computer (or in this case, your unit).
          TacticsScript is designed to teach you the basics:
        </p>
        <ul className="space-y-1 text-muted-foreground mt-1">
          <li>
            <span className="text-purple-400">Conditions</span> = &quot;IF something is true&quot; (like an if-statement in real code)
          </li>
          <li>
            <span className="text-orange-400">Actions</span> = &quot;DO this thing&quot; (like a function call)
          </li>
          <li>
            <span className="text-yellow-400">Parameters</span> = extra details in parentheses (like function arguments)
          </li>
          <li>
            <span className="text-gray-400">Comments</span> = notes that the computer ignores (for humans to read)
          </li>
          <li>
            <span className="text-cyan-400">Priority</span> = order matters! First match wins (like else-if chains)
          </li>
        </ul>
        <p className="text-muted-foreground mt-2">
          These same concepts apply to Python, JavaScript, and every other programming language!
        </p>
      </div>
    </>
  );
}
