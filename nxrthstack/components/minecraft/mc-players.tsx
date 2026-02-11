"use client";

import { useState } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { PlayerActionDialog } from "@/components/minecraft/player-action-dialog";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "online" | "whitelist" | "ops" | "banned";

interface PlayerData {
  online: {
    online: number;
    max: number;
    list: { name: string; uuid: string | null }[];
  };
  whitelist: string[];
  ops: string[];
  banned: string[];
}

interface PendingAction {
  action: "kick" | "ban";
  player: string;
}

export function McPlayers() {
  const { serverId, userRole } = useMcContext();
  const { data, isLoading, mutate } = useSWR<PlayerData>(
    `/api/gamehub/minecraft/server/players?serverId=${serverId}`,
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: false }
  );

  const [activeTab, setActiveTab] = useState<Tab>("online");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [addInput, setAddInput] = useState("");

  const canKick = hasMinRole(userRole, "operator");
  const canBan = hasMinRole(userRole, "manager");
  const canWhitelist = hasMinRole(userRole, "operator");
  const canOp = hasMinRole(userRole, "manager");

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "online", label: "Online", count: data.online.list.length },
    { id: "whitelist", label: "Whitelist", count: data.whitelist.length },
    { id: "ops", label: "Operators", count: data.ops.length },
    { id: "banned", label: "Banned", count: data.banned.length },
  ];

  async function handleAction(
    endpoint: string,
    method: string,
    body: Record<string, string>
  ) {
    setActionLoading(true);
    try {
      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, ...body }),
      });
      mutate();
    } catch {
      // Error handling via UI
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  async function handleKickBan(reason: string) {
    if (!pendingAction) return;
    const endpoint =
      pendingAction.action === "kick"
        ? "/api/gamehub/minecraft/server/players/kick"
        : "/api/gamehub/minecraft/server/players/ban";
    await handleAction(endpoint, "POST", {
      player: pendingAction.player,
      reason,
    });
  }

  async function handleAdd(type: "whitelist" | "ops") {
    if (!addInput.trim()) return;
    const endpoint = `/api/gamehub/minecraft/server/players/${type}`;
    await handleAction(endpoint, "POST", { player: addInput.trim() });
    setAddInput("");
  }

  async function handleRemove(type: "whitelist" | "ops" | "ban", player: string) {
    const endpoint =
      type === "ban"
        ? "/api/gamehub/minecraft/server/players/ban"
        : `/api/gamehub/minecraft/server/players/${type}`;
    await handleAction(endpoint, "DELETE", { player });
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground/60">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Online players */}
      {activeTab === "online" && (
        <div className="space-y-2">
          {data.online.list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No players online
            </p>
          ) : (
            data.online.list.map((player) => (
              <div
                key={player.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`https://mc-heads.net/avatar/${player.uuid || player.name}/32`}
                    alt={player.name}
                    className="h-8 w-8 rounded"
                    loading="lazy"
                  />
                  <span className="font-medium text-foreground text-sm">
                    {player.name}
                  </span>
                </div>
                {canKick && (
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setPendingAction({
                          action: "kick",
                          player: player.name,
                        })
                      }
                      className="rounded p-1.5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                      title="Kick"
                    >
                      <Icons.X className="h-4 w-4" />
                    </button>
                    {canBan && (
                      <button
                        onClick={() =>
                          setPendingAction({
                            action: "ban",
                            player: player.name,
                          })
                        }
                        className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Ban"
                      >
                        <Icons.Shield className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Whitelist */}
      {activeTab === "whitelist" && (
        <div className="space-y-3">
          {canWhitelist && (
            <div className="flex gap-2">
              <input
                type="text"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="Player name..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd("whitelist");
                }}
              />
              <button
                onClick={() => handleAdd("whitelist")}
                disabled={!addInput.trim() || actionLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
          <PlayerNameList
            names={data.whitelist}
            onRemove={canWhitelist ? (name) => handleRemove("whitelist", name) : undefined}
          />
        </div>
      )}

      {/* Ops */}
      {activeTab === "ops" && (
        <div className="space-y-3">
          {canOp && (
            <div className="flex gap-2">
              <input
                type="text"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="Player name..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd("ops");
                }}
              />
              <button
                onClick={() => handleAdd("ops")}
                disabled={!addInput.trim() || actionLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
          <PlayerNameList
            names={data.ops}
            onRemove={canOp ? (name) => handleRemove("ops", name) : undefined}
          />
        </div>
      )}

      {/* Banned */}
      {activeTab === "banned" && (
        <div className="space-y-2">
          <PlayerNameList
            names={data.banned}
            onRemove={canBan ? (name) => handleRemove("ban", name) : undefined}
            removeLabel="Unban"
          />
        </div>
      )}

      {/* Action dialog */}
      {pendingAction && (
        <PlayerActionDialog
          action={pendingAction.action}
          playerName={pendingAction.player}
          onConfirm={handleKickBan}
          onCancel={() => setPendingAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

function PlayerNameList({
  names,
  onRemove,
  removeLabel = "Remove",
}: {
  names: string[];
  onRemove?: (name: string) => void;
  removeLabel?: string;
}) {
  if (names.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No players in this list
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {names.map((name) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
        >
          <div className="flex items-center gap-3">
            <img
              src={`https://mc-heads.net/avatar/${name}/24`}
              alt={name}
              className="h-6 w-6 rounded"
              loading="lazy"
            />
            <span className="text-sm text-foreground">{name}</span>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(name)}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              {removeLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
