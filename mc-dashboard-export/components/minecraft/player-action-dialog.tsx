"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface PlayerActionDialogProps {
  action: "kick" | "ban";
  playerName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PlayerActionDialog({
  action,
  playerName,
  onConfirm,
  onCancel,
  loading,
}: PlayerActionDialogProps) {
  const [reason, setReason] = useState("");

  const isBan = action === "ban";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isBan ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
            )}
          >
            {isBan ? (
              <Icons.Shield className="h-5 w-5" />
            ) : (
              <Icons.X className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isBan ? "Ban" : "Kick"} {playerName}?
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBan
                ? "This player will be permanently banned from the server."
                : "This player will be removed from the server."}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isBan
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {loading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : isBan ? (
              "Ban Player"
            ) : (
              "Kick Player"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
