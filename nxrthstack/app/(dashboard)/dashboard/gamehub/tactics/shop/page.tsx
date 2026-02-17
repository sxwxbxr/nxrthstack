"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { DungeonButton } from "@/components/gamehub/tactics/dungeon-button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EquipmentCard } from "@/components/gamehub/tactics/equipment-card";
import { EQUIPMENT_SHOP_PRICES, BUYABLE_SLOTS, BUYABLE_RARITIES } from "@/lib/gamehub/tactics/equipment";
import { RARITY_LABELS, RARITY_COLORS, RARITY_BORDERS, type Rarity } from "@/lib/gamehub/tactics/rarities";
import type { EquipmentSlot, EquipmentStat } from "@/lib/gamehub/tactics/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SLOT_LABELS: Record<string, string> = {
  weapon: "Weapon", shield: "Shield", helmet: "Helmet", chestpiece: "Chest",
  pants: "Pants", boots: "Boots", ring1: "Ring", ring2: "Ring", necklace: "Necklace",
};

export default function ShopPage() {
  const { data: playerData, mutate: mutatePlayer } = useSWR("/api/gamehub/tactics/player", fetcher);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>("weapon");
  const [selectedRarity, setSelectedRarity] = useState<Rarity>("common");
  const [buying, setBuying] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{
    equipment: { id: string; name: string; slot: string; rarity: string; stats: EquipmentStat[]; enchantLevel: number; cursed: boolean; curseStats: EquipmentStat[] };
  } | null>(null);

  const currency = playerData?.player?.currency ?? 0;
  const price = EQUIPMENT_SHOP_PRICES[selectedRarity];
  const canAfford = currency >= price;

  async function handleBuy() {
    setBuying(true);
    setLastPurchase(null);
    try {
      const res = await fetch("/api/gamehub/tactics/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: selectedSlot, rarity: selectedRarity }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastPurchase({ equipment: data.equipment });
        mutatePlayer();
      }
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tactics-heading">
              <GradientText>Equipment Shop</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Buy equipment to power up your units. Stats are randomly generated.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm border-2 border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
            <Icons.DollarSign className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-yellow-400 tactics-stat-label">{currency.toLocaleString()}</span>
          </div>
        </div>
      </FadeIn>

      {/* Slot Selection */}
      <FadeIn delay={0.1}>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2 tactics-label">Equipment Slot</p>
          <div className="flex flex-wrap gap-2">
            {BUYABLE_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "rounded-sm border-2 px-3 py-1.5 text-sm font-medium transition-colors tactics-stat-label",
                  selectedSlot === slot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {SLOT_LABELS[slot]}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Rarity Selection */}
      <FadeIn delay={0.15}>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2 tactics-label">Rarity</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {BUYABLE_RARITIES.map((rarity) => {
              const p = EQUIPMENT_SHOP_PRICES[rarity];
              return (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={cn(
                    "rounded-sm border-2 p-3 text-left transition-all tactics-card",
                    selectedRarity === rarity
                      ? cn(RARITY_BORDERS[rarity], "bg-primary/5 ring-1 ring-primary/30")
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <p className={cn("text-sm font-semibold tactics-stat-label", RARITY_COLORS[rarity])}>
                    {RARITY_LABELS[rarity]}
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">{p.toLocaleString()}g</p>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Buy Button */}
      <FadeIn delay={0.2}>
        <div className="flex items-center gap-4">
          <DungeonButton
            onClick={handleBuy}
            disabled={!canAfford || buying}
          >
            {buying ? (
              <>
                <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Forging...
              </>
            ) : (
              <>
                <Icons.ShoppingBag className="h-4 w-4 mr-2" />
                Buy {RARITY_LABELS[selectedRarity]} {SLOT_LABELS[selectedSlot]} — {price.toLocaleString()}g
              </>
            )}
          </DungeonButton>
          {!canAfford && (
            <p className="text-sm text-red-400">Not enough currency</p>
          )}
        </div>
      </FadeIn>

      {/* Purchase Result */}
      {lastPurchase && (
        <FadeIn>
          <div className="rounded-sm border-2 border-green-500/30 bg-green-500/5 p-6 tactics-card">
            <p className="text-sm font-semibold text-green-400 mb-3 tactics-heading">Equipment Purchased!</p>
            <div className="max-w-xs">
              <EquipmentCard
                id={lastPurchase.equipment.id}
                name={lastPurchase.equipment.name}
                slot={lastPurchase.equipment.slot}
                rarity={lastPurchase.equipment.rarity}
                stats={lastPurchase.equipment.stats}
                enchantLevel={lastPurchase.equipment.enchantLevel}
                cursed={lastPurchase.equipment.cursed}
                curseStats={lastPurchase.equipment.curseStats}
              />
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
