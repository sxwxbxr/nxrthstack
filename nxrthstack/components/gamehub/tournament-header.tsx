"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { GradientText } from "@/components/ui/gradient-text";

interface TournamentHeaderProps {
  tournament: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    size: number;
    format: string;
    bestOf: number;
    inviteCode: string;
    trackKills: boolean;
    createdAt: Date;
    participants: { id: string; userId: string }[];
  };
  isHost: boolean;
  currentUserId: string;
}

export function TournamentHeader({
  tournament,
  isHost,
  currentUserId,
}: TournamentHeaderProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canStart =
    tournament.status === "registration" &&
    tournament.participants.length >= 2 &&
    isHost;

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(tournament.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamehub/r6/tournaments/${tournament.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start tournament");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start tournament");
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamehub/r6/tournaments/${tournament.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete tournament");
      }

      router.push("/dashboard/gamehub/r6/tournaments");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tournament");
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (tournament.status) {
      case "registration":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500">
            <Icons.Users className="h-4 w-4" />
            Registration Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
            <Icons.Zap className="h-4 w-4" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            <Icons.CheckCircle className="h-4 w-4" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              <GradientText>{tournament.name}</GradientText>
            </h1>
            {getStatusBadge()}
          </div>
          {tournament.description && (
            <p className="text-muted-foreground mb-2">
              {tournament.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {tournament.format === "single_elimination"
                ? "Single Elimination"
                : "Double Elimination"}
            </span>
            <span>•</span>
            <span>Bo{tournament.bestOf}</span>
            <span>•</span>
            <span>{tournament.size} Players Max</span>
            {tournament.trackKills && (
              <>
                <span>•</span>
                <span className="text-primary">K/D Tracking</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tournament.status === "registration" && (
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              {copied ? (
                <>
                  <Icons.Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="h-4 w-4" />
                  {tournament.inviteCode}
                </>
              )}
            </button>
          )}

          {canStart && (
            <ShimmerButton onClick={handleStart} disabled={isStarting}>
              {isStarting ? (
                <>
                  <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Icons.Zap className="h-4 w-4 mr-2" />
                  Start Tournament
                </>
              )}
            </ShimmerButton>
          )}

          {isHost && tournament.status === "registration" && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Icons.Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-border bg-card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Tournament?
            </h3>
            <p className="text-muted-foreground mb-4">
              This will permanently delete the tournament and all match data.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
