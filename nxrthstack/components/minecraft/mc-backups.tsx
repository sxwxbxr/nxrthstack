"use client";

import { useState } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BackupMeta {
  id: string;
  filename: string;
  label: string | null;
  type: "full" | "world-only";
  size: number;
  createdAt: string;
  status: "creating" | "ready" | "failed";
}

interface BackupStorage {
  used: number;
  total: number;
  count: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function McBackups() {
  const { serverId, userRole } = useMcContext();
  const canCreate = hasMinRole(userRole, "manager");
  const canRestore = hasMinRole(userRole, "admin");

  const { data, isLoading, mutate } = useSWR<{
    backups: BackupMeta[];
    storage: BackupStorage;
  }>(
    `/api/gamehub/minecraft/server/backups?serverId=${serverId}`,
    fetcher,
    { refreshInterval: 10_000, revalidateOnFocus: false }
  );

  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");

  const handleCreate = async (type: "full" | "world-only") => {
    setCreating(true);
    try {
      await fetch("/api/gamehub/minecraft/server/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, label: label || null, type }),
      });
      setLabel("");
      mutate();
    } catch {
      // error
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this backup?")) return;
    await fetch(
      `/api/gamehub/minecraft/server/backups/${id}?serverId=${serverId}`,
      { method: "DELETE" }
    );
    mutate();
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { backups, storage } = data;
  const usedPercent =
    storage.total > 0
      ? Math.round((storage.used / storage.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Storage meter */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icons.HardDrive className="h-4 w-4 text-primary" />
            Backup Storage
          </h3>
          <span className="text-xs text-muted-foreground">
            {storage.count} backup{storage.count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              usedPercent > 90
                ? "bg-red-500"
                : usedPercent > 70
                  ? "bg-amber-500"
                  : "bg-primary"
            )}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formatSize(storage.used)} / {formatSize(storage.total)} used
        </p>
      </div>

      {/* Create backup */}
      {canCreate && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Create Backup
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCreate("full")}
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? (
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Full Backup"
              )}
            </button>
            <button
              onClick={() => handleCreate("world-only")}
              disabled={creating}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              World Only
            </button>
          </div>
        </div>
      )}

      {/* Backup list */}
      <div className="space-y-2">
        {backups.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No backups yet
          </div>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {backup.label || backup.id}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      backup.status === "ready"
                        ? "bg-green-500/10 text-green-400"
                        : backup.status === "creating"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                    )}
                  >
                    {backup.status}
                  </span>
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {backup.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(backup.createdAt)}
                  {backup.size > 0 && ` — ${formatSize(backup.size)}`}
                </p>
              </div>

              {backup.status === "ready" && (
                <div className="flex gap-1">
                  {canCreate && (
                    <button
                      onClick={() => handleDelete(backup.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Icons.Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
