"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Group server.properties keys for better UX
const PROPERTY_GROUPS: {
  title: string;
  keys: { key: string; label: string; type: "text" | "number" | "boolean" | "select"; options?: string[] }[];
}[] = [
  {
    title: "Network",
    keys: [
      { key: "server-port", label: "Server Port", type: "number" },
      { key: "server-ip", label: "Server IP", type: "text" },
      { key: "max-players", label: "Max Players", type: "number" },
      { key: "online-mode", label: "Online Mode", type: "boolean" },
      { key: "network-compression-threshold", label: "Compression Threshold", type: "number" },
      { key: "enable-query", label: "Enable Query", type: "boolean" },
      { key: "query.port", label: "Query Port", type: "number" },
    ],
  },
  {
    title: "Gameplay",
    keys: [
      { key: "gamemode", label: "Game Mode", type: "select", options: ["survival", "creative", "adventure", "spectator"] },
      { key: "difficulty", label: "Difficulty", type: "select", options: ["peaceful", "easy", "normal", "hard"] },
      { key: "pvp", label: "PvP", type: "boolean" },
      { key: "hardcore", label: "Hardcore", type: "boolean" },
      { key: "allow-flight", label: "Allow Flight", type: "boolean" },
      { key: "spawn-protection", label: "Spawn Protection", type: "number" },
      { key: "max-world-size", label: "Max World Size", type: "number" },
    ],
  },
  {
    title: "World",
    keys: [
      { key: "level-name", label: "Level Name", type: "text" },
      { key: "level-seed", label: "Level Seed", type: "text" },
      { key: "level-type", label: "Level Type", type: "text" },
      { key: "generate-structures", label: "Generate Structures", type: "boolean" },
      { key: "spawn-animals", label: "Spawn Animals", type: "boolean" },
      { key: "spawn-monsters", label: "Spawn Monsters", type: "boolean" },
      { key: "spawn-npcs", label: "Spawn NPCs", type: "boolean" },
      { key: "allow-nether", label: "Allow Nether", type: "boolean" },
    ],
  },
  {
    title: "Advanced",
    keys: [
      { key: "view-distance", label: "View Distance", type: "number" },
      { key: "simulation-distance", label: "Simulation Distance", type: "number" },
      { key: "motd", label: "MOTD", type: "text" },
      { key: "white-list", label: "Whitelist", type: "boolean" },
      { key: "enforce-whitelist", label: "Enforce Whitelist", type: "boolean" },
      { key: "enable-command-block", label: "Command Blocks", type: "boolean" },
      { key: "enable-rcon", label: "Enable RCON", type: "boolean" },
      { key: "rcon.port", label: "RCON Port", type: "number" },
    ],
  },
];

export function McPropertiesEditor() {
  const { serverId, userRole } = useMcContext();
  const canEdit = hasMinRole(userRole, "manager");

  const { data, isLoading, error, mutate } = useSWR<{
    properties: Record<string, string>;
    raw: string;
  }>(
    `/api/gamehub/minecraft/server/config/properties?serverId=${serverId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [localProps, setLocalProps] = useState<Record<string, string>>({});
  const [modified, setModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (data?.properties) {
      setLocalProps(data.properties);
      setModified(false);
    }
  }, [data?.properties]);

  const updateProp = (key: string, value: string) => {
    setLocalProps((prev) => ({ ...prev, [key]: value }));
    setModified(true);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (!canEdit || !modified) return;
    setSaving(true);
    setSaveStatus("idle");

    // Compute only changed properties
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(localProps)) {
      if (data?.properties[key] !== value) {
        updates[key] = value;
      }
    }

    try {
      const res = await fetch(
        "/api/gamehub/minecraft/server/config/properties",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serverId, updates }),
        }
      );

      if (!res.ok) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("success");
      setModified(false);
      mutate();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-400 text-center py-12">
        Failed to load server.properties
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save bar */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Changes require a server restart to take effect.
          </p>
          <div className="flex items-center gap-2">
            {saveStatus === "success" && (
              <span className="text-xs text-green-400">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-400">Failed to save</span>
            )}
            <button
              onClick={handleSave}
              disabled={!modified || saving}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? (
                <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icons.Save className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Property groups */}
      {PROPERTY_GROUPS.map((group) => {
        // Only show group if at least one key exists
        const visibleKeys = group.keys.filter(
          (k) => k.key in localProps
        );
        if (visibleKeys.length === 0) return null;

        return (
          <div
            key={group.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {group.title}
            </h3>
            <div className="space-y-3">
              {visibleKeys.map((prop) => (
                <div
                  key={prop.key}
                  className="flex items-center justify-between gap-4"
                >
                  <label className="text-sm text-muted-foreground shrink-0">
                    {prop.label}
                  </label>
                  {prop.type === "boolean" ? (
                    <button
                      onClick={() =>
                        canEdit &&
                        updateProp(
                          prop.key,
                          localProps[prop.key] === "true" ? "false" : "true"
                        )
                      }
                      disabled={!canEdit}
                      className={cn(
                        "rounded-full w-10 h-5 transition-colors relative",
                        localProps[prop.key] === "true"
                          ? "bg-primary"
                          : "bg-muted",
                        !canEdit && "opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          localProps[prop.key] === "true"
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        )}
                      />
                    </button>
                  ) : prop.type === "select" ? (
                    <select
                      value={localProps[prop.key] || ""}
                      onChange={(e) => updateProp(prop.key, e.target.value)}
                      disabled={!canEdit}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                    >
                      {prop.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={prop.type}
                      value={localProps[prop.key] || ""}
                      onChange={(e) => updateProp(prop.key, e.target.value)}
                      disabled={!canEdit}
                      className="w-40 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
