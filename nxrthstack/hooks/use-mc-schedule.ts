"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ScheduledSession {
  id: string;
  serverId: string;
  sessionId: string | null;
  title: string;
  scheduledAt: string;
  endTime: string;
  status: "pending" | "active" | "completed" | "cancelled";
  createdBy: {
    id: string;
    name: string | null;
  };
  actions: {
    id: string;
    action: string;
    scheduledAt: string;
    status: string;
    executedAt: string | null;
    resultMessage: string | null;
  }[];
}

export function useMcSchedule(serverId: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    schedules: ScheduledSession[];
  }>(
    `/api/gamehub/minecraft/server/scheduler?serverId=${serverId}`,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );

  return {
    schedules: data?.schedules ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function createSchedule(data: {
  serverId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  autoStart: boolean;
  autoStop: boolean;
  warnings: boolean;
}) {
  const res = await fetch("/api/gamehub/minecraft/server/scheduler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Failed to create schedule");
  }

  return res.json();
}

export async function cancelSchedule(scheduleId: string) {
  const res = await fetch(
    `/api/gamehub/minecraft/server/scheduler/${scheduleId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Failed to cancel schedule");
  }

  return res.json();
}
