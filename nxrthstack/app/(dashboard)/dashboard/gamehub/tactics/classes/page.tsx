import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { UNIT_LIST } from "@/lib/gamehub/tactics/units";
import { CLASS_DESCRIPTIONS, type UnitClass } from "@/lib/gamehub/tactics/types";
import { cn } from "@/lib/utils";
import { UnitSpriteCard } from "./unit-sprite-card";

const CLASS_ORDER: UnitClass[] = ["Tank", "Ranger", "Healer", "Assassin", "Mage", "Paladin", "Berserker"];

const CLASS_COLORS: Record<string, string> = {
  Tank: "border-blue-500/30 bg-blue-500/5",
  Ranger: "border-green-500/30 bg-green-500/5",
  Healer: "border-yellow-500/30 bg-yellow-500/5",
  Assassin: "border-purple-500/30 bg-purple-500/5",
  Mage: "border-indigo-500/30 bg-indigo-500/5",
  Paladin: "border-amber-500/30 bg-amber-500/5",
  Berserker: "border-red-500/30 bg-red-500/5",
};

const CLASS_ACCENT: Record<string, string> = {
  Tank: "text-blue-400",
  Ranger: "text-green-400",
  Healer: "text-yellow-400",
  Assassin: "text-purple-400",
  Mage: "text-indigo-400",
  Paladin: "text-amber-400",
  Berserker: "text-red-400",
};

const CLASS_BADGE: Record<string, string> = {
  Tank: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ranger: "bg-green-500/20 text-green-400 border-green-500/30",
  Healer: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Assassin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Mage: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Paladin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Berserker: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CLASS_ICONS: Record<string, typeof Icons.Shield> = {
  Tank: Icons.Shield,
  Ranger: Icons.Target,
  Healer: Icons.Heart,
  Assassin: Icons.Swords,
  Mage: Icons.Wand,
  Paladin: Icons.Star,
  Berserker: Icons.Sparkles,
};

export default function ClassesPage() {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tactics-heading">
            <GradientText>Classes & Units</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Learn about the seven unit classes, their strengths, weaknesses, and individual units.
          </p>
        </div>
      </FadeIn>

      {CLASS_ORDER.map((cls, i) => {
        const info = CLASS_DESCRIPTIONS[cls];
        const ClassIcon = CLASS_ICONS[cls];
        const classUnits = UNIT_LIST.filter((u) => u.class === cls);

        return (
          <FadeIn key={cls} delay={0.1 * (i + 1)}>
            <div className={cn("rounded-sm border-2 p-6 space-y-5 tactics-card", CLASS_COLORS[cls])}>
              {/* Class Header */}
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2", CLASS_BADGE[cls])}>
                  <ClassIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tactics-heading">{cls}</h2>
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
                <p className="text-xs font-semibold text-muted-foreground mb-3 tactics-label">Units</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classUnits.map((unit) => (
                    <UnitSpriteCard
                      key={unit.id}
                      unit={unit}
                      cls={cls}
                      classBadge={CLASS_BADGE[cls]}
                      classAccent={CLASS_ACCENT[cls]}
                    />
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
