"use client";

import { useState } from "react";
import useSWR from "swr";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccessCode {
  id: string;
  code: string;
  label: string | null;
  defaultRole: string;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  serverName: string | null;
  serverId: string;
}

interface McAccessCodesProps {
  servers: { id: string; name: string }[];
}

export function McAccessCodes({ servers }: McAccessCodesProps) {
  const { data, isLoading, mutate } = useSWR<{ codes: AccessCode[] }>(
    "/api/admin/gamehub/minecraft/access-codes",
    fetcher
  );

  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState({
    serverId: servers[0]?.id || "",
    label: "",
    defaultRole: "viewer",
    maxUses: "",
  });

  const handleCreate = async () => {
    if (!newCode.serverId) return;
    setCreating(true);
    try {
      await fetch("/api/admin/gamehub/minecraft/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: newCode.serverId,
          label: newCode.label || null,
          defaultRole: newCode.defaultRole,
          maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : null,
        }),
      });
      setNewCode({ ...newCode, label: "", maxUses: "" });
      mutate();
    } catch {
      // error
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/gamehub/minecraft/access-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this access code?")) return;
    await fetch(`/api/admin/gamehub/minecraft/access-codes/${id}`, {
      method: "DELETE",
    });
    mutate();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Create Access Code
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={newCode.serverId}
            onChange={(e) =>
              setNewCode({ ...newCode, serverId: e.target.value })
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={newCode.defaultRole}
            onChange={(e) =>
              setNewCode({ ...newCode, defaultRole: e.target.value })
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="text"
            value={newCode.label}
            onChange={(e) =>
              setNewCode({ ...newCode, label: e.target.value })
            }
            placeholder="Label (optional)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={newCode.maxUses}
            onChange={(e) =>
              setNewCode({ ...newCode, maxUses: e.target.value })
            }
            placeholder="Max uses (unlimited)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !newCode.serverId}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Code"}
        </button>
      </div>

      {/* Code list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.codes.map((code) => (
            <div
              key={code.id}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3",
                !code.isActive && "opacity-60"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-primary">
                    {code.code}
                  </code>
                  <button
                    onClick={() => copyCode(code.code)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icons.Copy className="h-3.5 w-3.5" />
                  </button>
                  {code.label && (
                    <span className="text-xs text-muted-foreground">
                      {code.label}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{code.serverName}</span>
                  <span>Role: {code.defaultRole}</span>
                  <span>
                    Used: {code.usedCount}
                    {code.maxUses ? `/${code.maxUses}` : ""}
                  </span>
                  {!code.isActive && (
                    <span className="text-red-400">Deactivated</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggle(code.id, !code.isActive)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                  title={code.isActive ? "Deactivate" : "Activate"}
                >
                  {code.isActive ? (
                    <Icons.EyeOff className="h-4 w-4" />
                  ) : (
                    <Icons.Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(code.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Icons.Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
