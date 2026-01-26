"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";

interface LobbyActionsProps {
  lobby: {
    id: string;
    status: string;
    hostId: string;
    opponentId: string | null;
    deletionRequestedBy: string | null;
  };
  currentUserId: string;
  isHost: boolean;
}

export function LobbyActions({ lobby, currentUserId, isHost }: LobbyActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine deletion state
  const hasOpponent = !!lobby.opponentId;
  const deletionRequestedByMe = lobby.deletionRequestedBy === currentUserId;
  const deletionRequestedByOther = lobby.deletionRequestedBy && lobby.deletionRequestedBy !== currentUserId;
  const canDeleteDirectly = !hasOpponent && isHost;

  async function handleComplete() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gamehub/r6/lobbies/${lobby.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete lobby");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete lobby");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestDeletion() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gamehub/r6/lobbies/${lobby.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestDeletion: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to request deletion");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request deletion");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gamehub/r6/lobbies/${lobby.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestDeletion: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel deletion request");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel deletion request");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmDeletion() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gamehub/r6/lobbies/${lobby.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete lobby");
      }

      router.push("/dashboard/gamehub/r6/1v1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lobby");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDirectDelete() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gamehub/r6/lobbies/${lobby.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete lobby");
      }

      router.push("/dashboard/gamehub/r6/1v1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lobby");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mark Complete (host only, active lobbies) */}
        {isHost && lobby.status === "active" && (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            <Icons.Check className="h-4 w-4" />
            Mark Complete
          </button>
        )}

        {/* Deletion Actions */}
        {canDeleteDirectly ? (
          // Direct delete for empty lobbies
          <button
            onClick={handleDirectDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Trash2 className="h-4 w-4" />
            )}
            Delete Lobby
          </button>
        ) : deletionRequestedByMe ? (
          // Current user requested deletion - show cancel option
          <button
            onClick={handleCancelDeletion}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-500 hover:bg-yellow-500/20 disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Close className="h-4 w-4" />
            )}
            Cancel Deletion Request
          </button>
        ) : deletionRequestedByOther ? (
          // Other user requested deletion - show confirm option
          <button
            onClick={handleConfirmDeletion}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Trash2 className="h-4 w-4" />
            )}
            Confirm Delete (Other player requested)
          </button>
        ) : hasOpponent ? (
          // No deletion request yet - show request option
          <button
            onClick={handleRequestDeletion}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Trash2 className="h-4 w-4" />
            )}
            Request Deletion
          </button>
        ) : null}
      </div>

      {/* Status message for pending deletion */}
      {deletionRequestedByMe && (
        <p className="text-sm text-yellow-500">
          Deletion requested. Waiting for the other player to confirm.
        </p>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
