"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMcContext } from "@/components/minecraft/mc-context";
import { useMcStats, type StatsRange } from "@/hooks/use-mc-stats";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

const RANGES: { value: StatsRange; label: string }[] = [
  { value: "1h", label: "1H" },
  { value: "6h", label: "6H" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

const CHART_COLORS = {
  tpsGood: "#22c55e",
  tpsWarn: "#eab308",
  tpsBad: "#ef4444",
  memory: "#8b5cf6",
  memoryFill: "#8b5cf620",
  players: "#3b82f6",
  playersFill: "#3b82f620",
  cpu: "#f97316",
  joins: "#22c55e",
  leaves: "#ef4444",
  deaths: "#6b7280",
  grid: "#ffffff10",
  axis: "#ffffff40",
};

function formatTime(timestamp: string, range: StatsRange) {
  const d = new Date(timestamp);
  if (range === "1h" || range === "6h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "24h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-48">{children}</div>
    </div>
  );
}

// TPS color based on value
function getTpsColor(tps: number | null) {
  if (tps == null) return CHART_COLORS.tpsGood;
  if (tps >= 19) return CHART_COLORS.tpsGood;
  if (tps >= 15) return CHART_COLORS.tpsWarn;
  return CHART_COLORS.tpsBad;
}

export function McStatsCharts() {
  const { serverId } = useMcContext();
  const [range, setRange] = useState<StatsRange>("24h");
  const { stats, isLoading } = useMcStats(serverId, range);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const data = stats?.data ?? [];
  const activity = stats?.playerActivity ?? [];
  const summary = stats?.summary;

  const chartData = data.map((d) => ({
    ...d,
    time: formatTime(d.timestamp, range),
    memPercent:
      d.memoryUsedMb && d.memoryMaxMb
        ? Math.round((d.memoryUsedMb / d.memoryMaxMb) * 100)
        : null,
  }));

  const activityData = activity.map((a) => ({
    ...a,
    time: formatTime(a.bucket, range),
  }));

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "0.5rem",
      fontSize: "0.75rem",
    },
    labelStyle: { color: "hsl(var(--foreground))" },
  };

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Server Statistics</h1>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  range === r.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Summary cards */}
      {summary && (
        <FadeIn delay={0.1}>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StaggerItem>
              <StatCard
                icon={Icons.Users}
                label="Peak Players"
                value={String(summary.peakPlayers)}
                color="bg-blue-500/10 text-blue-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Icons.Activity}
                label="Avg TPS"
                value={summary.avgTps != null ? summary.avgTps.toFixed(1) : "—"}
                sub={
                  summary.avgTps != null
                    ? summary.avgTps >= 19
                      ? "Excellent"
                      : summary.avgTps >= 15
                        ? "Good"
                        : "Degraded"
                    : undefined
                }
                color="bg-green-500/10 text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Icons.CheckCircle}
                label="Uptime"
                value={`${summary.uptimePercent}%`}
                color="bg-purple-500/10 text-purple-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Icons.TrendingUp}
                label="Total Joins"
                value={String(summary.totalJoins)}
                color="bg-amber-500/10 text-amber-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={Icons.Users}
                label="Unique Players"
                value={String(summary.uniquePlayers)}
                color="bg-cyan-500/10 text-cyan-500"
              />
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>
      )}

      {data.length === 0 ? (
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Icons.BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No stats data yet. Data collection starts when the cron job syncs with the agent.
            </p>
          </div>
        </FadeIn>
      ) : (
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* TPS over time */}
            <ChartCard title="TPS (Ticks Per Second)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 20]}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="tps"
                    stroke={CHART_COLORS.tpsGood}
                    strokeWidth={2}
                    dot={false}
                    name="TPS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Memory usage */}
            <ChartCard title="Memory Usage (%)">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="memPercent"
                    stroke={CHART_COLORS.memory}
                    fill={CHART_COLORS.memoryFill}
                    strokeWidth={2}
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Players online */}
            <ChartCard title="Players Online">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="stepAfter"
                    dataKey="playersOnline"
                    stroke={CHART_COLORS.players}
                    fill={CHART_COLORS.playersFill}
                    strokeWidth={2}
                    name="Players"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* CPU usage */}
            <ChartCard title="CPU Usage (%)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="cpuPercent"
                    stroke={CHART_COLORS.cpu}
                    strokeWidth={2}
                    dot={false}
                    name="CPU %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Player activity */}
            {activityData.length > 0 && (
              <ChartCard title="Player Activity">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="joins" fill={CHART_COLORS.joins} name="Joins" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="leaves" fill={CHART_COLORS.leaves} name="Leaves" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
