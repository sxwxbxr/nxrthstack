"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function TacticsLeaderboardPage() {
  const { data, isLoading } = useSWR("/api/gamehub/tactics/leaderboard", fetcher, {
    refreshInterval: 30000,
  });

  const leaderboard: LeaderboardPlayer[] = data?.leaderboard ?? [];
  const myRank: number | null = data?.myRank ?? null;
  const myRating: number = data?.myRating ?? 1000;

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold">
            <GradientText>Leaderboard</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Top 50 players ranked by rating. Climb the ladder!
          </p>
        </div>
      </FadeIn>

      {/* Your rank card */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                {myRank ? `#${myRank}` : "—"}
              </div>
              <div>
                <p className="font-medium text-foreground">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  {myRating.toLocaleString()} rating
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
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Player
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-20">
                    Rating
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-20 hidden md:table-cell">
                    Wins
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-20 hidden md:table-cell">
                    Losses
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-24">
                    Win Rate
                  </th>
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
                          <p className="font-medium text-foreground">
                            {player.name}
                            {isMe && (
                              <span className="ml-2 text-xs text-primary">(You)</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-foreground">
                          {player.rating.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="text-green-400">{player.wins}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="text-red-400">{player.losses}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-muted-foreground">{player.winRate}%</span>
                      </td>
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
