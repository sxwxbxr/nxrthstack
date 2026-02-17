"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ALL_UNITS, UNIT_LIST } from "@/lib/gamehub/tactics/units";
import { ALL_PRESETS, DEFAULT_PRESET_FOR_CLASS } from "@/lib/gamehub/tactics/behaviors";
import type { Squad, SquadUnit } from "@/lib/gamehub/tactics/types";
import type { MatchData } from "@/lib/gamehub/tactics/types";
import { MatchResult } from "@/components/gamehub/tactics/match-result";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MIN_SQUAD_SIZE = 5;
const MAX_SQUAD_SIZE = 10;
const GRID_WIDTH = 8;
const ATTACKER_ROWS = [5, 6, 7];
const DEFENDER_ROWS = [0, 1, 2];

type WarfareTab = "squads" | "battle";

interface WarfareData {
  warfareAttackSquad: Squad | null;
  warfareDefenseSquad: Squad | null;
  unlockedUnitIds: string[];
  warfareRating: number;
  warfareWins: number;
  warfareLosses: number;
}

export default function WarfarePage() {
  const [tab, setTab] = useState<WarfareTab>("squads");
  const { data, isLoading, mutate } = useSWR<WarfareData>(
    "/api/gamehub/tactics/warfare/squad",
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Failed to load warfare data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tactics-heading">
            <GradientText>Warfare</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            10v10 large-scale battles. Build massive squads and dominate!
          </p>
        </div>
      </FadeIn>

      {/* Stats bar */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-sm border-2 border-border p-3 tactics-card text-center">
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="text-lg font-bold text-foreground">{data.warfareRating}</p>
          </div>
          <div className="rounded-sm border-2 border-border p-3 tactics-card text-center">
            <p className="text-xs text-muted-foreground">Wins</p>
            <p className="text-lg font-bold text-green-400">{data.warfareWins}</p>
          </div>
          <div className="rounded-sm border-2 border-border p-3 tactics-card text-center">
            <p className="text-xs text-muted-foreground">Losses</p>
            <p className="text-lg font-bold text-red-400">{data.warfareLosses}</p>
          </div>
        </div>
      </FadeIn>

      {/* Tab switcher */}
      <FadeIn delay={0.1}>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-sm border-2 border-border w-fit">
          {(["squads", "battle"] as WarfareTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-sm transition-colors",
                tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === t && (
                <motion.div
                  layoutId="warfare-tab"
                  className="absolute inset-0 bg-primary/10 border-2 border-primary/30 rounded-sm"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {t === "squads" ? <Icons.Users className="h-4 w-4" /> : <Icons.Swords className="h-4 w-4" />}
                {t === "squads" ? "Squads" : "Battle"}
              </span>
            </button>
          ))}
        </div>
      </FadeIn>

      {tab === "squads" ? (
        <WarfareSquadManager data={data} onRefresh={() => mutate()} />
      ) : (
        <WarfareBattle />
      )}
    </div>
  );
}

function WarfareSquadManager({ data, onRefresh }: { data: WarfareData; onRefresh: () => void }) {
  const [squadType, setSquadType] = useState<"attack" | "defense">("attack");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentSquad = squadType === "attack" ? data.warfareAttackSquad : data.warfareDefenseSquad;
  const unlockedUnits = UNIT_LIST.filter((u) => (data.unlockedUnitIds as string[]).includes(u.id));
  const deployRows = squadType === "attack" ? ATTACKER_ROWS : DEFENDER_ROWS;

  const [units, setUnits] = useState<SquadUnit[]>(currentSquad?.units ?? []);

  useEffect(() => {
    const squad = squadType === "attack" ? data.warfareAttackSquad : data.warfareDefenseSquad;
    setUnits(squad?.units ?? []);
  }, [squadType, data]);

  function addUnit(templateId: string) {
    if (units.length >= MAX_SQUAD_SIZE) return;
    const template = ALL_UNITS[templateId];
    if (!template) return;

    // Find open position
    const occupied = new Set(units.map((u) => `${u.position.x},${u.position.y}`));
    let pos = { x: 0, y: deployRows[0] };
    outer:
    for (const row of deployRows) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (!occupied.has(`${x},${row}`)) {
          pos = { x, y: row };
          break outer;
        }
      }
    }

    const presetId = DEFAULT_PRESET_FOR_CLASS[template.class] ?? "aggressive";
    const preset = ALL_PRESETS[presetId];
    const idx = units.length;

    const newUnit: SquadUnit = {
      templateId,
      instanceId: `warfare_${squadType}_${templateId}_${idx}`,
      behaviorRules: preset
        ? preset.rules.map((r, ri) => ({ ...r, id: `wf_${templateId}_${idx}_${ri}` }))
        : [{ id: `wf_${templateId}_${idx}_0`, priority: 1, condition: "ALWAYS" as const, action: "ATTACK_NEAREST" as const }],
      position: pos,
    };

    setUnits([...units, newUnit]);
  }

  function removeUnit(idx: number) {
    setUnits(units.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (units.length < MIN_SQUAD_SIZE) {
      setStatus(`Need at least ${MIN_SQUAD_SIZE} units`);
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gamehub/tactics/warfare/squad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: squadType, squad: { units } }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error || "Failed to save");
      } else {
        setStatus("Saved!");
        onRefresh();
      }
    } catch {
      setStatus("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeIn delay={0.15}>
      <div className="space-y-6">
        {/* Attack/Defense toggle */}
        <div className="flex gap-2">
          {(["attack", "defense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSquadType(t)}
              className={cn(
                "px-4 py-2 rounded-sm border-2 text-sm font-medium transition-colors capitalize",
                squadType === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t} Squad
            </button>
          ))}
        </div>

        {/* Current squad */}
        <div className="rounded-sm border-2 border-border p-4 tactics-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tactics-heading capitalize">
              {squadType} Squad ({units.length}/{MAX_SQUAD_SIZE})
            </h3>
            <div className="flex items-center gap-2">
              {status && (
                <span className={cn(
                  "text-xs",
                  status === "Saved!" ? "text-green-400" : "text-red-400"
                )}>
                  {status}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-sm border-2 border-primary bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No units added. Add units from below.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {units.map((unit, i) => {
                const template = ALL_UNITS[unit.templateId];
                return (
                  <div key={i} className="rounded-sm border-2 border-border p-2 text-center relative group">
                    <Icons.Swords className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">{template?.name ?? unit.templateId}</p>
                    <p className="text-[10px] text-muted-foreground">{template?.class}</p>
                    <button
                      onClick={() => removeUnit(i)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available units */}
        <div className="rounded-sm border-2 border-border p-4 tactics-card">
          <h3 className="font-semibold mb-3 tactics-heading">Add Units</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {unlockedUnits.map((template) => (
              <button
                key={template.id}
                onClick={() => addUnit(template.id)}
                disabled={units.length >= MAX_SQUAD_SIZE}
                className="rounded-sm border-2 border-border p-2 text-center hover:bg-muted/30 transition-colors disabled:opacity-30"
              >
                <Icons.Plus className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium">{template.name}</p>
                <p className="text-[10px] text-muted-foreground">{template.class}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

type BattleState = "idle" | "searching" | "result" | "error";

function WarfareBattle() {
  const [state, setState] = useState<BattleState>("idle");
  const [matchResult, setMatchResult] = useState<MatchData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function findMatch() {
    setState("searching");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/gamehub/tactics/warfare/match", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to find match");
        setState("error");
        return;
      }

      setMatchResult(json.match as MatchData);
      setState("result");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setMatchResult(null);
    setErrorMessage(null);
  }

  return (
    <FadeIn delay={0.15}>
      <div className="max-w-lg mx-auto">
        {state === "idle" && (
          <div className="text-center space-y-6">
            <div className="rounded-sm border-2 border-border bg-card p-8 tactics-card">
              <Icons.Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2 tactics-heading">Warfare Battle</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your warfare attack squad (5-10 units) fights another player&apos;s warfare defense squad.
                Larger battles with 60-second time limit!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={findMatch}
                className="px-6 py-2.5 rounded-sm border-2 border-primary bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                <Icons.Swords className="inline h-4 w-4 mr-2" />
                Find Warfare Match
              </motion.button>
            </div>
          </div>
        )}

        {state === "searching" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4 py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Icons.Shield className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">Finding warfare opponent...</p>
          </motion.div>
        )}

        {state === "result" && matchResult && (
          <div className="space-y-4">
            <MatchResult match={matchResult} />
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-sm border-2 border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Icons.Shield className="inline h-4 w-4 mr-2" />
              Battle Again
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-4">
            <div className="rounded-sm border-2 border-red-500/30 bg-red-500/5 p-8 tactics-card">
              <Icons.AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">{errorMessage}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Make sure you have a warfare attack squad with at least 5 units.
              </p>
              <button
                type="button"
                onClick={reset}
                className="rounded-sm bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
