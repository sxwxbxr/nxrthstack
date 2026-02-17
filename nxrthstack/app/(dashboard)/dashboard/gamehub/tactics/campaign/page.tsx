"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/gamehub/tactics/rarities";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EnemyUnit {
  templateId: string;
  name: string;
  rarity: Rarity;
  level: number;
}

interface CampaignData {
  currentLevel: number;
  nextLevel: number;
  difficulty: { label: string; color: string };
  enemyPreview: EnemyUnit[];
  rewardPreview: { win1Star: number; win2Star: number; win3Star: number; loss: number };
  bestStars: Record<number, number>;
}

interface BattleResult {
  level: number;
  won: boolean;
  stars: number;
  currencyEarned: number;
  difficulty: { label: string; color: string };
  durationSeconds: number;
  stats: {
    attackerDamageDealt: number;
    defenderDamageDealt: number;
    attackerUnitsLost: number;
    defenderUnitsLost: number;
    attackerHealingDone: number;
    defenderHealingDone: number;
    totalTicks: number;
  };
  enemySquad: EnemyUnit[];
  newCampaignLevel: number;
}

export default function CampaignPage() {
  const { data, isLoading, mutate } = useSWR<CampaignData>(
    "/api/gamehub/tactics/campaign",
    fetcher
  );
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);

  async function handleFight() {
    setFighting(true);
    setResult(null);
    try {
      const res = await fetch("/api/gamehub/tactics/campaign", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setResult(json);
        mutate();
      } else {
        alert(json.error || "Battle failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setFighting(false);
    }
  }

  const campaign = data;

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tactics-heading">
            <GradientText>Campaign</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fight through progressively harder PvE levels. Earn currency and stars!
          </p>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="text-center py-12">
          <Icons.Loader className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading campaign...</p>
        </div>
      ) : campaign ? (
        <>
          {/* Progress overview */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-sm border-2 border-border p-4 tactics-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Icons.Map className="h-4 w-4" />
                  Current Level
                </div>
                <p className="text-2xl font-bold text-foreground">{campaign.currentLevel}</p>
              </div>
              <div className="rounded-sm border-2 border-border p-4 tactics-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Icons.Target className="h-4 w-4" />
                  Next Challenge
                </div>
                <p className="text-2xl font-bold text-foreground">
                  Level {campaign.nextLevel}
                </p>
                <p className={cn("text-sm font-medium", campaign.difficulty.color)}>
                  {campaign.difficulty.label}
                </p>
              </div>
              <div className="rounded-sm border-2 border-border p-4 tactics-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Icons.Star className="h-4 w-4" />
                  Total Stars
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(campaign.bestStars).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Enemy preview */}
          <FadeIn delay={0.15}>
            <div className="rounded-sm border-2 border-border p-6 tactics-card">
              <h2 className="text-lg font-semibold mb-4 tactics-heading">
                Level {campaign.nextLevel} Enemy Squad
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {campaign.enemyPreview.map((unit, i) => (
                  <div
                    key={i}
                    className="rounded-sm border-2 border-border p-3 text-center tactics-card"
                  >
                    <Icons.Swords className={cn("h-6 w-6 mx-auto mb-1", RARITY_COLORS[unit.rarity])} />
                    <p className="text-sm font-medium text-foreground">{unit.name}</p>
                    <p className={cn("text-xs", RARITY_COLORS[unit.rarity])}>
                      {RARITY_LABELS[unit.rarity]} Lv.{unit.level}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Rewards preview */}
          <FadeIn delay={0.2}>
            <div className="rounded-sm border-2 border-border p-6 tactics-card">
              <h2 className="text-lg font-semibold mb-4 tactics-heading">Rewards</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center p-3 rounded-sm bg-muted/30">
                  <div className="flex justify-center gap-0.5 mb-1">
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="font-semibold text-foreground">{campaign.rewardPreview.win1Star}g</p>
                  <p className="text-xs text-muted-foreground">1 Star</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30">
                  <div className="flex justify-center gap-0.5 mb-1">
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="font-semibold text-foreground">{campaign.rewardPreview.win2Star}g</p>
                  <p className="text-xs text-muted-foreground">2 Stars</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30">
                  <div className="flex justify-center gap-0.5 mb-1">
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                    <Icons.Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="font-semibold text-foreground">{campaign.rewardPreview.win3Star}g</p>
                  <p className="text-xs text-muted-foreground">3 Stars</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30">
                  <div className="flex justify-center gap-0.5 mb-1">
                    <Icons.XCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="font-semibold text-foreground">{campaign.rewardPreview.loss}g</p>
                  <p className="text-xs text-muted-foreground">Defeat</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Fight button */}
          <FadeIn delay={0.25}>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFight}
                disabled={fighting}
                className={cn(
                  "px-8 py-3 rounded-sm border-2 font-bold text-lg transition-all",
                  fighting
                    ? "border-muted bg-muted/20 text-muted-foreground cursor-not-allowed"
                    : "border-primary bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_12px_2px_var(--tactics-glow-gold)]"
                )}
              >
                {fighting ? (
                  <span className="flex items-center gap-2">
                    <Icons.Loader className="h-5 w-5 animate-spin" />
                    Fighting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Swords className="h-5 w-5" />
                    Fight Level {campaign.nextLevel}!
                  </span>
                )}
              </motion.button>
            </div>
          </FadeIn>

          {/* Battle result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BattleResultCard result={result} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Star history */}
          {Object.keys(campaign.bestStars).length > 0 && (
            <FadeIn delay={0.3}>
              <div className="rounded-sm border-2 border-border p-6 tactics-card">
                <h2 className="text-lg font-semibold mb-4 tactics-heading">Progress</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: campaign.currentLevel }, (_, i) => i + 1).map((level) => {
                    const stars = campaign.bestStars[level] ?? 0;
                    return (
                      <div
                        key={level}
                        className={cn(
                          "w-10 h-10 rounded-sm border-2 flex flex-col items-center justify-center text-xs",
                          stars === 3
                            ? "border-yellow-500/50 bg-yellow-500/10"
                            : stars >= 1
                              ? "border-border bg-muted/30"
                              : "border-border/50 bg-muted/10"
                        )}
                      >
                        <span className="font-medium">{level}</span>
                        <div className="flex gap-px">
                          {[1, 2, 3].map((s) => (
                            <span
                              key={s}
                              className={cn(
                                "text-[6px]",
                                s <= stars ? "text-yellow-500" : "text-muted-foreground/30"
                              )}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Icons.AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
          <p className="text-muted-foreground">Failed to load campaign data.</p>
          <Link
            href="/dashboard/gamehub/tactics"
            className="text-primary text-sm hover:underline mt-2 inline-block"
          >
            Return to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

function BattleResultCard({ result }: { result: BattleResult }) {
  return (
    <div
      className={cn(
        "rounded-sm border-2 p-6 tactics-card",
        result.won
          ? "border-green-500/40 bg-green-500/5"
          : "border-red-500/40 bg-red-500/5"
      )}
    >
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">
          {result.won ? (
            <span className="text-green-400">Victory!</span>
          ) : (
            <span className="text-red-400">Defeat</span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          Level {result.level} - {result.durationSeconds}s
        </p>
      </div>

      {result.won && (
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3].map((s) => (
            <Icons.Star
              key={s}
              className={cn(
                "h-8 w-8",
                s <= result.stars ? "text-yellow-500" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center mb-4">
        <div>
          <p className="text-muted-foreground">Currency</p>
          <p className="font-semibold text-yellow-400">+{result.currencyEarned}g</p>
        </div>
        <div>
          <p className="text-muted-foreground">Damage Dealt</p>
          <p className="font-semibold text-foreground">{result.stats.attackerDamageDealt}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Units Lost</p>
          <p className="font-semibold text-foreground">{result.stats.attackerUnitsLost}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Healing Done</p>
          <p className="font-semibold text-foreground">{result.stats.attackerHealingDone}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Enemy units defeated: {result.stats.defenderUnitsLost}
        </p>
      </div>
    </div>
  );
}
