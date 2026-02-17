"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { UNIT_MAP } from "@/lib/gamehub/tactics/units";
import { computeUnitStats } from "@/lib/gamehub/tactics/stats";
import {
  RARITY_LABELS,
  RARITY_COLORS,
  RARITY_BORDERS,
  RARITY_BG_COLORS,
  RARITY_STAT_MULTIPLIER,
  type Rarity,
} from "@/lib/gamehub/tactics/rarities";
import type { UnitInstance, EquipmentItem, EquipmentStat, ComputedUnitStats } from "@/lib/gamehub/tactics/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UnitRow {
  id: string;
  templateId: string;
  rarity: string;
  level: number;
  xp: number;
  equipment: {
    id: string;
    slot: string;
    name: string;
    rarity: string;
    stats: EquipmentStat[];
    enchantLevel: number;
    cursed: boolean;
    curseStats: EquipmentStat[];
    equipmentLevel?: number;
    equipmentXp?: number;
  }[];
}

const STAT_CONFIG = [
  { key: "maxHp", label: "HP", color: "text-red-400", barColor: "bg-red-400" },
  { key: "attack", label: "ATK", color: "text-orange-400", barColor: "bg-orange-400" },
  { key: "defense", label: "DEF", color: "text-blue-400", barColor: "bg-blue-400" },
  { key: "speed", label: "SPD", color: "text-green-400", barColor: "bg-green-400" },
  { key: "attackRange", label: "RNG", color: "text-purple-400", barColor: "bg-purple-400" },
  { key: "critChance", label: "CRIT%", color: "text-yellow-400", barColor: "bg-yellow-400" },
  { key: "critMultiplier", label: "CRIT DMG", color: "text-pink-400", barColor: "bg-pink-400" },
] as const;

// Reasonable max values for bar scaling per stat
const STAT_MAX: Record<string, number> = {
  maxHp: 250,
  attack: 40,
  defense: 30,
  speed: 20,
  attackRange: 6,
  critChance: 0.75,
  critMultiplier: 3,
};

