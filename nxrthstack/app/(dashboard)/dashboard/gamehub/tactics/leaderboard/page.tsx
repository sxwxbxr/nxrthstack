"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "pvp" | "campaign" | "warfare";

const TABS: { id: Tab; label: string; icon: React.ReactNode; valueLabel: string }[] = [
  { id: "pvp", label: "PvP", icon: <Icons.Swords className="h-4 w-4" />, valueLabel: "Rating" },
  { id: "campaign", label: "Campaign", icon: <Icons.Map className="h-4 w-4" />, valueLabel: "Level" },
  { id: "warfare", label: "Warfare", icon: <Icons.Shield className="h-4 w-4" />, valueLabel: "Rating" },
];

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  name: string;
  value: number;
  wins: number;
  losses: number;
  campaignLevel: number;
  winRate: number;
}

export default function TacticsLeaderboardPage() {
  const [tab, setTab] = useState<Tab>("pvp");
  const { data, isLoading } = useSWR(
    `/api/gamehub/tactics/leaderboard?tab=${tab}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const leaderboard: LeaderboardPlayer[] = data?.leaderboard ?? [];
  const myRank: number | null = data?.myRank ?? null;
  const myValue: number = data?.myValue ?? (tab === "campaign" ? 0 : 1000);
  const currentTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tactics-heading">
            <GradientText>Leaderboard</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Top 50 players. Click a name to view their profile.
          </p>
        </div>
      </FadeIn>

      {/* Tab switcher */}
      <FadeIn delay={0.05}>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-sm border-2 border-border w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-sm transition-colors",
                tab === t.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="leaderboard-tab"
                  className="absolute inset-0 bg-primary/10 border-2 border-primary/30 rounded-sm"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Your rank card */}
      <FadeIn delay={0.1}>
        <div className="rounded-sm border-2 border-primary/30 bg-primary/5 p-4 tactics-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                {myRank ? `#${myRank}` : "--"}
              </div>
              <div>
                <p className="font-medium text-foreground">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  {tab === "campaign"
                    ? `Level ${myValue}`
                    : `${myValue.toLocaleString()} rating`}
                </p>
              </div>
            </div>
            {myRank && myRank <= 10 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Icons.Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Top 10!</span>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Leaderboard table */}
      <FadeIn delay={0.2}>
        {isLoading ? (
          <div className="text-center py-12">
            <Icons.Loader className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Icons.Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to claim the top spot!
            </p>
          </div>
        ) : (
          <div className="rounded-sm border-2 border-border overflow-x-auto tactics-card">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16 tactics-label">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground tactics-label">
                    Player
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-24 tactics-label">
                    {currentTab.valueLabel}
                  </th>
                  {tab !== "campaign" && (
                    <>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-20 hidden md:table-cell tactics-label">
                        Wins
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-20 hidden md:table-cell tactics-label">
                        Losses
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-24 tactics-label">
                        Win Rate
                      </th>
                    </>
                  )}
                  {tab === "campaign" && (
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-24 hidden md:table-cell tactics-label">
                      PvP Win Rate
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => {
                  const isMe = player.rank === myRank;
                  return (
                    <tr
                      key={player.userId}
                      className={cn(
                        "border-t border-border transition-colors",
                        isMe ? "bg-primary/10" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="py-3 px-4">
                        <RankBadge rank={player.rank} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {player.name[0]?.toUpperCase() ?? "?"}
                          </div>
                          <Link
                            href={`/dashboard/gamehub/tactics/profile/${player.userId}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {player.name}
                            {isMe && (
                              <span className="ml-2 text-xs text-primary">(You)</span>
                            )}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-foreground">
                          {tab === "campaign"
                            ? `Lv.${player.value}`
                            : player.value.toLocaleString()}
                        </span>
                      </td>
                      {tab !== "campaign" && (
                        <>
                          <td className="py-3 px-4 text-right hidden md:table-cell">
                            <span className="text-green-400">{player.wins}</span>
                          </td>
                          <td className="py-3 px-4 text-right hidden md:table-cell">
                            <span className="text-red-400">{player.losses}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-muted-foreground">{player.winRate}%</span>
                          </td>
                        </>
                      )}
                      {tab === "campaign" && (
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="text-muted-foreground">{player.winRate}%</span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FadeIn>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
        <Icons.Crown className="h-4 w-4 text-yellow-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300/20">
        <Icons.Award className="h-4 w-4 text-gray-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
        <Icons.Award className="h-4 w-4 text-orange-500" />
      </div>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center text-sm font-medium text-muted-foreground">
      #{rank}
    </span>
  );
}
