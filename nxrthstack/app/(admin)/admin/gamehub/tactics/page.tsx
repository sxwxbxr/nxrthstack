"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ConfigEntry {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
}

interface PlayerSummary {
  id: string;
  userId: string;
  rating: number;
  currency: number;
  totalWins: number;
  totalLosses: number;
  campaignLevel: number;
  warfareRating: number;
  loginStreak: number;
  userName: string | null;
  userEmail: string;
}

export default function AdminTacticsPage() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [configRes, playersRes] = await Promise.all([
        fetch("/api/admin/gamehub/tactics/config"),
        fetch("/api/admin/gamehub/tactics/players"),
      ]);
      if (configRes.ok) {
        const json = await configRes.json();
        setConfigs(json.configs);
      }
      if (playersRes.ok) {
        const json = await playersRes.json();
        setPlayers(json.players);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function searchPlayers() {
    const res = await fetch(`/api/admin/gamehub/tactics/players?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      const json = await res.json();
      setPlayers(json.players);
    }
  }

  async function saveConfig(key: string) {
    setSaving(true);
    try {
      const parsed = JSON.parse(editValue);
      const res = await fetch("/api/admin/gamehub/tactics/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: parsed }),
      });
      if (res.ok) {
        setEditKey(null);
        loadData();
      }
    } catch {
      alert("Invalid JSON");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <FadeIn>
        <h1 className="text-3xl font-bold">Tactics Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage game configuration and players.
        </p>
      </FadeIn>

      {/* Stats overview */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Players</p>
            <p className="text-2xl font-bold">{players.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Config Keys</p>
            <p className="text-2xl font-bold">{configs.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold">
              {players.length > 0
                ? Math.round(players.reduce((a, p) => a + p.rating, 0) / players.length)
                : 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Max Campaign</p>
            <p className="text-2xl font-bold">
              {players.length > 0 ? Math.max(...players.map((p) => p.campaignLevel)) : 0}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Game Config */}
      <FadeIn delay={0.15}>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Game Configuration</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Edit values as JSON. Changes take effect within 60 seconds.
          </p>
          <div className="space-y-3">
            {configs.map((config) => (
              <div key={config.key} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-mono text-sm font-medium text-foreground">
                    {config.key}
                  </h3>
                  {editKey === config.key ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveConfig(config.key)}
                        disabled={saving}
                        className="px-3 py-1 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditKey(null)}
                        className="px-3 py-1 rounded text-xs border border-border hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditKey(config.key);
                        setEditValue(JSON.stringify(config.value, null, 2));
                      }}
                      className="px-3 py-1 rounded text-xs border border-border hover:bg-accent"
                    >
                      <Icons.Edit className="h-3 w-3 inline mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
                {editKey === config.key ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded border border-border bg-background p-2 font-mono text-xs text-foreground min-h-[100px]"
                  />
                ) : (
                  <pre className="text-xs bg-muted/30 rounded p-2 overflow-x-auto font-mono text-muted-foreground">
                    {JSON.stringify(config.value, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Players */}
      <FadeIn delay={0.2}>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Players</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPlayers()}
                placeholder="Search by name..."
                className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
              <button
                onClick={searchPlayers}
                className="px-3 py-1.5 rounded border border-border text-sm hover:bg-accent"
              >
                <Icons.Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Player</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Rating</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Currency</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">W/L</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Campaign</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Warfare</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <p className="font-medium">{player.userName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{player.userEmail}</p>
                    </td>
                    <td className="py-2 px-3 text-right">{player.rating}</td>
                    <td className="py-2 px-3 text-right text-yellow-400">{player.currency}g</td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-green-400">{player.totalWins}</span>
                      /
                      <span className="text-red-400">{player.totalLosses}</span>
                    </td>
                    <td className="py-2 px-3 text-right">Lv.{player.campaignLevel}</td>
                    <td className="py-2 px-3 text-right">{player.warfareRating}</td>
                    <td className="py-2 px-3 text-center">
                      <Link
                        href={`/admin/gamehub/tactics/players/${player.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