export default function ComparePage() {
  const { data: unitsData } = useSWR("/api/gamehub/tactics/units", fetcher);
  const units: UnitRow[] = unitsData?.units ?? [];

  const [selectedIds, setSelectedIds] = useState<[string | null, string | null]>([null, null]);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  function selectUnit(id: string) {
    setSelectedIds((prev) => {
      const next = [...prev] as [string | null, string | null];
      next[activeSlot] = id;
      return next;
    });
    // Auto-switch to other slot
    setActiveSlot((prev) => (prev === 0 ? 1 : 0));
  }

  function clearSlot(slot: 0 | 1) {
    setSelectedIds((prev) => {
      const next = [...prev] as [string | null, string | null];
      next[slot] = null;
      return next;
    });
    setActiveSlot(slot);
  }

  // Compute stats for selected units
  const computedStats = useMemo(() => {
    return selectedIds.map((id) => {
      if (!id) return null;
      const unit = units.find((u) => u.id === id);
      if (!unit) return null;
      const template = UNIT_MAP[unit.templateId];
      if (!template) return null;

      const instance: UnitInstance = {
        id: unit.id,
        templateId: unit.templateId,
        rarity: unit.rarity as Rarity,
        level: unit.level,
        xp: unit.xp,
      };

      const equipment: EquipmentItem[] = unit.equipment.map((e) => ({
        id: e.id,
        slot: e.slot as EquipmentItem["slot"],
        name: e.name,
        rarity: e.rarity as Rarity,
        stats: e.stats,
        enchantLevel: e.enchantLevel,
        cursed: e.cursed,
        curseStats: e.curseStats,
        equipmentLevel: e.equipmentLevel ?? 1,
        equipmentXp: e.equipmentXp ?? 0,
      }));

      return {
        unit,
        template,
        stats: computeUnitStats(template, instance, equipment),
      };
    });
  }, [selectedIds, units]);

  // Sort units: highest rarity first, then level
  const RARITY_ORDER = ["secret", "mythic", "legendary", "epic", "rare", "uncommon", "common"];
  const sortedUnits = [...units].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    return b.level - a.level;
  });

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold tactics-heading">
          <GradientText>Compare Units</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Select two units to compare their stats side-by-side. Stats include rarity, level, and equipment bonuses.
        </p>
      </FadeIn>

      {/* Comparison Slots */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 gap-4">
          {([0, 1] as const).map((slot) => {
            const data = computedStats[slot];
            const isActive = activeSlot === slot;
            return (
              <div
                key={slot}
                onClick={() => setActiveSlot(slot)}
                className={cn(
                  "rounded-sm border-2 p-4 transition-all cursor-pointer tactics-card",
                  isActive ? "border-primary ring-2 ring-primary/30" : "border-border",
                  data ? RARITY_BG_COLORS[data.unit.rarity as Rarity] : "bg-card"
                )}
              >
                {data ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className={cn("text-lg font-bold", RARITY_COLORS[data.unit.rarity as Rarity])}>
                          {RARITY_LABELS[data.unit.rarity as Rarity]} {data.template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.template.class} &middot; Level {data.unit.level} &middot; {data.unit.equipment.length} gear
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearSlot(slot); }}
                        className="rounded-md p-1 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Icons.X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Icons.Plus className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isActive ? "Select a unit below" : "Click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Slot {slot + 1}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FadeIn>

      {/* Stat Comparison Bars */}
      {computedStats[0] && computedStats[1] && (
        <FadeIn delay={0.15}>
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <h2 className="text-lg font-bold text-foreground mb-4">Stat Comparison</h2>
            <div className="space-y-4">
              {STAT_CONFIG.map(({ key, label, color, barColor }) => {
                const val1 = computedStats[0]!.stats[key as keyof ComputedUnitStats] as number;
                const val2 = computedStats[1]!.stats[key as keyof ComputedUnitStats] as number;
                const max = STAT_MAX[key] ?? 100;
                const pct1 = Math.min(100, (val1 / max) * 100);
                const pct2 = Math.min(100, (val2 / max) * 100);
                const diff = val1 - val2;
                const isCritStat = key === "critChance" || key === "critMultiplier";

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("font-medium", color)}>{label}</span>
                      <div className="flex items-center gap-4 text-xs">
                        {diff !== 0 && (
                          <span className={diff > 0 ? "text-green-400" : "text-red-400"}>
                            {diff > 0 ? "+" : ""}{isCritStat ? (diff * 100).toFixed(1) + "%" : diff}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Unit 1 bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground w-12 text-right font-mono">
                          {isCritStat ? (val1 * 100).toFixed(1) + "%" : val1}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-background overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", barColor, val1 >= val2 ? "opacity-100" : "opacity-50")}
                            style={{ width: `${pct1}%` }}
                          />
                        </div>
                      </div>
                      {/* Unit 2 bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 rounded-full bg-background overflow-hidden flex justify-end">
                          <div
                            className={cn("h-full rounded-full transition-all", barColor, val2 >= val1 ? "opacity-100" : "opacity-50")}
                            style={{ width: `${pct2}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground w-12 font-mono">
                          {isCritStat ? (val2 * 100).toFixed(1) + "%" : val2}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Equipment Summary */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              {([0, 1] as const).map((slot) => {
                const data = computedStats[slot]!;
                return (
                  <div key={slot}>
                    <p className="text-xs font-semibold text-muted-foreground tactics-label mb-2">
                      {RARITY_LABELS[data.unit.rarity as Rarity]} {data.template.name} Equipment
                    </p>
                    {data.unit.equipment.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No equipment</p>
                    ) : (
                      <div className="space-y-1">
                        {data.unit.equipment.map((e) => (
                          <div key={e.id} className="text-xs flex items-center gap-2">
                            <span className={RARITY_COLORS[e.rarity as Rarity]}>{e.name}</span>
                            {e.enchantLevel > 0 && (
                              <span className="text-yellow-400">+{e.enchantLevel}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Single unit stat card when only one is selected */}
      {(computedStats[0] || computedStats[1]) && !(computedStats[0] && computedStats[1]) && (
        <FadeIn delay={0.15}>
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <p className="text-sm text-muted-foreground text-center">
              Select a second unit to compare stats side-by-side
            </p>
          </div>
        </FadeIn>
      )}

      {/* Unit Selection Grid */}
      <FadeIn delay={0.2}>
        <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
          <h2 className="text-lg font-bold text-foreground mb-1">
            Your Units ({units.length})
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Click a unit to place it in the {activeSlot === 0 ? "left" : "right"} slot
          </p>

          {sortedUnits.length === 0 ? (
            <div className="text-center py-8">
              <Icons.Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No units yet</p>
              <p className="text-xs text-muted-foreground mt-1">Spin the Lucky Wheel to get units!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {sortedUnits.map((unit) => {
                const tmpl = UNIT_MAP[unit.templateId];
                if (!tmpl) return null;
                const r = unit.rarity as Rarity;
                const isSelected = selectedIds.includes(unit.id);

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => selectUnit(unit.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-sm border-2 p-3 text-left transition-all hover:scale-[1.01]",
                      RARITY_BORDERS[r],
                      RARITY_BG_COLORS[r],
                      isSelected && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold truncate", RARITY_COLORS[r])}>
                        {RARITY_LABELS[r]} {tmpl.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tmpl.class} &middot; Lv.{unit.level}
                        {unit.equipment.length > 0 && ` &middot; ${unit.equipment.length} gear`}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {selectedIds[0] === unit.id ? "L" : "R"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
