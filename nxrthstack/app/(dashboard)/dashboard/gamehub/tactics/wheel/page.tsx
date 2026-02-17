"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { DungeonButton } from "@/components/gamehub/tactics/dungeon-button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RARITY_LABELS, RARITY_COLORS, RARITY_BORDERS, RARITY_BG_COLORS, RARITY_GLOW, type Rarity } from "@/lib/gamehub/tactics/rarities";
import { UNIT_LIST } from "@/lib/gamehub/tactics/units";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SpinResult {
  templateId: string;
  unitName: string;
  rarity: Rarity;
  isDuplicate: boolean;
  compensation: number;
}

export default function WheelPage() {
  const { data: playerData, mutate: mutatePlayer } = useSWR("/api/gamehub/tactics/player", fetcher);
  const { data: wheelData, mutate: mutateWheel } = useSWR("/api/gamehub/tactics/wheel", fetcher);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cycleText, setCycleText] = useState("");
  const cycleRef = useRef<NodeJS.Timeout | null>(null);

  const currency = playerData?.player?.currency ?? 0;
  const cost = wheelData?.cost ?? 500;
  const spinCount = wheelData?.spinCount ?? 0;
  const recentSpins = wheelData?.recentSpins ?? [];
  const collection = wheelData?.collection ?? [];
  const canSpin = currency >= cost;

  async function handleSpin() {
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Start cycling animation
    let cycleIdx = 0;
    cycleRef.current = setInterval(() => {
      const unit = UNIT_LIST[cycleIdx % UNIT_LIST.length];
      const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret"];
      const rar = rarities[Math.floor(Math.random() * rarities.length)];
      setCycleText(`${RARITY_LABELS[rar]} ${unit.name}`);
      cycleIdx++;
    }, 80);

    try {
      const res = await fetch("/api/gamehub/tactics/wheel", {
        method: "POST",
      });
      const data = await res.json();

      // Let animation run for 2 seconds
      await new Promise((r) => setTimeout(r, 2000));

      if (cycleRef.current) clearInterval(cycleRef.current);
      setCycleText("");

      if (res.ok) {
        setResult(data.result);
        setShowResult(true);
        mutatePlayer();
        mutateWheel();
      }
    } finally {
      setSpinning(false);
      if (cycleRef.current) clearInterval(cycleRef.current);
    }
  }

  useEffect(() => {
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, []);

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tactics-heading">
              <GradientText>Lucky Wheel</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Spin for a chance to get units at higher rarities. Cost increases with each spin.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm border-2 border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
            <Icons.DollarSign className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-yellow-400 tactics-stat-label">{currency.toLocaleString()}</span>
          </div>
        </div>
      </FadeIn>

      {/* Main Wheel Area */}
      <FadeIn delay={0.1}>
        <div className="rounded-sm border-2 border-border bg-card p-8 text-center space-y-6 tactics-card">
          {/* Spinning/Result Display */}
          <div className="min-h-[120px] flex items-center justify-center">
            {spinning && cycleText && (
              <motion.div
                key={cycleText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-muted-foreground"
              >
                {cycleText}
              </motion.div>
            )}

            <AnimatePresence>
              {showResult && result && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className={cn(
                    "inline-block rounded-sm border-2 px-8 py-4",
                    RARITY_BORDERS[result.rarity],
                    RARITY_BG_COLORS[result.rarity],
                    RARITY_GLOW[result.rarity]
                  )}>
                    <p className={cn("text-sm font-medium", RARITY_COLORS[result.rarity])}>
                      {RARITY_LABELS[result.rarity]}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">{result.unitName}</p>
                  </div>
                  {result.isDuplicate ? (
                    <p className="text-sm text-yellow-400">
                      Duplicate! +{result.compensation}g compensation
                    </p>
                  ) : (
                    <p className="text-sm text-green-400">
                      New unit added to your collection!
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!spinning && !showResult && (
              <div className="space-y-2">
                <Icons.Dices className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Press SPIN to try your luck!</p>
              </div>
            )}
          </div>

          {/* Spin Button */}
          <div>
            <DungeonButton
              onClick={handleSpin}
              disabled={!canSpin || spinning}
              size="lg"
            >
              {spinning ? (
                <>
                  <Icons.Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Icons.Dices className="h-5 w-5 mr-2" />
                  SPIN — {cost.toLocaleString()}g
                </>
              )}
            </DungeonButton>
            {!canSpin && !spinning && (
              <p className="text-sm text-red-400 mt-2">Not enough currency</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Spin #{spinCount + 1} &middot; Duplicates give 50% currency back
            </p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Progress */}
        <FadeIn delay={0.2}>
          <div className="rounded-sm border-2 border-border bg-card p-5 tactics-card">
            <p className="text-sm font-semibold text-muted-foreground mb-3 tactics-label">
              Collection ({collection.length} units)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {UNIT_LIST.map((unit) => {
                const owned = collection.filter(
                  (c: { templateId: string; rarity: string }) => c.templateId === unit.id
                );
                const hasAny = owned.length > 0;
                const highestRarity = hasAny
                  ? owned.reduce((best: string, c: { rarity: string }) => {
                      const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret"];
                      return rarities.indexOf(c.rarity as Rarity) > rarities.indexOf(best as Rarity) ? c.rarity : best;
                    }, owned[0].rarity)
                  : null;

                return (
                  <div
                    key={unit.id}
                    className={cn(
                      "rounded-lg border p-2 text-center text-xs transition-all",
                      hasAny
                        ? cn(RARITY_BORDERS[highestRarity as Rarity], RARITY_BG_COLORS[highestRarity as Rarity])
                        : "border-border bg-background opacity-40"
                    )}
                  >
                    <p className="font-medium text-foreground">{unit.name}</p>
                    <p className="text-muted-foreground">{unit.class}</p>
                    {hasAny && (
                      <p className={cn("mt-0.5", RARITY_COLORS[highestRarity as Rarity])}>
                        {RARITY_LABELS[highestRarity as Rarity]}
                      </p>
                    )}
                    {hasAny && owned.length > 1 && (
                      <p className="text-muted-foreground">{owned.length} variants</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Recent Spins */}
        <FadeIn delay={0.25}>
          <div className="rounded-sm border-2 border-border bg-card p-5 tactics-card">
            <p className="text-sm font-semibold text-muted-foreground mb-3 tactics-label">
              Recent Spins
            </p>
            {recentSpins.length === 0 ? (
              <p className="text-xs text-muted-foreground">No spins yet</p>
            ) : (
              <div className="space-y-1.5">
                {recentSpins.map((spin: { id: string; unitName: string; rarity: string; compensation: number; costPaid: number }) => (
                  <div key={spin.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", RARITY_COLORS[spin.rarity as Rarity])}>
                        {RARITY_LABELS[spin.rarity as Rarity]}
                      </span>
                      <span className="text-foreground">{spin.unitName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      -{spin.costPaid}g
                      {spin.compensation > 0 && (
                        <span className="text-yellow-400 ml-1">+{spin.compensation}g</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
