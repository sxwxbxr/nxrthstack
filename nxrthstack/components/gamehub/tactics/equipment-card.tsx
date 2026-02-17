"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RARITY_COLORS, RARITY_BORDERS, RARITY_BG_COLORS, RARITY_GLOW, RARITY_LABELS, type Rarity } from "@/lib/gamehub/tactics/rarities";
import type { EquipmentStat } from "@/lib/gamehub/tactics/types";

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  speed: "SPD",
  critChance: "CRIT%",
  critDamage: "CRIT DMG",
};

const SLOT_ICONS: Record<string, typeof Icons.Shield> = {
  weapon: Icons.Swords,
  shield: Icons.Shield,
  helmet: Icons.Crown,
  chestpiece: Icons.Shirt,
  pants: Icons.Shirt,
  boots: Icons.Footprints,
  ring1: Icons.Circle,
  ring2: Icons.Circle,
  necklace: Icons.Gem,
};

const SLOT_LABELS: Record<string, string> = {
  weapon: "Weapon",
  shield: "Shield",
  helmet: "Helmet",
  chestpiece: "Chestpiece",
  pants: "Pants",
  boots: "Boots",
  ring1: "Ring",
  ring2: "Ring",
  necklace: "Necklace",
};

interface EquipmentCardProps {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  stats: EquipmentStat[];
  enchantLevel: number;
  cursed: boolean;
  curseStats: EquipmentStat[];
  equipmentLevel?: number;
  equipmentXp?: number;
  equipped?: boolean;
  unitName?: string;
  onClick?: () => void;
  compact?: boolean;
}

export function EquipmentCard({
  id,
  name,
  slot,
  rarity,
  stats,
  enchantLevel,
  cursed,
  curseStats,
  equipmentLevel,
  equipmentXp,
  equipped,
  unitName,
  onClick,
  compact,
}: EquipmentCardProps) {
  const r = rarity as Rarity;
  const SlotIcon = SLOT_ICONS[slot] ?? Icons.Package;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-sm border-2 p-3 transition-all overflow-hidden tactics-card",
        RARITY_BORDERS[r],
        RARITY_BG_COLORS[r],
        RARITY_GLOW[r],
        onClick && "cursor-pointer hover:scale-[1.02]",
        compact && "p-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-sm border-2", RARITY_BORDERS[r])}>
          <SlotIcon className={cn("h-3.5 w-3.5", RARITY_COLORS[r])} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold truncate tactics-stat-label", RARITY_COLORS[r])}>
            {name}
            {enchantLevel > 0 && (
              <span className="text-yellow-400"> +{enchantLevel}</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="tactics-label">{SLOT_LABELS[slot] ?? slot}</span>
            <span>&middot;</span>
            <span className={cn("tactics-label", RARITY_COLORS[r])}>{RARITY_LABELS[r]}</span>
            {(equipmentLevel ?? 1) > 1 && (
              <>
                <span>&middot;</span>
                <span className="text-cyan-400 tactics-label">Lv.{equipmentLevel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!compact && (
        <div className="space-y-0.5">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground tactics-stat-label">{STAT_LABELS[s.stat] ?? s.stat}</span>
              <span className="font-medium text-green-400">+{s.value}</span>
            </div>
          ))}
          {cursed && curseStats.length > 0 && (
            <>
              {curseStats.map((s, i) => (
                <div key={`curse-${i}`} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground tactics-stat-label">{STAT_LABELS[s.stat] ?? s.stat}</span>
                  <span className="font-medium text-red-400">-{s.value}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      {equipped && unitName && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Equipped on <span className="text-foreground font-medium">{unitName}</span>
        </p>
      )}
      {cursed && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <Icons.AlertTriangle className="h-3 w-3" />
          Cursed
        </p>
      )}
    </div>
  );
}
