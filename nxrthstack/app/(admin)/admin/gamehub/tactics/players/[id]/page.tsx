"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/gamehub/tactics/rarities";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

interface UnitInstanceData {
  id: string;
  templateId: string;
  rarity: string;
  level: number;
  xp: number;
}

interface EquipmentData {
  id: string;
  slot: string;
  name: string;
  rarity: string;
  unitInstanceId: string | null;
  enchantLevel: number;
  equipmentLevel: number;
}

interface PlayerDetail {
  id: string;
  userId: string;
  rating: number;
  currency: number;
  totalWins: number;
  totalLosses: number;
  campaignLevel: number;
  warfareRating: number;
  warfareWins: number;
  warfareLosses: number;
  loginStreak: number;
  userName: string | null;
  userEmail: string;
}

export default function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [units, setUnits] = useState<UnitInstanceData[]>([]);
  const [equipment, setEquipment] = useState<EquipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Editable fields
  const [editRating, setEditRating] = useState(0);
  const [editCurrency, setEditCurrency] = useState(0);
  const [editCampaign, setEditCampaign] = useState(0);
  const [editWarfareRating, setEditWarfareRating] = useState(0);

  useEffect(() => {
    loadPlayer();
  }, [id]);

  async function loadPlayer() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gamehub/tactics/players/${id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setPlayer(json.player);
      setUnits(json.unitInstances);
      setEquipment(json.equipment);
      setEditRating(json.player.rating);
      setEditCurrency(json.player.currency);
      setEditCampaign(json.player.campaignLevel);
      setEditWarfareRating(json.player.warfareRating);
    } catch (err) {
      console.error("Failed to load player:", err);
    } finally {
      setLoading(false);
    }
  }

  async function savePlayer() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/gamehub/tactics/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          currency: editCurrency,
          campaignLevel: editCampaign,
          warfareRating: editWarfareRating,
        }),
      });
      if (res.ok) {
        setStatus("Saved!");
        loadPlayer();
      } else {
        const json = await res.json();
        setStatus(json.error || "Failed to save");
      }
    } catch {
      setStatus("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUnit(instanceId: string) {
    if (!confirm("Delete this unit instance?")) return;
    const res = await fetch(
      `/api/admin/gamehub/tactics/players/${id}/units?instanceId=${instanceId}`,
      { method: "DELETE" }
    );
    if (res.ok) loadPlayer();
  }

  async function deleteEquipment(equipmentId: string) {
    if (!confirm("Delete this equipment?")) return;
    const res = await fetch(
      `/api/admin/gamehub/tactics/players/${id}/equipment?equipmentId=${equipmentId}`,
      { method: "DELETE" }
    );
    if (res.ok) loadPlayer();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Player not found</p>
        <Link href="/admin/gamehub/tactics" className="text-primary hover:underline mt-2 inline-block">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <FadeIn>
        <div className="flex items-center gap-3">
          <Link href="/admin/gamehub/tactics" className="text-muted-foreground hover:text-foreground">
            <Icons.ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{player.userName || "Unknown Player"}</h1>
            <p className="text-sm text-muted-foreground">{player.userEmail}</p>
          </div>
        </div>
      </FadeIn>

      {/* Editable stats */}
      <FadeIn delay={0.1}>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Player Stats</h2>
            <div className="flex items-center gap-2">
              {status && (
                <span className={cn("text-xs", status === "Saved!" ? "text-green-400" : "text-red-400")}>
                  {status}
                </span>
              )}
              <button
                onClick={savePlayer}
                disabled={saving}
                className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">PvP Rating</label>
              <input
                type="number"
                value={editRating}
                onChange={(e) => setEditRating(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Currency</label>
              <input
                type="number"
                value={editCurrency}
                onChange={(e) => setEditCurrency(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Campaign Level</label>
              <input
                type="number"
                value={editCampaign}
                onChange={(e) => setEditCampaign(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Warfare Rating</label>
              <input
                type="number"
                value={editWarfareRating}
                onChange={(e) => setEditWarfareRating(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-muted-foreground">Wins: </span>
              <span className="text-green-400">{player.totalWins}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Losses: </span>
              <span className="text-red-400">{player.totalLosses}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Streak: </span>
              <span>{player.loginStreak}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Warfare W/L: </span>
              <span>{player.warfareWins}/{player.warfareLosses}</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Unit Instances */}
      <FadeIn delay={0.15}>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Unit Instances ({units.length})</h2>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unit instances</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map((unit) => {
                const template = ALL_UNITS[unit.templateId];
                return (
                  <div key={unit.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{template?.name ?? unit.templateId}</p>
                      <p className={cn("text-xs", RARITY_COLORS[unit.rarity as Rarity])}>
                        {RARITY_LABELS[unit.rarity as Rarity]} Lv.{unit.level}
                      </p>
                      <p className="text-xs text-muted-foreground">XP: {unit.xp}</p>
                    </div>
                    <button
                      onClick={() => deleteUnit(unit.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Equipment */}
      <FadeIn delay={0.2}>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Equipment ({equipment.length})</h2>
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipment.map((eq) => (
                <div key={eq.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className={cn("font-medium text-sm", RARITY_COLORS[eq.rarity as Rarity])}>
                      {eq.name}
                      {eq.enchantLevel > 0 && <span className="text-purple-400 ml-1">+{eq.enchantLevel}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {eq.slot} | {RARITY_LABELS[eq.rarity as Rarity]} | Lv.{eq.equipmentLevel}
                    </p>
                    {eq.unitInstanceId && (
                      <p className="text-xs text-muted-foreground">
                        Equipped on: {units.find((u) => u.id === eq.unitInstanceId)?.templateId ?? "?"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEquipment(eq.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
