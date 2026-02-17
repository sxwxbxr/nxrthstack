"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ICON_MAP: Record<string, typeof Icons.Star> = {
  Swords: Icons.Swords,
  Package: Icons.Package,
  Users: Icons.Users,
  Wand: Icons.Wand,
  Dices: Icons.Dices,
  Star: Icons.Star,
  Trophy: Icons.Trophy,
  Crown: Icons.Crown,
  Flame: Icons.Flame,
  Shield: Icons.Shield,
  Coins: Icons.Coins,
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
  icon: string;
  unlocked: boolean;
  claimed: boolean;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const { data, mutate } = useSWR("/api/gamehub/tactics/achievements", fetcher);
  const [claiming, setClaiming] = useState<string | null>(null);

  const achievements: Achievement[] = data?.achievements ?? [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const claimedCount = achievements.filter((a) => a.claimed).length;

  async function claimAchievement(achievementId: string) {
    setClaiming(achievementId);
    try {
      const res = await fetch("/api/gamehub/tactics/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      });
      if (res.ok) {
        mutate();
      }
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold tactics-heading">
          <GradientText>Achievements</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          {unlockedCount}/{achievements.length} unlocked &middot; {claimedCount} claimed
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = ICON_MAP[ach.icon] ?? Icons.Star;
            const canClaim = ach.unlocked && !ach.claimed;

            return (
              <div
                key={ach.id}
                className={cn(
                  "rounded-sm border-2 p-4 transition-all tactics-card",
                  ach.claimed
                    ? "border-green-500/30 bg-green-500/5"
                    : ach.unlocked
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border bg-card opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                    ach.claimed
                      ? "border-green-500/30 bg-green-500/10"
                      : ach.unlocked
                      ? "border-yellow-500/30 bg-yellow-500/10"
                      : "border-border bg-background"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      ach.claimed ? "text-green-400" : ach.unlocked ? "text-yellow-400" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{ach.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                        <Icons.Coins className="h-3 w-3" />
                        {ach.reward}
                      </div>
                      {ach.claimed && (
                        <span className="text-xs font-bold text-green-400">Claimed</span>
                      )}
                    </div>
                  </div>
                </div>
                {canClaim && (
                  <button
                    onClick={() => claimAchievement(ach.id)}
                    disabled={claiming === ach.id}
                    className="mt-3 w-full rounded-sm bg-yellow-500 px-3 py-1.5 text-sm font-bold text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 tactics-stat-label"
                  >
                    {claiming === ach.id ? "Claiming..." : "Claim Reward"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </FadeIn>
    </div>
  );
}
