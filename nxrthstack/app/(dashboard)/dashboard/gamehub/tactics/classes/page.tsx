import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { UNIT_LIST } from "@/lib/gamehub/tactics/units";
import { CLASS_DESCRIPTIONS, type UnitClass } from "@/lib/gamehub/tactics/types";
import { cn } from "@/lib/utils";

const CLASS_ORDER: UnitClass[] = ["Tank", "Ranger", "Healer", "Assassin"];

const CLASS_COLORS: Record<string, string> = {
  Tank: "border-blue-500/30 bg-blue-500/5",
  Ranger: "border-green-500/30 bg-green-500/5",
  Healer: "border-yellow-500/30 bg-yellow-500/5",
  Assassin: "border-purple-500/30 bg-purple-500/5",
};

const CLASS_ACCENT: Record<string, string> = {
  Tank: "text-blue-400",
  Ranger: "text-green-400",
  Healer: "text-yellow-400",
  Assassin: "text-purple-400",
};

const CLASS_BADGE: Record<string, string> = {
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

export default function ClassesPage() {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold">
            <GradientText>Classes & Units</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Learn about the four unit classes, their strengths, weaknesses, and individual units.
          </p>
        </div>
      </FadeIn>

      {CLASS_ORDER.map((cls, i) => {
        const info = CLASS_DESCRIPTIONS[cls];
        const ClassIcon = CLASS_ICONS[cls];
        const classUnits = UNIT_LIST.filter((u) => u.class === cls);

        return (
          <FadeIn key={cls} delay={0.1 * (i + 1)}>
            <div className={cn("rounded-xl border p-6 space-y-5", CLASS_COLORS[cls])}>
              {/* Class Header */}
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", CLASS_BADGE[cls])}>
                  <ClassIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{cls}</h2>
                  <p className={cn("text-sm font-medium", CLASS_ACCENT[cls])}>{info.tagline}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{info.description}</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-xs font-semibold text-green-400 mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {info.strengths.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-foreground">
                        <Icons.Check className="h-3 w-3 text-green-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs font-semibold text-red-400 mb-2">Weaknesses</p>
                  <ul className="space-y-1">
                    {info.weaknesses.map((w) => (
                      <li key={w} className="flex items-center gap-2 text-sm text-foreground">
                        <Icons.X className="h-3 w-3 text-red-400 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Units */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Units</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classUnits.map((unit) => (
                    <div key={unit.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md border", CLASS_BADGE[cls])}>
                          <ClassIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{unit.name}</p>
                          {unit.unlockCost === 0 ? (
                            <span className="text-xs text-green-400">Starter Unit</span>
                          ) : (
                            <span className="text-xs text-yellow-400">{unit.unlockCost}g to unlock</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">{unit.description}</p>

                      {/* Stat Bars */}
                      <div className="space-y-1.5">
                        <StatBar label="HP" value={unit.maxHp} max={100} color="bg-red-400" />
                        <StatBar label="ATK" value={unit.attack} max={20} color="bg-orange-400" />
                        <StatBar label="DEF" value={unit.defense} max={8} color="bg-blue-400" />
                        <StatBar label="SPD" value={unit.speed} max={7} color="bg-green-400" />
                        <StatBar label="RNG" value={unit.attackRange} max={5} color="bg-purple-400" />
                        <StatBar label="CRIT" value={unit.critChance * 100} max={20} color="bg-yellow-400" suffix="%" />
                      </div>

                      {/* Abilities */}
                      {unit.abilities.length > 0 && (
                        <div className="mt-3 border-t border-border pt-2 space-y-1.5">
                          {unit.abilities.map((ability) => (
                            <div key={ability.id} className="text-xs">
                              <span className={cn("font-semibold", CLASS_ACCENT[cls])}>{ability.name}</span>
                              <span className="text-muted-foreground"> &middot; CD: {(ability.cooldownTicks / 4).toFixed(0)}s</span>
                              {ability.range > 0 && <span className="text-muted-foreground"> &middot; Range: {ability.range}</span>}
                              <p className="text-muted-foreground mt-0.5">{ability.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        );
      })}
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
