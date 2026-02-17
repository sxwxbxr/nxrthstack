"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { QUEST_POOL } from "@/lib/gamehub/tactics/quests";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const QUEST_ICONS: Record<string, typeof Icons.Swords> = {
  win_battles: Icons.Trophy,
  play_battles: Icons.Swords,
  enchant_item: Icons.Wand,
  buy_equipment: Icons.ShoppingBag,
  reroll_item: Icons.Dices,
  spin_wheel: Icons.Dices,
  equip_item: Icons.Shield,
  level_up_unit: Icons.Star,
};

const QUEST_LABELS: Record<string, string> = Object.fromEntries(
  QUEST_POOL.map((q) => [q.type, q.label])
);

interface Quest {
  id: string;
  questType: string;
  progress: number;
  target: number;
  reward: number;
  completedAt: string | null;
  createdAt: string;
}

export default function QuestsPage() {
  const { data, mutate } = useSWR("/api/gamehub/tactics/quests", fetcher);
  const [claiming, setClaiming] = useState<string | null>(null);

  const quests: Quest[] = data?.quests ?? [];

  async function claimQuest(questId: string) {
    setClaiming(questId);
    try {
      const res = await fetch("/api/gamehub/tactics/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok) {
        mutate();
      }
    } finally {
      setClaiming(null);
    }
  }

  // Calculate reset time (next UTC midnight)
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  nextReset.setUTCHours(0, 0, 0, 0);
  const hoursUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold tactics-heading">
          <GradientText>Daily Quests</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Complete quests to earn bonus currency. Resets in ~{hoursUntilReset}h.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="space-y-4">
          {quests.length === 0 && (
            <div className="rounded-sm border-2 border-border bg-card p-8 text-center tactics-card">
              <Icons.Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading quests...</p>
            </div>
          )}
          {quests.map((quest) => {
            const Icon = QUEST_ICONS[quest.questType] ?? Icons.Star;
            const label = QUEST_LABELS[quest.questType] ?? quest.questType;
            const isComplete = quest.progress >= quest.target;
            const isClaimed = !!quest.completedAt;
            const pct = Math.min(100, (quest.progress / quest.target) * 100);

            return (
              <div
                key={quest.id}
                className={cn(
                  "rounded-sm border-2 p-4 transition-all tactics-card",
                  isClaimed
                    ? "border-green-500/30 bg-green-500/5"
                    : isComplete
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border",
                    isClaimed ? "border-green-500/30 bg-green-500/10" : "border-border bg-background"
                  )}>
                    <Icon className={cn("h-5 w-5", isClaimed ? "text-green-400" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{label}</p>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                        <Icons.Coins className="h-4 w-4" />
                        {quest.reward}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isClaimed ? "bg-green-400" : isComplete ? "bg-yellow-400" : "bg-primary"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>
                  </div>
                  {isComplete && !isClaimed && (
                    <button
                      onClick={() => claimQuest(quest.id)}
                      disabled={claiming === quest.id}
                      className="shrink-0 rounded-sm bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 tactics-stat-label"
                    >
                      {claiming === quest.id ? "..." : "Claim"}
                    </button>
                  )}
                  {isClaimed && (
                    <span className="shrink-0 text-xs font-bold text-green-400 uppercase">Claimed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FadeIn>
    </div>
  );
}
