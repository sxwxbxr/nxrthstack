"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EquipmentCard } from "@/components/gamehub/tactics/equipment-card";
import { getRerollCost, BUYABLE_SLOTS, STAT_RANGES_BY_RARITY, SLOT_TEMPLATES } from "@/lib/gamehub/tactics/equipment";
import { RARITY_LABELS, RARITY_COLORS, RARITY_BORDERS, RARITY_BG_COLORS, type Rarity } from "@/lib/gamehub/tactics/rarities";
import type { EquipmentStat, EquipmentSlot } from "@/lib/gamehub/tactics/types";
import { getSellPrice } from "@/lib/gamehub/tactics/equipment";
import { UNIT_MAP } from "@/lib/gamehub/tactics/units";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STAT_LABELS: Record<string, string> = {
  hp: "HP", attack: "ATK", defense: "DEF", speed: "SPD", critChance: "CRIT%", critDamage: "CRIT DMG",
};

const SLOT_LABELS: Record<string, string> = {
  weapon: "Weapon", shield: "Shield", helmet: "Helmet", chestpiece: "Chest",
  pants: "Pants", boots: "Boots", ring1: "Ring", ring2: "Ring", necklace: "Necklace",
};

interface EquipmentRow {
  id: string; name: string; slot: string; rarity: string;
  stats: EquipmentStat[]; enchantLevel: number; cursed: boolean;
  curseStats: EquipmentStat[]; unitInstanceId: string | null;
}

interface UnitRow {
  id: string; templateId: string; rarity: string; level: number;
  equipment: { id: string; slot: string; name: string; rarity: string }[];
}

