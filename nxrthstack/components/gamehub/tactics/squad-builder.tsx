"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { UnitCard } from "./unit-card";
import { FormationEditor } from "./formation-editor";
import { BehaviorEditor } from "./behavior-editor";
import { ALL_UNITS, UNIT_LIST } from "@/lib/gamehub/tactics/units";
import { ALL_PRESETS, DEFAULT_PRESET_FOR_CLASS } from "@/lib/gamehub/tactics/behaviors";
import { RARITY_COLORS, RARITY_LABELS, RARITY_BORDERS, RARITY_BG_COLORS, type Rarity } from "@/lib/gamehub/tactics/rarities";
import type { Squad, SquadUnit } from "@/lib/gamehub/tactics/types";
import type { UnitInstanceData } from "@/app/(dashboard)/dashboard/gamehub/tactics/squad/page";

interface SquadBuilderProps {
  attackSquad: Squad | null;
  defenseSquad: Squad | null;
  unlockedUnitIds: string[];
  unitInstances: UnitInstanceData[];
  onSave: (type: "attack" | "defense", squad: Squad) => Promise<void>;
}

const MAX_SQUAD_SIZE = 5;

export function SquadBuilder({ attackSquad, defenseSquad, unlockedUnitIds, unitInstances, onSave }: SquadBuilderProps) {
  const [activeTab, setActiveTab] = useState<"attack" | "defense">("attack");
  const [squadUnits, setSquadUnits] = useState<Record<"attack" | "defense", SquadUnit[]>>({
    attack: attackSquad?.units ?? [],
    defense: defenseSquad?.units ?? [],
  });
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null);
  const [editingBehavior, setEditingBehavior] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pickerTemplate, setPickerTemplate] = useState<string | null>(null);

  const units = squadUnits[activeTab];
  const deployRow = activeTab === "attack" ? 7 : 0;

  // Group instances by template
  const instancesByTemplate: Record<string, UnitInstanceData[]> = {};
  for (const inst of unitInstances) {
    if (!instancesByTemplate[inst.templateId]) instancesByTemplate[inst.templateId] = [];
    instancesByTemplate[inst.templateId].push(inst);
  }

  function handleTemplateClick(templateId: string) {
    if (units.length >= MAX_SQUAD_SIZE) return;
    if (!unlockedUnitIds.includes(templateId)) return;

    const instances = instancesByTemplate[templateId];
    if (!instances || instances.length === 0) {
      // No instances, add as template-only (legacy)
      addUnit(templateId);
      return;
    }
    if (instances.length === 1) {
      // Only one instance, use it directly
      addUnit(templateId, instances[0].id);
      return;
    }
    // Multiple instances, show picker
    setPickerTemplate(templateId);
  }

  function addUnit(templateId: string, unitInstanceId?: string) {
    if (units.length >= MAX_SQUAD_SIZE) return;

    const template = ALL_UNITS[templateId];
    const presetId = DEFAULT_PRESET_FOR_CLASS[template.class] ?? "aggressive";
    const preset = ALL_PRESETS[presetId];

    // Find first empty X position in deploy row
    const usedX = new Set(units.map((u) => u.position.y === deployRow ? u.position.x : -1));
    let x = 0;
    while (usedX.has(x) && x < 8) x++;

    let y = deployRow;
    if (x >= 8) {
      const secondRow = activeTab === "attack" ? 6 : 1;
      const usedX2 = new Set(units.map((u) => u.position.y === secondRow ? u.position.x : -1));
      x = 0;
      while (usedX2.has(x) && x < 8) x++;
      if (x >= 8) return;
      y = secondRow;
    }

    const newUnit: SquadUnit = {
      unitInstanceId,
      templateId,
      instanceId: `${templateId}_${activeTab}_${Date.now()}`,
      behaviorRules: preset.rules.map((r, i) => ({ ...r, id: `${templateId}_${i}_${Date.now()}` })),
      position: { x, y },
    };

    setSquadUnits((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newUnit],
    }));
    setPickerTemplate(null);
  }

  function removeUnit(index: number) {
    setSquadUnits((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index),
    }));
    if (selectedUnitIndex === index) setSelectedUnitIndex(null);
  }

  function placeUnit(unitIndex: number, x: number, y: number) {
    setSquadUnits((prev) => {
      const updated = [...prev[activeTab]];
      updated[unitIndex] = { ...updated[unitIndex], position: { x, y } };
      return { ...prev, [activeTab]: updated };
    });
    setSelectedUnitIndex(null);
  }

  function updateBehaviorRules(unitIndex: number, rules: typeof units[0]["behaviorRules"]) {
    setSquadUnits((prev) => {
      const updated = [...prev[activeTab]];
      updated[unitIndex] = { ...updated[unitIndex], behaviorRules: rules };
      return { ...prev, [activeTab]: updated };
    });
  }

  async function handleSave() {
    if (units.length < 3) {
      setSaveMessage("Need at least 3 units");
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSave(activeTab, { units });
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Get instance info for a squad unit
  function getInstanceInfo(unit: SquadUnit): UnitInstanceData | undefined {
    if (!unit.unitInstanceId) return undefined;
    return unitInstances.find((i) => i.id === unit.unitInstanceId);
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["attack", "defense"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setSelectedUnitIndex(null); setEditingBehavior(null); setPickerTemplate(null); }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            )}
          >
            {tab === "attack" ? <Icons.Swords className="inline h-4 w-4 mr-1.5" /> : <Icons.Shield className="inline h-4 w-4 mr-1.5" />}
            {tab} Squad
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Unit Roster */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Available Units</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {UNIT_LIST.filter((u) => unlockedUnitIds.includes(u.id)).map((template) => {
              const instances = instancesByTemplate[template.id] ?? [];
              const hasMultiple = instances.length > 1;
              return (
                <div key={template.id} className="relative">
                  <UnitCard
                    templateId={template.id}
                    compact
                    onClick={() => handleTemplateClick(template.id)}
                  />
                  {instances.length > 0 && (
                    <span className="absolute top-1 right-1 rounded-full bg-primary/20 border border-primary/40 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {instances.length}x
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instance Picker Modal */}
          {pickerTemplate && (
            <InstancePicker
              templateId={pickerTemplate}
              instances={instancesByTemplate[pickerTemplate] ?? []}
              onSelect={(instanceId) => addUnit(pickerTemplate, instanceId)}
              onClose={() => setPickerTemplate(null)}
            />
          )}

          {/* Current Squad */}
          <h3 className="text-sm font-semibold text-foreground">
            Current Squad ({units.length}/{MAX_SQUAD_SIZE})
          </h3>
          <div className="space-y-2">
            {units.map((unit, index) => {
              const inst = getInstanceInfo(unit);
              return (
                <div
                  key={unit.instanceId}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border bg-card p-2",
                    selectedUnitIndex === index && "ring-2 ring-primary",
                    inst && RARITY_BORDERS[inst.rarity as Rarity]
                  )}
                >
                  <UnitCard
                    templateId={unit.templateId}
                    compact
                    selected={selectedUnitIndex === index}
                    onClick={() => setSelectedUnitIndex(selectedUnitIndex === index ? null : index)}
                    className="flex-1 border-0 p-0 hover:bg-transparent"
                  />
                  {/* Rarity + Level badge */}
                  {inst && (
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={cn("text-[10px] font-bold", RARITY_COLORS[inst.rarity as Rarity])}>
                        {RARITY_LABELS[inst.rarity as Rarity]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Lv.{inst.level}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingBehavior(index)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit behavior (simple)"
                  >
                    <Icons.Settings className="h-4 w-4" />
                  </button>
                  <a
                    href={`/dashboard/gamehub/tactics/script/${unit.instanceId}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="TacticsScript editor"
                  >
                    <Icons.Code className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeUnit(index)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remove"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {units.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Click on a unit above to add it to your squad
              </p>
            )}
          </div>
        </div>

        {/* Right: Formation Grid */}
        <div className="space-y-4">
          <FormationEditor
            units={units}
            squadType={activeTab}
            selectedUnitIndex={selectedUnitIndex}
            onPlaceUnit={placeUnit}
            onSelectUnit={setSelectedUnitIndex}
          />

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || units.length < 3}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Icons.Loader2 className="inline h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Icons.Check className="inline h-4 w-4 mr-1.5" />
              )}
              Save {activeTab} squad
            </button>
            {saveMessage && (
              <span className={cn("text-sm", saveMessage === "Saved!" ? "text-green-400" : "text-red-400")}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Behavior Editor Modal */}
      {editingBehavior !== null && units[editingBehavior] && (
        <BehaviorEditor
          templateId={units[editingBehavior].templateId}
          rules={units[editingBehavior].behaviorRules}
          onChange={(rules) => updateBehaviorRules(editingBehavior, rules)}
          onClose={() => setEditingBehavior(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Instance Picker - Choose which variant (rarity/level) of a unit to deploy
// ============================================================================

function InstancePicker({
  templateId,
  instances,
  onSelect,
  onClose,
}: {
  templateId: string;
  instances: UnitInstanceData[];
  onSelect: (instanceId: string) => void;
  onClose: () => void;
}) {
  const template = ALL_UNITS[templateId];
  if (!template) return null;

  // Sort: highest rarity first, then highest level
  const RARITY_ORDER = ["secret", "mythic", "legendary", "epic", "rare", "uncommon", "common"];
  const sorted = [...instances].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    return b.level - a.level;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Choose {template.name} variant
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icons.X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((inst) => {
          const r = inst.rarity as Rarity;
          const equippedCount = inst.equipment.length;
          return (
            <button
              key={inst.id}
              type="button"
              onClick={() => onSelect(inst.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 text-left transition-all hover:scale-[1.01]",
                RARITY_BORDERS[r],
                RARITY_BG_COLORS[r],
                "hover:ring-1 hover:ring-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className={cn("text-sm font-bold", RARITY_COLORS[r])}>
                    {RARITY_LABELS[r]} {template.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Level {inst.level}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {equippedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Icons.Shield className="h-3 w-3" />
                    {equippedCount} gear
                  </span>
                )}
                <Icons.ChevronRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
