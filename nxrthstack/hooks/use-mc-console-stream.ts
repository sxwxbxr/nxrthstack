"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ConsoleLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";
  thread: string;
  message: string;
  category: "chat" | "join" | "leave" | "death" | "command" | "system";
  raw: string;
}

interface UseConsoleStreamOptions {
  serverId: string;
  maxLines?: number;
}

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

/**
 * Hook to connect to the MC agent's SSE console stream.
 *
 * 1. Fetches a short-lived JWT from the Vercel token endpoint
 * 2. Opens an EventSource to the agent's /console/stream?token=JWT
 * 3. Refreshes the token 30s before expiry
 * 4. Auto-reconnects on disconnect with exponential backoff
 */
export function useMcConsoleStream({
  serverId,
  maxLines = 500,
}: UseConsoleStreamOptions) {
  const [lines, setLines] = useState<ConsoleLogEntry[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  const addLine = useCallback(
    (entry: ConsoleLogEntry) => {
      setLines((prev) => {
        const next = [...prev, entry];
        return next.length > maxLines ? next.slice(-maxLines) : next;
      });
    },
    [maxLines]
  );

  const clearLines = useCallback(() => setLines([]), []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    disconnect();
    setConnectionState("connecting");

    try {
      // Fetch token from Vercel
      const tokenRes = await fetch(
        "/api/gamehub/minecraft/server/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serverId }),
        }
      );

      if (!tokenRes.ok) {
        throw new Error("Failed to get token");
      }

      const { token, agentUrl, expiresAt } = await tokenRes.json();

      if (!mountedRef.current) return;

      // Open SSE connection directly to agent
      const es = new EventSource(
        `${agentUrl}/console/stream?token=${encodeURIComponent(token)}`
      );
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionState("connected");
        reconnectAttemptRef.current = 0;
      };

      es.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "log") {
            addLine(data as ConsoleLogEntry);
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        if (!mountedRef.current) return;
        es.close();
        eventSourceRef.current = null;
        setConnectionState("disconnected");
        scheduleReconnect();
      };

      // Schedule token refresh 30s before expiry
      const expiresMs = new Date(expiresAt).getTime() - Date.now();
      const refreshMs = Math.max(expiresMs - 30_000, 10_000);
      refreshTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, refreshMs);
    } catch {
      if (!mountedRef.current) return;
      setConnectionState("error");
      scheduleReconnect();
    }
  }, [serverId, addLine, disconnect]);

  const scheduleReconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(1000 * 2 ** attempt, 30_000);
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    lines,
    connectionState,
    clearLines,
    reconnect: connect,
  };
}
