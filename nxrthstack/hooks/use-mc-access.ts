"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface McServerInfo {
  id: string;
  name: string;
  slug: string;
  gamePort: number;
  maxPlayers: number | null;
  serverType: string;
  iconUrl: string | null;
  isActive: boolean;
  hasAccess: boolean;
  role: string | null;
  grantId: string | null;
}

/**
 * Hook to fetch the current user's MC server access list.
 */
export function useMcAccess() {
  const { data, error, isLoading, mutate } = useSWR<{
    servers: McServerInfo[];
  }>("/api/gamehub/minecraft/server/access", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    servers: data?.servers ?? [],
    isLoading,
    error,
    mutate,
  };
}
