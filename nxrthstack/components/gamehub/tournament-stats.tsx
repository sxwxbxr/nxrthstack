"use client";

import { Icons } from "@/components/icons";

interface Participant {
  id: string;
  userId: string;
  totalKills: number;
  totalDeaths: number;
  totalRoundsWon: number;
  totalRoundsLost: number;
  matchesWon: number;
  matchesLost: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Match {
  id: string;
  status: string;
  games: {
    id: string;
    player1Kills: number | null;
    player1Deaths: number | null;
    player2Kills: number | null;
    player2Deaths: number | null;
  }[];
}

interface TournamentStatsProps {
  participants: Participant[];
  matches: Match[];
}

export function TournamentStats({ participants, matches }: TournamentStatsProps) {
  // Calculate total stats
  const totalGames = matches.reduce((sum, m) => sum + m.games.length, 0);
  const completedMatches = matches.filter((m) => m.status === "completed").length;

  // Calculate kill leaderboard
  const killLeaderboard = [...participants]
    .filter((p) => p.totalKills > 0)
    .sort((a, b) => b.totalKills - a.totalKills)
    .slice(0, 5);

  // Calculate K/D leaderboard
  const kdLeaderboard = [...participants]
    .filter((p) => p.totalKills > 0 || p.totalDeaths > 0)
    .map((p) => ({
      ...p,
      kd: p.totalDeaths === 0 ? p.totalKills : p.totalKills / p.totalDeaths,
    }))
    .sort((a, b) => b.kd - a.kd)
    .slice(0, 5);

  // Calculate rounds won leaderboard
  const roundsLeaderboard = [...participants]
    .filter((p) => p.totalRoundsWon > 0)
    .sort((a, b) => b.totalRoundsWon - a.totalRoundsWon)
    .slice(0, 5);

  // Calculate total kills/deaths in tournament
  const totalKills = participants.reduce((sum, p) => sum + p.totalKills, 0);
  const totalDeaths = participants.reduce((sum, p) => sum + p.totalDeaths, 0);
  const totalRounds = participants.reduce((sum, p) => sum + p.totalRoundsWon, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Tournament Statistics
      </h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{completedMatches}</p>
          <p className="text-sm text-muted-foreground">Matches Played</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{totalGames}</p>
          <p className="text-sm text-muted-foreground">Games Played</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{totalKills}</p>
          <p className="text-sm text-muted-foreground">Total Kills</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{totalRounds}</p>
          <p className="text-sm text-muted-foreground">Rounds Played</p>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kill Leaders */}
        {killLeaderboard.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Icons.Swords className="h-4 w-4 text-red-500" />
              Most Kills
            </h3>
            <div className="space-y-2">
              {killLeaderboard.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        index === 0
                          ? "text-yellow-500"
                          : index === 1
                            ? "text-slate-400"
                            : index === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {p.user.name || p.user.email}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {p.totalKills}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* K/D Leaders */}
        {kdLeaderboard.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Icons.TrendingUp className="h-4 w-4 text-green-500" />
              Best K/D Ratio
            </h3>
            <div className="space-y-2">
              {kdLeaderboard.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        index === 0
                          ? "text-yellow-500"
                          : index === 1
                            ? "text-slate-400"
                            : index === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {p.user.name || p.user.email}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-500">
                    {p.kd.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rounds Won Leaders */}
        {roundsLeaderboard.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Icons.Star className="h-4 w-4 text-primary" />
              Most Rounds Won
            </h3>
            <div className="space-y-2">
              {roundsLeaderboard.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        index === 0
                          ? "text-yellow-500"
                          : index === 1
                            ? "text-slate-400"
                            : index === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {p.user.name || p.user.email}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {p.totalRoundsWon}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
