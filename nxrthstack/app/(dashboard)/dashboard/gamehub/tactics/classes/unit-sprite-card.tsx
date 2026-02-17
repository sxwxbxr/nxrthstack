"use client";

import { cn } from "@/lib/utils";
import { UNIT_SPRITES } from "@/lib/gamehub/tactics/sprites";
import { PixelArtPreview } from "@/components/gamehub/tactics/pixel-art-preview";
import type { UnitTemplate, UnitClass } from "@/lib/gamehub/tactics/types";

interface UnitSpriteCardProps {
  unit: UnitTemplate;
  cls: UnitClass;
  classBadge: string;
  classAccent: string;
}

export function UnitSpriteCard({ unit, cls, classBadge, classAccent }: UnitSpriteCardProps) {
  const spriteData = UNIT_SPRITES[unit.spriteKey];

  return (
    <div className="rounded-sm border-2 border-border bg-card p-4 tactics-card">
      <div className="flex items-center gap-3 mb-2">
        {spriteData ? (
          <div className={cn("flex shrink-0 items-center justify-center rounded-md border overflow-hidden bg-[#1A1A2E]", classBadge)}>
            <PixelArtPreview spriteData={spriteData} scale={5} className="block" />
          </div>
        ) : (
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-md border text-xs text-muted-foreground", classBadge)}>
            ?
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{unit.name}</p>
          <span className={cn("text-xs font-medium", classAccent)}>{cls}</span>
          {unit.unlockCost === 0 ? (
            <span className="ml-2 text-xs text-green-400">Starter Unit</span>
          ) : (
            <span className="ml-2 text-xs text-yellow-400">{unit.unlockCost}g to unlock</span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{unit.description}</p>

      {/* Stat Bars */}
      <div className="space-y-1.5">
        <StatBar label="HP" value={unit.maxHp} max={120} color="bg-red-400" />
        <StatBar label="ATK" value={unit.attack} max={25} color="bg-orange-400" />
        <StatBar label="DEF" value={unit.defense} max={9} color="bg-blue-400" />
        <StatBar label="SPD" value={unit.speed} max={8} color="bg-green-400" />
        <StatBar label="RNG" value={unit.attackRange} max={5} color="bg-purple-400" />
        <StatBar label="CRIT" value={unit.critChance * 100} max={20} color="bg-yellow-400" suffix="%" />
      </div>

      {/* Abilities */}
      {unit.abilities.length > 0 && (
        <div className="mt-3 border-t border-border pt-2 space-y-1.5">
          {unit.abilities.map((ability) => (
            <div key={ability.id} className="text-xs">
              <span className={cn("font-semibold", classAccent)}>{ability.name}</span>
              <span className="text-muted-foreground"> &middot; CD: {(ability.cooldownTicks / 4).toFixed(0)}s</span>
              {ability.range > 0 && <span className="text-muted-foreground"> &middot; Range: {ability.range}</span>}
              <p className="text-muted-foreground mt-0.5">{ability.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, max, color, suffix = "" }: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-muted-foreground text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-foreground font-medium">{Math.round(value)}{suffix}</span>
    </div>
  );
}
