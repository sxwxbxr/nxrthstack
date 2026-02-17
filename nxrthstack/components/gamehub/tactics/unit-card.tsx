"use client";

import { cn } from "@/lib/utils";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { Icons } from "@/components/icons";

interface UnitCardProps {
  templateId: string;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const CLASS_COLORS: Record<string, string> = {
  Tank: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ranger: "bg-green-500/20 text-green-400 border-green-500/30",
  Healer: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Assassin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const CLASS_ICONS: Record<string, typeof Icons.Shield> = {
  Tank: Icons.Shield,
  Ranger: Icons.Target,
  Healer: Icons.Heart,
  Assassin: Icons.Swords,
};

export function UnitCard({ templateId, compact, selected, onClick, className }: UnitCardProps) {
  const unit = ALL_UNITS[templateId];
  if (!unit) return null;

  const ClassIcon = CLASS_ICONS[unit.class] ?? Icons.Swords;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-left transition-all hover:bg-accent",
          selected && "ring-2 ring-primary border-primary",
          className
        )}
      >
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md border", CLASS_COLORS[unit.class])}>
          <ClassIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{unit.name}</p>
          <p className="text-xs text-muted-foreground">{unit.class}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-accent",
        selected && "ring-2 ring-primary border-primary",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", CLASS_COLORS[unit.class])}>
          <ClassIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{unit.name}</p>
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium border", CLASS_COLORS[unit.class])}>
            {unit.class}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{unit.description}</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">HP</span>
          <p className="font-bold text-red-400">{unit.maxHp}</p>
        </div>
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">ATK</span>
          <p className="font-bold text-orange-400">{unit.attack}</p>
        </div>
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">DEF</span>
          <p className="font-bold text-blue-400">{unit.defense}</p>
        </div>
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">SPD</span>
          <p className="font-bold text-green-400">{unit.speed}</p>
        </div>
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">RNG</span>
          <p className="font-bold text-purple-400">{unit.attackRange}</p>
        </div>
        <div className="rounded-md bg-background p-1.5 text-center">
          <span className="text-muted-foreground">CRIT</span>
          <p className="font-bold text-yellow-400">{Math.round(unit.critChance * 100)}%</p>
        </div>
      </div>

      {unit.abilities.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs text-muted-foreground mb-1">Abilities</p>
          {unit.abilities.map((ability) => (
            <div key={ability.id} className="text-xs text-foreground">
              <span className="font-medium">{ability.name}</span>
              <span className="text-muted-foreground"> - {ability.description}</span>
            </div>
          ))}
        </div>
      )}

      {unit.unlockCost > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
          <Icons.DollarSign className="h-3 w-3" />
          {unit.unlockCost}
        </div>
      )}
    </button>
  );
}
