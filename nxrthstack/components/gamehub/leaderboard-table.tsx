"use client";

import { Icons } from "@/components/icons";
import type { LeaderboardEntry } from "@/lib/gamehub/leaderboards";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  categoryLabel: string;
  userRank: number | null;
  userScore: number | null;
}

export function LeaderboardTable({
  entries,
  categoryLabel,
  userRank,
  userScore,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Icons.Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No entries yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to claim the top spot!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's Position Card */}
      {userRank && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                #{userRank}
              </div>
              <div>
                <p className="font-medium text-foreground">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  {userScore?.toLocaleString()} {categoryLabel.toLowerCase()}
                </p>
              </div>
            </div>
            {userRank <= 10 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Icons.Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Top 10!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Player
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-24">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.userId}
                className={`border-t border-border transition-colors ${
                  entry.isCurrentUser
                    ? "bg-primary/10"
                    : "hover:bg-muted/30"
                }`}
              >
                <td className="py-3 px-4">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {entry.userAvatar ? (
                      <img
                        src={entry.userAvatar}
                        alt={entry.userName || "User"}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {(entry.userName || entry.userEmail)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {entry.userName || entry.userEmail}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-foreground">
                    {entry.score.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
