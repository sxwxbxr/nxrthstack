"use client";

import { useMcContext } from "@/components/minecraft/mc-context";
import { useMcStatus, type McStatus } from "@/hooks/use-mc-status";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function StatWidget({
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
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            color ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PlayerList({ status }: { status: McStatus }) {
  const players = status.players.list;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icons.Users className="h-4 w-4 text-primary" />
        Online Players ({status.players.online})
      </h3>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No players online</p>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.uuid}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <img
                src={`https://mc-heads.net/avatar/${player.uuid}/24`}
                alt={player.name}
                className="h-6 w-6 rounded"
                loading="lazy"
              />
              {player.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function McOverviewPage() {
  const { serverId, serverName } = useMcContext();
  const { status, isLoading } = useMcStatus(serverId);

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOnline = status.running;
  const memPercent =
    status.memory.max > 0
      ? Math.round((status.memory.used / status.memory.max) * 100)
      : 0;
  const diskPercent =
    status.disk.total > 0
      ? Math.round((status.disk.used / status.disk.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {serverName}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )}
              />
              {isOnline ? "Server is running" : "Server is offline"}
              {status.version && ` — ${status.version}`}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats grid */}
      <FadeIn delay={0.1}>
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatWidget
              icon={Icons.Users}
              label="Players"
              value={`${status.players.online}/${status.players.max}`}
              color="bg-blue-500/10 text-blue-500"
            />
          </StaggerItem>
          <StaggerItem>
            <StatWidget
              icon={Icons.Activity}
              label="TPS"
              value={status.tps != null ? status.tps.toFixed(1) : "—"}
              sub={
                status.tps != null
                  ? status.tps >= 19
                    ? "Excellent"
                    : status.tps >= 15
                      ? "Good"
                      : "Degraded"
                  : undefined
              }
              color="bg-green-500/10 text-green-500"
            />
          </StaggerItem>
          <StaggerItem>
            <StatWidget
              icon={Icons.Cpu}
              label="Memory"
              value={`${memPercent}%`}
              sub={`${formatBytes(status.memory.used)} / ${formatBytes(status.memory.max)}`}
              color="bg-amber-500/10 text-amber-500"
            />
          </StaggerItem>
          <StaggerItem>
            <StatWidget
              icon={Icons.Clock}
              label="Uptime"
              value={formatUptime(status.uptime)}
              color="bg-purple-500/10 text-purple-500"
            />
          </StaggerItem>
        </StaggerContainer>
      </FadeIn>

      {/* Bottom row */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlayerList status={status} />

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icons.HardDrive className="h-4 w-4 text-primary" />
              Storage
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Disk Usage</span>
                  <span>
                    {formatBytes(status.disk.used)} /{" "}
                    {formatBytes(status.disk.total)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      diskPercent > 90
                        ? "bg-red-500"
                        : diskPercent > 70
                          ? "bg-amber-500"
                          : "bg-primary"
                    )}
                    style={{ width: `${Math.min(diskPercent, 100)}%` }}
                  />
                </div>
              </div>
              {status.cpu != null && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>CPU</span>
                    <span>{status.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        status.cpu > 90
                          ? "bg-red-500"
                          : status.cpu > 70
                            ? "bg-amber-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${Math.min(status.cpu, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
