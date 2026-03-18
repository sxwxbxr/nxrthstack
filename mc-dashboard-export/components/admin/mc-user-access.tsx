"use client";

import useSWR from "swr";
import { Icons } from "@/components/icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccessGrant {
  id: string;
  userId: string;
  serverId: string;
  role: string;
  grantedAt: string;
  userName: string | null;
  userEmail: string | null;
  serverName: string | null;
}

const ROLES = ["viewer", "operator", "manager", "admin"];

export function McUserAccess() {
  const { data, isLoading, mutate } = useSWR<{ grants: AccessGrant[] }>(
    "/api/admin/gamehub/minecraft/access-grants",
    fetcher
  );

  const handleRoleChange = async (id: string, role: string) => {
    await fetch(`/api/admin/gamehub/minecraft/access-grants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    mutate();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this user's access?")) return;
    await fetch(`/api/admin/gamehub/minecraft/access-grants/${id}`, {
      method: "DELETE",
    });
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.grants.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No users have access to any servers.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_120px_120px_60px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <span>User</span>
        <span>Server</span>
        <span>Role</span>
        <span>Granted</span>
        <span />
      </div>
      {data.grants.map((grant) => (
        <div
          key={grant.id}
          className="grid grid-cols-[1fr_1fr_120px_120px_60px] gap-4 px-4 py-2.5 text-sm items-center border-b border-border last:border-b-0"
        >
          <div>
            <p className="text-foreground">
              {grant.userName || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">{grant.userEmail}</p>
          </div>
          <span className="text-muted-foreground">{grant.serverName}</span>
          <select
            value={grant.role}
            onChange={(e) => handleRoleChange(grant.id, e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {new Date(grant.grantedAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => handleRevoke(grant.id)}
            className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors justify-self-end"
            title="Revoke"
          >
            <Icons.Trash className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
