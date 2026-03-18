"use client";

import useSWR from "swr";
import { useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface McPreferences {
  theme: string;
  consoleFontSize: number;
  consoleTimestamps: boolean;
  customColors: Record<string, string> | null;
}

const DEFAULT_PREFS: McPreferences = {
  theme: "gamehub",
  consoleFontSize: 13,
  consoleTimestamps: true,
  customColors: null,
};

export function useMcPreferences() {
  const { data, isLoading, mutate } = useSWR<{
    preferences: McPreferences | null;
  }>(
    "/api/gamehub/minecraft/server/preferences",
    fetcher,
    { revalidateOnFocus: false }
  );

  const preferences = data?.preferences ?? DEFAULT_PREFS;

  const updatePreferences = useCallback(
    async (updates: Partial<McPreferences>) => {
      const newPrefs = { ...preferences, ...updates };
      // Optimistic update
      mutate({ preferences: newPrefs }, false);

      await fetch("/api/gamehub/minecraft/server/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updates }),
      });

      mutate();
    },
    [preferences, mutate]
  );

  return {
    preferences,
    isLoading,
    updatePreferences,
  };
}
