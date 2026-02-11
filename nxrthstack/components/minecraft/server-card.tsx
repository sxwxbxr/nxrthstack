"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import type { McServerInfo } from "@/hooks/use-mc-access";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ROLE_LABELS: Record<string, string> = {
  viewer: "Viewer",
  operator: "Operator",
  manager: "Manager",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  viewer: "text-muted-foreground",
  operator: "text-blue-400",
  manager: "text-amber-400",
  admin: "text-red-400",
};

const SERVER_TYPE_LABELS: Record<string, string> = {
  paper: "Paper",
  fabric: "Fabric",
  forge: "Forge",
  vanilla: "Vanilla",
  neoforge: "NeoForge",
};

interface ServerCardProps {
  server: McServerInfo;
}

export function ServerCard({ server }: ServerCardProps) {
  // Poll status for servers user has access to
  const { data: status } = useSWR(
    server.hasAccess
      ? `/api/gamehub/minecraft/server/status?serverId=${server.id}`
      : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  const isOnline = status?.running === true;
  const playerCount = status?.players?.online ?? 0;
  const maxPlayers = status?.players?.max ?? server.maxPlayers ?? 20;

  const cardContent = (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-6 transition-all",
        server.hasAccess
          ? "border-border hover:border-primary/50 cursor-pointer"
          : "border-border/50 opacity-70"
      )}
    >
      {/* Lock overlay for no-access servers */}
      {!server.hasAccess && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <Icons.Lock className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Access code required
            </span>
          </div>
        </div>
      )}

      {/* Server info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icons.Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{server.name}</h3>
            <p className="text-xs text-muted-foreground">
              {SERVER_TYPE_LABELS[server.serverType] || server.serverType}
              {status?.version && ` ${status.version}`}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {status ? (isOnline ? "Online" : "Offline") : "..."}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Icons.Users className="h-3.5 w-3.5" />
          {playerCount}/{maxPlayers}
        </span>
        {status?.tps != null && (
          <span className="flex items-center gap-1">
            TPS: {status.tps.toFixed(1)}
          </span>
        )}
        {server.hasAccess && server.role && (
          <span className={cn("font-medium", ROLE_COLORS[server.role])}>
            {ROLE_LABELS[server.role]}
          </span>
        )}
      </div>

      {/* Action */}
      {server.hasAccess && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary font-medium group-hover:underline">
            Open Dashboard →
          </span>
        </div>
      )}
    </div>
  );

  if (server.hasAccess) {
    return (
      <Link
        href={`/dashboard/gamehub/minecraft/server?id=${server.id}`}
        className="group block"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
