"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { parseTacticsScript, type ParseError } from "@/lib/gamehub/tactics/tacticsscript/parser";
import { ALL_CONDITIONS, ALL_ACTIONS, MAX_RULES } from "@/lib/gamehub/tactics/tacticsscript/grammar";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UnitAbility {
  id: string;
  name: string;
  cooldownTicks: number;
  description: string;
  effectType: string;
  range: number;
}

interface ScriptData {
  instanceId: string;
  templateId: string;
  squadType: "attack" | "defense";
  behaviorRules: unknown[];
  behaviorScript: string;
  template: {
    name: string;
    class: string;
    abilities: UnitAbility[];
  } | null;
}

export default function TacticsScriptEditorPage() {
  const params = useParams();
  const router = useRouter();
  const unitInstanceId = params.unitInstanceId as string;

  const { data, error, isLoading } = useSWR<ScriptData>(
    unitInstanceId ? `/api/gamehub/tactics/script/${unitInstanceId}` : null,
    fetcher
  );

  const [script, setScript] = useState("");
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [ruleCount, setRuleCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showDocs, setShowDocs] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  // Initialize script from API data
  useEffect(() => {
    if (data?.behaviorScript !== undefined) {
      setScript(data.behaviorScript);
      lastSavedRef.current = data.behaviorScript;
    }
  }, [data?.behaviorScript]);

  // Parse on script change
  useEffect(() => {
    if (!script && !data) return;
    const result = parseTacticsScript(script);
    setErrors(result.errors);
    setRuleCount(result.rules.length);
  }, [script, data]);

  // Auto-save with debounce
  const autoSave = useCallback(async (scriptToSave: string) => {
    if (scriptToSave === lastSavedRef.current) return;

    const result = parseTacticsScript(scriptToSave);
    if (result.errors.length > 0) return; // Don't save with errors

    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/gamehub/tactics/script/${unitInstanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptToSave }),
      });

      if (res.ok) {
        lastSavedRef.current = scriptToSave;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [unitInstanceId]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!script || !data) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave(script);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [script, autoSave, data]);

  function handleEditorMount(editor: unknown, monaco: typeof import("monaco-editor")) {
    monacoRef.current = monaco;

    import("@/lib/gamehub/tactics/tacticsscript/monaco-lang").then(({ registerTacticsScriptLanguage }) => {
      registerTacticsScriptLanguage(monaco, data?.template?.abilities ?? []);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.template) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Icons.AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-muted-foreground">Unit not found in your squad.</p>
        <button
          onClick={() => router.push("/dashboard/gamehub/tactics/squad")}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Back to Squad Builder
        </button>
      </div>
    );
  }

  const template = ALL_UNITS[data.templateId];
  const hasUnsavedChanges = script !== lastSavedRef.current;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/gamehub/tactics/squad")}
            className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {data.template.name} — TacticsScript Editor
            </h1>
            <p className="text-xs text-muted-foreground">
              {data.template.class} &middot; {data.squadType === "attack" ? "Attack" : "Defense"} Squad
              &middot; {ruleCount}/{MAX_RULES} rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save Status */}
          <span className={cn(
            "text-xs font-medium",
            saveStatus === "saving" && "text-yellow-400",
            saveStatus === "saved" && "text-green-400",
            saveStatus === "error" && "text-red-400",
            saveStatus === "idle" && hasUnsavedChanges && "text-yellow-400",
            saveStatus === "idle" && !hasUnsavedChanges && "text-muted-foreground",
          )}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save failed"}
            {saveStatus === "idle" && hasUnsavedChanges && "Unsaved changes"}
            {saveStatus === "idle" && !hasUnsavedChanges && "Up to date"}
          </span>

          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.BookOpen className="h-3.5 w-3.5" />
            {showDocs ? "Hide" : "Show"} Guide
          </button>

          <a
            href="/dashboard/gamehub/tactics/wiki"
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.ExternalLink className="h-3.5 w-3.5" />
            Wiki
          </a>
        </div>
      </div>

      {/* Editor + Docs Layout */}
      <div className={cn(
        "grid gap-4",
        showDocs ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1"
      )}>
        {/* Monaco Editor */}
        <div className="rounded-lg border border-border overflow-hidden">
          <MonacoEditor
            height="calc(100vh - 280px)"
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
              quickSuggestions: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Documentation Panel */}
        {showDocs && (
          <div className="rounded-lg border border-border bg-card p-4 overflow-y-auto text-xs space-y-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <ScriptEditorDocs abilities={data.template.abilities} unitClass={data.template.class} />
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
    </div>
  );
}