export default function InventoryPage() {
  const { data: playerData, mutate: mutatePlayer } = useSWR("/api/gamehub/tactics/player", fetcher);
  const { data: equipData, mutate: mutateEquip } = useSWR("/api/gamehub/tactics/equipment", fetcher);
  const { data: unitsData, mutate: mutateUnits } = useSWR("/api/gamehub/tactics/units", fetcher);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSlot, setFilterSlot] = useState<string>("all");
  const [lockedStats, setLockedStats] = useState<Set<number>>(new Set());
  const [rerolling, setRerolling] = useState(false);
  const [selling, setSelling] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [showEquipPicker, setShowEquipPicker] = useState(false);

  const currency = playerData?.player?.currency ?? 0;
  const equipment: EquipmentRow[] = equipData?.equipment ?? [];
  const units: UnitRow[] = unitsData?.units ?? [];

  const filtered = filterSlot === "all"
    ? equipment
    : equipment.filter((e) => e.slot === filterSlot);

  const selected = equipment.find((e) => e.id === selectedId) ?? null;

  const unitNameMap: Record<string, string> = {};
  for (const u of units) {
    const tmpl = UNIT_MAP[u.templateId];
    const r = u.rarity as Rarity;
    unitNameMap[u.id] = tmpl
      ? `${RARITY_LABELS[r]} ${tmpl.name} (Lv.${u.level})`
      : u.templateId;
  }

  async function handleReroll() {
    if (!selected) return;
    setRerolling(true);
    try {
      const res = await fetch("/api/gamehub/tactics/equipment/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selected.id,
          lockedIndices: Array.from(lockedStats),
        }),
      });
      if (res.ok) {
        setLockedStats(new Set());
        mutateEquip();
      }
    } finally {
      setRerolling(false);
    }
  }

  async function handleSell() {
    if (!selected) return;
    setSelling(true);
    try {
      const res = await fetch(`/api/gamehub/tactics/equipment/${selected.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedId(null);
        mutateEquip();
        mutatePlayer();
      }
    } finally {
      setSelling(false);
    }
  }

  async function handleEquip(unitInstanceId: string) {
    if (!selected) return;
    setEquipping(true);
    try {
      const res = await fetch(`/api/gamehub/tactics/equipment/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitInstanceId }),
      });
      if (res.ok) {
        setShowEquipPicker(false);
        mutateEquip();
        mutateUnits();
      }
    } finally {
      setEquipping(false);
    }
  }

  async function handleUnequip() {
    if (!selected) return;
    setEquipping(true);
    try {
      const res = await fetch(`/api/gamehub/tactics/equipment/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitInstanceId: null }),
      });
      if (res.ok) {
        mutateEquip();
        mutateUnits();
      }
    } finally {
      setEquipping(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tactics-heading">
              <GradientText>Inventory</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your equipment. Equip, reroll, or sell items.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm border-2 border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
            <Icons.DollarSign className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-yellow-400 tactics-stat-label">{currency.toLocaleString()}</span>
          </div>
        </div>
      </FadeIn>

      {/* Slot Filter */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSlot("all")}
            className={cn(
              "rounded-sm border-2 px-3 py-1.5 text-sm font-medium transition-colors tactics-stat-label",
              filterSlot === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            All ({equipment.length})
          </button>
          {BUYABLE_SLOTS.map((slot) => {
            const count = equipment.filter((e) => e.slot === slot).length;
            return (
              <button
                key={slot}
                onClick={() => setFilterSlot(slot)}
                className={cn(
                  "rounded-sm border-2 px-3 py-1.5 text-sm font-medium transition-colors tactics-stat-label",
                  filterSlot === slot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {SLOT_LABELS[slot]} ({count})
              </button>
            );
          })}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Grid */}
        <FadeIn delay={0.15} className="lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 rounded-sm border-2 border-border bg-card tactics-card">
              <Icons.Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No equipment yet</p>
              <p className="text-sm text-muted-foreground mt-1">Visit the shop to buy some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((equip) => (
                <EquipmentCard
                  key={equip.id}
                  id={equip.id}
                  name={equip.name}
                  slot={equip.slot}
                  rarity={equip.rarity}
                  stats={equip.stats}
                  enchantLevel={equip.enchantLevel}
                  cursed={equip.cursed}
                  curseStats={equip.curseStats}
                  equipped={!!equip.unitInstanceId}
                  unitName={equip.unitInstanceId ? unitNameMap[equip.unitInstanceId] : undefined}
                  onClick={() => {
                    setSelectedId(equip.id);
                    setLockedStats(new Set());
                    setShowEquipPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </FadeIn>

        {/* Detail Panel */}
        <FadeIn delay={0.2}>
          {selected ? (
            <div className="rounded-sm border-2 border-border bg-card p-5 space-y-4 sticky top-4 tactics-card">
              <div>
                <p className={cn("text-lg font-bold", RARITY_COLORS[selected.rarity as Rarity])}>
                  {selected.name}
                  {selected.enchantLevel > 0 && <span className="text-yellow-400"> +{selected.enchantLevel}</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {SLOT_LABELS[selected.slot]} &middot;{" "}
                  <span className={RARITY_COLORS[selected.rarity as Rarity]}>
                    {RARITY_LABELS[selected.rarity as Rarity]}
                  </span>
                </p>
                {selected.unitInstanceId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Equipped on <span className="text-foreground font-medium">{unitNameMap[selected.unitInstanceId]}</span>
                  </p>
                )}
              </div>

              {/* Stats with lock toggles */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 tactics-label">
                  Stats (click to lock for reroll)
                </p>
                <div className="space-y-1.5">
                  {selected.stats.map((s, i) => {
                    const isLocked = lockedStats.has(i);
                    const range = getStatRangeForDisplay(selected, i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const next = new Set(lockedStats);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          setLockedStats(next);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full rounded-md border px-3 py-1.5 text-sm transition-colors",
                          isLocked
                            ? "border-yellow-500/50 bg-yellow-500/10"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isLocked && <Icons.Lock className="h-3 w-3 text-yellow-400" />}
                          <span className="text-muted-foreground">{STAT_LABELS[s.stat] ?? s.stat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-400">+{s.value}</span>
                          {!isLocked && (
                            <span className="text-xs text-muted-foreground">({range[0]}-{range[1]})</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Curse Stats */}
              {selected.cursed && selected.curseStats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1">Curse</p>
                  {selected.curseStats.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-1">
                      <span className="text-muted-foreground">{STAT_LABELS[s.stat] ?? s.stat}</span>
                      <span className="font-medium text-red-400">-{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                {/* Equip / Unequip */}
                {selected.unitInstanceId ? (
                  <button
                    onClick={handleUnequip}
                    disabled={equipping}
                    className="flex items-center justify-center gap-2 w-full rounded-sm border-2 border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    <Icons.ArrowRight className="h-4 w-4" />
                    {equipping ? "Unequipping..." : "Unequip"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowEquipPicker(!showEquipPicker)}
                    disabled={equipping || units.length === 0}
                    className="flex items-center justify-center gap-2 w-full rounded-sm border-2 border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                  >
                    <Icons.Shield className="h-4 w-4" />
                    Equip to Unit
                  </button>
                )}

                {/* Unit Picker for Equipping */}
                {showEquipPicker && !selected.unitInstanceId && (
                  <EquipUnitPicker
                    units={units}
                    equipmentSlot={selected.slot}
                    onSelect={handleEquip}
                    equipping={equipping}
                  />
                )}

                {/* Reroll */}
                <button
                  onClick={handleReroll}
                  disabled={rerolling || !canAffordReroll(currency, selected.rarity as Rarity, lockedStats.size)}
                  className="flex items-center justify-center gap-2 w-full rounded-sm border-2 border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icons.RefreshCw className={cn("h-4 w-4", rerolling && "animate-spin")} />
                  Reroll Stats — {getRerollCost(selected.rarity as Rarity, lockedStats.size)}g
                  {lockedStats.size > 0 && ` (${lockedStats.size} locked)`}
                </button>

                {/* Sell */}
                <button
                  onClick={handleSell}
                  disabled={selling}
                  className="flex items-center justify-center gap-2 w-full rounded-sm border-2 border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Icons.Trash2 className="h-4 w-4" />
                  Sell — +{getSellPrice(selected.rarity as Rarity)}g
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border-2 border-border bg-card p-6 text-center tactics-card">
              <Icons.Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select an item to view details</p>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}

// ============================================================================
// Equip Unit Picker - Choose which unit instance to equip an item to
// ============================================================================

function EquipUnitPicker({
  units,
  equipmentSlot,
  onSelect,
  equipping,
}: {
  units: UnitRow[];
  equipmentSlot: string;
  onSelect: (unitInstanceId: string) => void;
  equipping: boolean;
}) {
  const RARITY_ORDER = ["secret", "mythic", "legendary", "epic", "rare", "uncommon", "common"];
  const sorted = [...units].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    return b.level - a.level;
  });

  return (
    <div className="rounded-sm border-2 border-border bg-background p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground tactics-label">
        Choose unit to equip
      </p>
      <div className="max-h-48 overflow-y-auto space-y-1.5">
        {sorted.map((unit) => {
          const tmpl = UNIT_MAP[unit.templateId];
          const r = unit.rarity as Rarity;
          const currentInSlot = unit.equipment.find((e) => e.slot === equipmentSlot);
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onSelect(unit.id)}
              disabled={equipping}
              className={cn(
                "flex items-center justify-between w-full rounded-md border p-2 text-left text-sm transition-colors",
                RARITY_BORDERS[r],
                RARITY_BG_COLORS[r],
                "hover:ring-1 hover:ring-primary/50 disabled:opacity-50"
              )}
            >
              <div>
                <span className={cn("font-semibold", RARITY_COLORS[r])}>
                  {RARITY_LABELS[r]} {tmpl?.name ?? unit.templateId}
                </span>
                <span className="text-xs text-muted-foreground ml-2">Lv.{unit.level}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentInSlot ? (
                  <span className="text-yellow-400">Replace: {currentInSlot.name}</span>
                ) : (
                  <span>Empty slot</span>
                )}
              </div>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No units available. Spin the Lucky Wheel to get units!
          </p>
        )}
      </div>
    </div>
  );
}

function canAffordReroll(currency: number, rarity: Rarity, lockedCount: number): boolean {
  return currency >= getRerollCost(rarity, lockedCount);
}

function getStatRangeForDisplay(
  equipment: EquipmentRow,
  statIndex: number
): [number, number] {
  const ranges = STAT_RANGES_BY_RARITY[equipment.rarity as Rarity];
  const template = SLOT_TEMPLATES[equipment.slot as EquipmentSlot];
  const isPrimary = equipment.stats[statIndex]?.stat === template?.primary;
  return isPrimary ? ranges.primary : ranges.secondary;
}
