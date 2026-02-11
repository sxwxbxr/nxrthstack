"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface McStatus {
  running: boolean;
  pid: number | null;
  uptime: number;
  version: string | null;
  motd: string | null;
  players: {
    online: number;
    max: number;
    list: { name: string; uuid: string }[];
  };
  tps: number | null;
  memory: { used: number; max: number; free: number };
  cpu: number | null;
  disk: { used: number; total: number };
  agentOnline: boolean;
}

/**
 * Poll the server status every 15s via the Vercel proxy.
 */
export function useMcStatus(serverId: string) {
  const { data, error, isLoading, mutate } = useSWR<McStatus>(
    `/api/gamehub/minecraft/server/status?serverId=${serverId}`,
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: false }
  );

  return {
    status: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
