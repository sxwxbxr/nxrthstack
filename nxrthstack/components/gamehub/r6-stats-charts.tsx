"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

// Bright colors for dark backgrounds
const CHART_COLORS = {
  player1: "#22d3ee", // cyan-400 - bright teal
  player2: "#f97316", // orange-500 - bright orange
  player1Light: "#22d3ee33", // cyan with 20% opacity
  player2Light: "#f9731633", // orange with 20% opacity
};

interface Match {
  id: string;
  winnerId: string | null;
  player1Kills: number | null;
  player1Deaths: number | null;
  player2Kills: number | null;
  player2Deaths: number | null;
  player1RoundsWon: number | null;
  player2RoundsWon: number | null;
  createdAt: Date;
}

interface R6StatsChartsProps {
  matches: Match[];
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  trackKills: boolean;
}

export function R6StatsCharts({
  matches,
  player1Id,
  player2Id,
  player1Name,
  player2Name,
  trackKills,
}: R6StatsChartsProps) {
  // Calculate cumulative win data over time
  const winTrendData = useMemo(() => {
    let p1Wins = 0;
    let p2Wins = 0;

    return matches
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((match, index) => {
        if (match.winnerId === player1Id) p1Wins++;
        else if (match.winnerId === player2Id) p2Wins++;

        return {
          match: index + 1,
          [player1Name]: p1Wins,
          [player2Name]: p2Wins,
          date: new Date(match.createdAt).toLocaleDateString(),
        };
      });
  }, [matches, player1Id, player2Id, player1Name, player2Name]);

  // Calculate K/D data per match
  const kdData = useMemo(() => {
    if (!trackKills) return [];

    return matches
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((match, index) => {
        const p1KD = match.player1Deaths && match.player1Deaths > 0
          ? (match.player1Kills || 0) / match.player1Deaths
          : match.player1Kills || 0;
        const p2KD = match.player2Deaths && match.player2Deaths > 0
          ? (match.player2Kills || 0) / match.player2Deaths
          : match.player2Kills || 0;

        return {
          match: index + 1,
          [player1Name]: parseFloat(p1KD.toFixed(2)),
          [player2Name]: parseFloat(p2KD.toFixed(2)),
        };
      });
  }, [matches, trackKills, player1Name, player2Name]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    let p1Wins = 0;
    let p2Wins = 0;
    let p1Kills = 0;
    let p1Deaths = 0;
    let p2Kills = 0;
    let p2Deaths = 0;
    let p1Rounds = 0;
    let p2Rounds = 0;

    matches.forEach((match) => {
      if (match.winnerId === player1Id) p1Wins++;
      else if (match.winnerId === player2Id) p2Wins++;

      p1Kills += match.player1Kills || 0;
      p1Deaths += match.player1Deaths || 0;
      p2Kills += match.player2Kills || 0;
      p2Deaths += match.player2Deaths || 0;
      p1Rounds += match.player1RoundsWon || 0;
      p2Rounds += match.player2RoundsWon || 0;
    });

    return {
      p1Wins,
      p2Wins,
      p1Kills,
      p1Deaths,
      p2Kills,
      p2Deaths,
      p1Rounds,
      p2Rounds,
      p1KD: p1Deaths > 0 ? (p1Kills / p1Deaths).toFixed(2) : p1Kills.toString(),
      p2KD: p2Deaths > 0 ? (p2Kills / p2Deaths).toFixed(2) : p2Kills.toString(),
    };
  }, [matches, player1Id, player2Id]);

  // Pie chart data for win distribution
  const winDistribution = useMemo(() => {
    return [
      { name: player1Name, value: totalStats.p1Wins, color: CHART_COLORS.player1 },
      { name: player2Name, value: totalStats.p2Wins, color: CHART_COLORS.player2 },
    ];
  }, [player1Name, player2Name, totalStats]);

  // Round distribution data
  const roundData = useMemo(() => {
    return [
      { name: player1Name, rounds: totalStats.p1Rounds },
      { name: player2Name, rounds: totalStats.p2Rounds },
    ];
  }, [player1Name, player2Name, totalStats]);

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icons.TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No matches recorded yet. Play some matches to see stats!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Matches</p>
          <p className="text-3xl font-bold text-foreground mt-1">{matches.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Rounds</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {totalStats.p1Rounds + totalStats.p2Rounds}
          </p>
        </motion.div>

        {trackKills && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{player1Name} K/D</p>
              <p className="text-3xl font-bold mt-1" style={{ color: CHART_COLORS.player1 }}>{totalStats.p1KD}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{player2Name} K/D</p>
              <p className="text-3xl font-bold mt-1" style={{ color: CHART_COLORS.player2 }}>{totalStats.p2KD}</p>
            </motion.div>
          </>
        )}
      </div>

      {/* Win Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.TrendingUp className="w-5 h-5 text-primary" />
          Win Progression
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={winTrendData}>
              <defs>
                <linearGradient id="colorP1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.player1} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.player1} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.player2} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.player2} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="match"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={player1Name}
                stroke={CHART_COLORS.player1}
                fill="url(#colorP1)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey={player2Name}
                stroke={CHART_COLORS.player2}
                fill="url(#colorP2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* K/D Trend Chart */}
      {trackKills && kdData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.Swords className="w-5 h-5 text-orange-500" />
            K/D Ratio per Match
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="match"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={player1Name}
                  stroke={CHART_COLORS.player1}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.player1, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey={player2Name}
                  stroke={CHART_COLORS.player2}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.player2, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Win Distribution & Round Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Win Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.Star className="w-5 h-5 text-yellow-500" />
            Win Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {winDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.player1 }} />
              <span className="text-sm text-muted-foreground">
                {player1Name}: {totalStats.p1Wins} wins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.player2 }} />
              <span className="text-sm text-muted-foreground">
                {player2Name}: {totalStats.p2Wins} wins
              </span>
            </div>
          </div>
        </motion.div>

        {/* Round Stats Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.Shield className="w-5 h-5 text-blue-500" />
            Total Rounds Won
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roundData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="rounds" radius={[0, 4, 4, 0]}>
                  <Cell fill={CHART_COLORS.player1} />
                  <Cell fill={CHART_COLORS.player2} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Stats Table - Always show, K/D columns only when trackKills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.FileText className="w-5 h-5 text-green-500" />
          Detailed Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Player</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Wins</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Rounds</th>
                {trackKills && (
                  <>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Kills</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Deaths</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">K/D</th>
                  </>
                )}
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium" style={{ color: CHART_COLORS.player1 }}>{player1Name}</td>
                <td className="text-center py-3 px-4">{totalStats.p1Wins}</td>
                <td className="text-center py-3 px-4">{totalStats.p1Rounds}</td>
                {trackKills && (
                  <>
                    <td className="text-center py-3 px-4 text-green-500">{totalStats.p1Kills}</td>
                    <td className="text-center py-3 px-4 text-red-500">{totalStats.p1Deaths}</td>
                    <td className="text-center py-3 px-4 font-medium">{totalStats.p1KD}</td>
                  </>
                )}
                <td className="text-center py-3 px-4">
                  {matches.length > 0 ? ((totalStats.p1Wins / matches.length) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium" style={{ color: CHART_COLORS.player2 }}>{player2Name}</td>
                <td className="text-center py-3 px-4">{totalStats.p2Wins}</td>
                <td className="text-center py-3 px-4">{totalStats.p2Rounds}</td>
                {trackKills && (
                  <>
                    <td className="text-center py-3 px-4 text-green-500">{totalStats.p2Kills}</td>
                    <td className="text-center py-3 px-4 text-red-500">{totalStats.p2Deaths}</td>
                    <td className="text-center py-3 px-4 font-medium">{totalStats.p2KD}</td>
                  </>
                )}
                <td className="text-center py-3 px-4">
                  {matches.length > 0 ? ((totalStats.p2Wins / matches.length) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
