"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RARITY_COLORS, RARITY_LABELS, RARITY_BORDERS } from "@/lib/gamehub/tactics/rarities";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EquipmentInfo {
  id: string;
  slot: string;
  name: string;
  rarity: Rarity;
  stats: { stat: string; value: number }[];
  enchantLevel: number;
  equipmentLevel: number;
}

interface SquadUnit {
  templateId: string;
  name: string;
  class: string;
  instanceId: string;
  position: { x: number; y: number };
  rarity: Rarity;
  level: number;
  equipment: EquipmentInfo[];
}

interface ProfileData {
  profile: {
    userId: string;
    name: string;
    rating: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    campaignLevel: number;
    warfareRating: number;
    warfareWins: number;
    warfareLosses: number;
    attackSquad: SquadUnit[] | null;
    defenseSquad: SquadUnit[] | null;
  };
}

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data, isLoading } = useSWR<ProfileData>(
    `/api/gamehub/tactics/profile/${userId}`,
    fetcher
  );

  const profile = data?.profile;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Icons.Loader className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Icons.AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
        <p className="text-muted-foreground">Player not found.</p>
        <Link
          href="/dashboard/gamehub/tactics/leaderboard"
          className="text-primary text-sm hover:underline mt-2 inline-block"
        >
          Back to leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/gamehub/tactics/leaderboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tactics-heading">
              <GradientText>{profile.name}</GradientText>
            </h1>
            <p className="mt-1 text-muted-foreground">Player Profile</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats overview */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Icons.Trophy className="h-4 w-4 text-yellow-500" />}
            label="PvP Rating"
            value={profile.rating.toLocaleString()}
          />
          <StatCard
            icon={<Icons.Swords className="h-4 w-4 text-primary" />}
            label="Win Rate"
            value={`${profile.winRate}%`}
            sub={`${profile.totalWins}W / ${profile.totalLosses}L`}
          />
          <StatCard
            icon={<Icons.Map className="h-4 w-4 text-green-400" />}
            label="Campaign"
            value={`Level ${profile.campaignLevel}`}
          />
          <StatCard
            icon={<Icons.Shield className="h-4 w-4 text-blue-400" />}
            label="Warfare"
            value={profile.warfareRating.toLocaleString()}
            sub={`${profile.warfareWins}W / ${profile.warfareLosses}L`}
          />
        </div>
      </FadeIn>

      {/* Attack Squad */}
      <FadeIn delay={0.15}>
        <SquadDisplay title="Attack Squad" units={profile.attackSquad} />
      </FadeIn>

      {/* Defense Squad */}
      <FadeIn delay={0.2}>
        <SquadDisplay title="Defense Squad" units={profile.defenseSquad} />
      </FadeIn>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-sm border-2 border-border p-4 tactics-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SquadDisplay({
  title,
  units,
}: {
  title: string;
  units: SquadUnit[] | null;
}) {
  if (!units || units.length === 0) {
    return (
      <div className="rounded-sm border-2 border-border p-6 tactics-card">
        <h2 className="text-lg font-semibold mb-2 tactics-heading">{title}</h2>
        <p className="text-sm text-muted-foreground">No squad configured.</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border-2 border-border p-6 tactics-card">
      <h2 className="text-lg font-semibold mb-4 tactics-heading">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.map((unit) => (
          <div
            key={unit.instanceId}
            className={cn(
              "rounded-sm border-2 p-4 tactics-card",
              RARITY_BORDERS[unit.rarity]
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-foreground">{unit.name}</p>
                <p className="text-xs text-muted-foreground">{unit.class}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-xs font-medium", RARITY_COLORS[unit.rarity])}>
                  {RARITY_LABELS[unit.rarity]}
                </p>
                <p className="text-xs text-muted-foreground">Lv.{unit.level}</p>
              </div>
            </div>

            {unit.equipment.length > 0 && (
              <div className="border-t border-border/50 pt-2 mt-2 space-y-1">
                {unit.equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between text-xs">
                    <span className={cn("font-medium", RARITY_COLORS[eq.rarity])}>
                      {eq.name}
                      {eq.enchantLevel > 0 && (
                        <span className="text-purple-400 ml-1">+{eq.enchantLevel}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground capitalize">{eq.slot}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
