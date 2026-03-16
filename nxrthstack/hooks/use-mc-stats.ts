"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type StatsRange = "1h" | "6h" | "24h" | "7d" | "30d";

export interface StatsDataPoint {
  timestamp: string;
  playersOnline: number;
  playersMax: number;
  tps: number | null;
  memoryUsedMb: number | null;
  memoryMaxMb: number | null;
  cpuPercent: number | null;
  diskUsedMb: number | null;
  isOnline: boolean;
}

export interface PlayerActivityPoint {
  bucket: string;
  joins: number;
  leaves: number;
  deaths: number;
}

export interface StatsSummary {
  peakPlayers: number;
  avgTps: number | null;
  uptimePercent: number;
  totalJoins: number;
  uniquePlayers: number;
}

export interface StatsResponse {
  data: StatsDataPoint[];
  playerActivity: PlayerActivityPoint[];
  summary: StatsSummary;
}

const REFRESH_INTERVALS: Record<StatsRange, number> = {
  "1h": 30_000,
  "6h": 60_000,
  "24h": 120_000,
  "7d": 300_000,
  "30d": 600_000,
};

export function useMcStats(serverId: string, range: StatsRange = "24h") {
  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(
    `/api/gamehub/minecraft/server/stats?serverId=${serverId}&range=${range}`,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVALS[range],
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
