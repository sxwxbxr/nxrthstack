"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EquipmentCard } from "@/components/gamehub/tactics/equipment-card";
import { getEnchantCost, getSuccessRate, MAX_ENCHANT_LEVEL } from "@/lib/gamehub/tactics/enchanting";
import { RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/gamehub/tactics/rarities";
import type { EquipmentStat } from "@/lib/gamehub/tactics/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STAT_LABELS: Record<string, string> = {
  hp: "HP", attack: "ATK", defense: "DEF", speed: "SPD", critChance: "CRIT%", critDamage: "CRIT DMG",
};

interface EquipmentRow {
  id: string; name: string; slot: string; rarity: string;
  stats: EquipmentStat[]; enchantLevel: number; cursed: boolean;
  curseStats: EquipmentStat[];
}

type EnchantResultType = "success" | "curse" | "neutral";

export default function WizardTowerPage() {
  const { data: playerData, mutate: mutatePlayer } = useSWR("/api/gamehub/tactics/player", fetcher);
  const { data: equipData, mutate: mutateEquip } = useSWR("/api/gamehub/tactics/equipment", fetcher);
  const { data: historyData, mutate: mutateHistory } = useSWR("/api/gamehub/tactics/enchant", fetcher);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [enchanting, setEnchanting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    result: EnchantResultType;
    statBoost?: EquipmentStat;
    curseStat?: EquipmentStat;
  } | null>(null);

  const currency = playerData?.player?.currency ?? 0;
  const equipment: EquipmentRow[] = equipData?.equipment ?? [];
  const history = historyData?.history ?? [];

  const selected = equipment.find((e) => e.id === selectedId) ?? null;
  const cost = selected ? getEnchantCost(selected.rarity as Rarity, selected.enchantLevel) : 0;
  const successRate = selected ? getSuccessRate(selected.rarity as Rarity, selected.enchantLevel) : 0;
  const canEnchant = selected && selected.enchantLevel < MAX_ENCHANT_LEVEL && currency >= cost;

  async function handleEnchant() {
    if (!selected) return;
    setEnchanting(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/gamehub/tactics/enchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: selected.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastResult({
          result: data.result,
          statBoost: data.statBoost ?? undefined,
          curseStat: data.curseStat ?? undefined,
        });
        mutatePlayer();
        mutateEquip();
        mutateHistory();
      }
    } finally {
      setEnchanting(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>Wizard Tower</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enchant your equipment to boost stats. But beware of curses...
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
            <Icons.DollarSign className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-yellow-400">{currency.toLocaleString()}</span>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Selection */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Select Equipment to Enchant
            </p>
            {equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No equipment. Visit the shop first!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {equipment.map((equip) => (
                  <div
                    key={equip.id}
                    className={cn(
                      "rounded-lg transition-all",
                      selectedId === equip.id && "ring-2 ring-primary"
                    )}
                  >
                    <EquipmentCard
                      id={equip.id}
                      name={equip.name}
                      slot={equip.slot}
                      rarity={equip.rarity}
                      stats={equip.stats}
                      enchantLevel={equip.enchantLevel}
                      cursed={equip.cursed}
                      curseStats={equip.curseStats}
                      onClick={() => {
                        setSelectedId(equip.id);
                        setLastResult(null);
                      }}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Enchant Panel */}
        <FadeIn delay={0.15}>
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
                  <Icons.Wand className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-purple-400">Enchantment Altar</p>
                  <p className="text-xs text-muted-foreground">The arcane energies swirl...</p>
                </div>
              </div>

              {selected ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Item</span>
                      <span className={cn("font-medium", RARITY_COLORS[selected.rarity as Rarity])}>
                        {selected.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Level</span>
                      <span className="font-medium text-yellow-400">+{selected.enchantLevel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className={cn(
                        "font-medium",
                        successRate >= 0.5 ? "text-green-400" : successRate >= 0.2 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {Math.round(successRate * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-medium text-yellow-400">{cost.toLocaleString()}g</span>
                    </div>
                  </div>

                  {selected.enchantLevel >= MAX_ENCHANT_LEVEL ? (
                    <p className="text-sm text-center text-yellow-400 font-medium">
                      Max enchant level reached!
                    </p>
                  ) : (
                    <ShimmerButton
                      onClick={handleEnchant}
                      disabled={!canEnchant || enchanting}
                      className="w-full"
                    >
                      {enchanting ? (
                        <>
                          <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enchanting...
                        </>
                      ) : (
                        <>
                          <Icons.Sparkles className="h-4 w-4 mr-2" />
                          Enchant — {cost.toLocaleString()}g
                        </>
                      )}
                    </ShimmerButton>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select an item to enchant
                </p>
              )}

              {/* Result Display */}
              {lastResult && (
                <div className={cn(
                  "rounded-lg border p-3 text-sm",
                  lastResult.result === "success"
                    ? "border-green-500/30 bg-green-500/10"
                    : lastResult.result === "curse"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-gray-500/30 bg-gray-500/10"
                )}>
                  {lastResult.result === "success" && (
                    <div className="flex items-center gap-2">
                      <Icons.Sparkles className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="font-medium text-green-400">Enchantment Success!</p>
                        {lastResult.statBoost && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {STAT_LABELS[lastResult.statBoost.stat]} +{lastResult.statBoost.value}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {lastResult.result === "curse" && (
                    <div className="flex items-center gap-2">
                      <Icons.AlertTriangle className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Cursed!</p>
                        {lastResult.curseStat && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {STAT_LABELS[lastResult.curseStat.stat]} -{lastResult.curseStat.value}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {lastResult.result === "neutral" && (
                    <div className="flex items-center gap-2">
                      <Icons.Minus className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-400">Nothing happened...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Enchant History */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Recent Enchants
              </p>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No enchant history yet</p>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {history.slice(0, 10).map((h: { id: string; result: string; costPaid: number; details: { statBoost?: EquipmentStat; curseStat?: EquipmentStat } }) => (
                    <div key={h.id} className="flex items-center justify-between text-xs px-2 py-1 rounded border border-border">
                      <span className={cn(
                        "font-medium",
                        h.result === "enchant" || h.result === "success" ? "text-green-400"
                          : h.result === "curse" ? "text-red-400"
                          : "text-gray-400"
                      )}>
                        {h.result === "enchant" || h.result === "success" ? "Success" : h.result === "curse" ? "Cursed" : "Neutral"}
                      </span>
                      <span className="text-muted-foreground">-{h.costPaid}g</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
