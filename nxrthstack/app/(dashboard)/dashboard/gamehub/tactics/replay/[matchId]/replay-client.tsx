"use client";

import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import type { BattleEvent, Squad, BattleStats } from "@/lib/gamehub/tactics/types";

const BattleCanvas = dynamic(
  () => import("@/components/gamehub/tactics/battle-canvas").then((m) => m.BattleCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

interface ReplayClientProps {
  events: BattleEvent[];
  attackerSquad: Squad;
  defenderSquad: Squad;
  mapId: string;
  maxTick: number;
  stats: BattleStats;
}

export function ReplayClient({ events, attackerSquad, defenderSquad, mapId, maxTick, stats }: ReplayClientProps) {
  return (
    <div className="space-y-6">
      <BattleCanvas
        events={events}
        attackerSquad={attackerSquad}
        defenderSquad={defenderSquad}
        mapId={mapId}
        maxTick={maxTick}
      />

      {/* Battle Stats */}
      <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 tactics-heading">Battle Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Attacker Damage</p>
            <p className="text-lg font-bold text-orange-400">{stats.attackerDamageDealt}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Defender Damage</p>
            <p className="text-lg font-bold text-orange-400">{stats.defenderDamageDealt}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-bold text-foreground">{(maxTick / 10).toFixed(1)}s</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Attacker Units Lost</p>
            <p className="text-lg font-bold text-red-400">{stats.attackerUnitsLost}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Defender Units Lost</p>
            <p className="text-lg font-bold text-red-400">{stats.defenderUnitsLost}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Healing</p>
            <p className="text-lg font-bold text-green-400">
              {stats.attackerHealingDone + stats.defenderHealingDone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