// ============================================================================
// Documentation Component
// ============================================================================

function ScriptEditorDocs({
  abilities,
  unitClass,
}: {
  abilities: UnitAbility[];
  unitClass: string;
}) {
  return (
    <>
      <div>
        <p className="font-bold text-primary mb-1">TacticsScript</p>
        <p className="text-muted-foreground leading-relaxed">
          Rules are checked top-to-bottom. The first matching rule wins.
          Auto-saves after 2 seconds when there are no errors.
        </p>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Syntax</p>
        <pre className="bg-background rounded border border-border p-2 text-green-400 whitespace-pre-wrap">
{`IF <condition> THEN <action>
IF <cond1> AND <cond2> THEN <action>
ELSE <action>`}
        </pre>
      </div>

      {abilities.length > 0 && (
        <div>
          <p className="font-semibold text-foreground mb-1">
            {unitClass} Abilities
          </p>
          <div className="space-y-2">
            {abilities.map((a) => (
              <div key={a.id} className="rounded border border-border bg-background p-2">
                <div className="flex items-center justify-between">
                  <code className="text-yellow-400 font-mono text-[11px]">&quot;{a.id}&quot;</code>
                  <span className="text-[10px] text-muted-foreground">
                    CD: {a.cooldownTicks / 4}s &middot; Range: {a.range}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-semibold text-foreground mb-1">Conditions</p>
        <div className="space-y-1">
          {ALL_CONDITIONS.map((c) => (
            <div key={c.name} className="flex gap-2">
              <code className="text-cyan-400 shrink-0 font-mono text-[11px]">
                {c.name}{c.hasParam ? (c.paramType === "number" ? "(50)" : '("id")') : ""}
              </code>
              <span className="text-muted-foreground">{c.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Actions</p>
        <div className="space-y-1">
          {ALL_ACTIONS.map((a) => (
            <div key={a.name} className="flex gap-2">
              <code className="text-orange-400 shrink-0 font-mono text-[11px]">
                {a.name}{a.hasParam ? '("id")' : ""}
              </code>
              <span className="text-muted-foreground">{a.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">AND Conditions</p>
        <p className="text-muted-foreground mb-2">
          Combine multiple conditions that must all be true:
        </p>
        <pre className="bg-background rounded border border-border p-2 text-green-400 whitespace-pre-wrap text-[11px]">
{`IF ability_ready("fireball") AND enemy_in_range THEN use_ability("fireball")
IF self_low_hp(30) AND no_enemy_in_range THEN move_to_cover`}
        </pre>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Tips</p>
        <ul className="space-y-1 text-muted-foreground">
          <li><span className="text-green-400">1.</span> Put defensive rules at the top</li>
          <li><span className="text-green-400">2.</span> Always end with <code className="text-yellow-400">ELSE</code> as fallback</li>
          <li><span className="text-green-400">3.</span> Use <code className="text-yellow-400">//</code> for comments</li>
          <li><span className="text-green-400">4.</span> HP thresholds: 1-99 (lower = more desperate)</li>
          <li><span className="text-green-400">5.</span> Max {MAX_RULES} rules per unit</li>
          <li><span className="text-green-400">6.</span> Type to get autocomplete suggestions</li>
        </ul>
      </div>
    </>
  );
}
