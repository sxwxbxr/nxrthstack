"use client";

import { useState, useCallback } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMcContext } from "@/components/minecraft/mc-context";
import { useMcStatus } from "@/hooks/use-mc-status";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";

type ControlAction = "start" | "stop" | "restart" | "kill";

interface ActionConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  confirmTitle: string;
  confirmMessage: string;
  minRole: "operator" | "admin";
  requiresOnline?: boolean;
  requiresOffline?: boolean;
}

const ACTIONS: Record<ControlAction, ActionConfig> = {
  start: {
    label: "Start",
    icon: Icons.Play,
    color: "text-green-500",
    hoverColor: "hover:bg-green-500/10",
    confirmTitle: "Start Server",
    confirmMessage:
      "This will start the Minecraft server. It may take up to 30 seconds to fully initialize.",
    minRole: "operator",
    requiresOffline: true,
  },
  stop: {
    label: "Stop",
    icon: Icons.Square,
    color: "text-red-500",
    hoverColor: "hover:bg-red-500/10",
    confirmTitle: "Stop Server",
    confirmMessage:
      "This will gracefully shut down the server. All online players will be disconnected.",
    minRole: "operator",
    requiresOnline: true,
  },
  restart: {
    label: "Restart",
    icon: Icons.RefreshCw,
    color: "text-amber-500",
    hoverColor: "hover:bg-amber-500/10",
    confirmTitle: "Restart Server",
    confirmMessage:
      "The server will be stopped and started again. This takes approximately 30 seconds. All players will be temporarily disconnected.",
    minRole: "operator",
    requiresOnline: true,
  },
  kill: {
    label: "Kill",
    icon: Icons.Zap,
    color: "text-red-600",
    hoverColor: "hover:bg-red-600/10",
    confirmTitle: "Force Kill Server",
    confirmMessage:
      "This will forcefully terminate the server process. Only use if the server is unresponsive. Data loss may occur.",
    minRole: "admin",
    requiresOnline: true,
  },
};

export function McServerControls() {
  const { serverId, userRole } = useMcContext();
  const { status, mutate } = useMcStatus(serverId);
  const [pending, setPending] = useState<ControlAction | null>(null);
  const [confirming, setConfirming] = useState<ControlAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOnline = status?.running === true;

  const executeAction = useCallback(
    async (action: ControlAction) => {
      setPending(action);
      setConfirming(null);
      setError(null);

      try {
        const res = await fetch("/api/gamehub/minecraft/server/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serverId, action }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(data.error || `Failed to ${action} server`);
        }

        // Poll status more frequently for a bit
        const interval = setInterval(() => mutate(), 3000);
        setTimeout(() => clearInterval(interval), 30000);
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setPending(null);
      }
    },
    [serverId, mutate]
  );

  if (!hasMinRole(userRole, "operator")) return null;

  const visibleActions = (Object.keys(ACTIONS) as ControlAction[]).filter(
    (action) => {
      const config = ACTIONS[action];
      return hasMinRole(userRole, config.minRole);
    }
  );

  return (
    <>
      <div className="flex items-center gap-1.5">
        {visibleActions.map((action) => {
          const config = ACTIONS[action];
          const disabled =
            pending !== null ||
            (config.requiresOnline && !isOnline) ||
            (config.requiresOffline && isOnline);

          return (
            <button
              key={action}
              onClick={() => setConfirming(action)}
              disabled={disabled}
              title={config.label}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border transition-colors",
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : `${config.color} ${config.hoverColor}`
              )}
            >
              {pending === action ? (
                <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <config.icon className="h-3.5 w-3.5" />
              )}
              {config.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirming && (
        <ConfirmDialog
          action={confirming}
          config={ACTIONS[confirming]}
          onConfirm={() => executeAction(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}

function ConfirmDialog({
  action,
  config,
  onConfirm,
  onCancel,
}: {
  action: ControlAction;
  config: ActionConfig;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {config.confirmTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {config.confirmMessage}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              action === "kill"
                ? "bg-red-600 text-white hover:bg-red-700"
                : action === "stop"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : action === "restart"
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            <config.icon className="h-4 w-4" />
            {config.label}
          </button>
        </div>
      </div>
    </div>
  );
}
