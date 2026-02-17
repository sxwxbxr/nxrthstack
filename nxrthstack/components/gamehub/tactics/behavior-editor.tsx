"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { BehaviorRule, BehaviorCondition, BehaviorAction } from "@/lib/gamehub/tactics/types";
import {
  CONDITION_LABELS,
  ACTION_LABELS,
  CONDITIONS_WITH_PARAM,
  ACTIONS_WITH_PARAM,
  ALL_PRESETS,
  PRESET_LIST,
} from "@/lib/gamehub/tactics/behaviors";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";

interface BehaviorEditorProps {
  templateId: string;
  rules: BehaviorRule[];
  onChange: (rules: BehaviorRule[]) => void;
  onClose: () => void;
}

const MAX_RULES = 5;

const CONDITIONS: BehaviorCondition[] = [
  "ENEMY_IN_RANGE",
  "ALLY_LOW_HP",
  "SELF_LOW_HP",
  "NO_ENEMY_IN_RANGE",
  "ABILITY_READY",
  "ENEMY_LOW_HP",
  "ALWAYS",
];

const ACTIONS: BehaviorAction[] = [
  "ATTACK_NEAREST",
  "ATTACK_LOWEST_HP",
  "ATTACK_HIGHEST_ATTACK",
  "MOVE_TOWARDS_ENEMY",
  "KITE",
  "USE_ABILITY",
  "HEAL_LOWEST_ALLY",
  "HOLD_POSITION",
  "MOVE_TO_COVER",
];

export function BehaviorEditor({ templateId, rules, onChange, onClose }: BehaviorEditorProps) {
  const [localRules, setLocalRules] = useState<BehaviorRule[]>(rules);
  const unit = ALL_UNITS[templateId];

  function updateRule(index: number, updates: Partial<BehaviorRule>) {
    const newRules = [...localRules];
    newRules[index] = { ...newRules[index], ...updates };
    setLocalRules(newRules);
  }

  function addRule() {
    if (localRules.length >= MAX_RULES) return;
    setLocalRules([
      ...localRules,
      {
        id: `rule_${Date.now()}`,
        priority: localRules.length + 1,
        condition: "ALWAYS",
        action: "ATTACK_NEAREST",
      },
    ]);
  }

  function removeRule(index: number) {
    const newRules = localRules.filter((_, i) => i !== index);
    setLocalRules(newRules.map((r, i) => ({ ...r, priority: i + 1 })));
  }

  function moveRule(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localRules.length) return;
    const newRules = [...localRules];
    [newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]];
    setLocalRules(newRules.map((r, i) => ({ ...r, priority: i + 1 })));
  }

  function loadPreset(presetId: string) {
    const preset = ALL_PRESETS[presetId];
    if (preset) {
      setLocalRules(
        preset.rules.map((r, i) => ({
          ...r,
          id: `preset_${presetId}_${i}_${Date.now()}`,
          priority: i + 1,
        }))
      );
    }
  }

  function handleSave() {
    onChange(localRules);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">
            {unit?.name ?? "Unit"} - Behavior Rules
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Load Preset</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_LIST.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset.id)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-3 mb-4">
          {localRules.map((rule, index) => (
            <div key={rule.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Rule #{index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveRule(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <Icons.ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRule(index, 1)}
                    disabled={index === localRules.length - 1}
                    className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <Icons.ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="rounded p-1 text-red-400 hover:text-red-300"
                  >
                    <Icons.Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-2">
                <label className="text-xs text-muted-foreground">IF</label>
                <select
                  value={rule.condition}
                  onChange={(e) => updateRule(index, { condition: e.target.value as BehaviorCondition })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              {/* Condition Param */}
              {CONDITIONS_WITH_PARAM.includes(rule.condition) && (
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">HP Threshold (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={rule.conditionParam ?? 50}
                    onChange={(e) => updateRule(index, { conditionParam: parseInt(e.target.value) || 50 })}
                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                  />
                </div>
              )}

              {/* Action */}
              <div className="mb-2">
                <label className="text-xs text-muted-foreground">THEN</label>
                <select
                  value={rule.action}
                  onChange={(e) => updateRule(index, { action: e.target.value as BehaviorAction })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                  ))}
                </select>
              </div>

              {/* Action Param (ability selector) */}
              {ACTIONS_WITH_PARAM.includes(rule.action) && unit && (
                <div>
                  <label className="text-xs text-muted-foreground">Ability</label>
                  <select
                    value={rule.actionParam ?? ""}
                    onChange={(e) => updateRule(index, { actionParam: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                  >
                    <option value="">Auto (first available)</option>
                    {unit.abilities.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Rule Button */}
        {localRules.length < MAX_RULES && (
          <button
            type="button"
            onClick={addRule}
            className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Icons.Plus className="inline h-4 w-4 mr-1" />
            Add Rule ({localRules.length}/{MAX_RULES})
          </button>
        )}

        {/* Save / Cancel */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
}
