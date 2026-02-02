"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import type { RivalryWithDetails } from "@/lib/gamehub/rivalries";

interface RivalryCardProps {
  rivalry: RivalryWithDetails;
  currentUserId: string;
}

export function RivalryCard({ rivalry, currentUserId }: RivalryCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isChallenger = rivalry.challengerId === currentUserId;
  const isPending = rivalry.status === "pending";
  const isActive = rivalry.status === "active";
  const canAccept = isPending && !isChallenger;

  const opponent = isChallenger
    ? {
        id: rivalry.opponentId,
        name: rivalry.opponentName,
        email: rivalry.opponentEmail,
        avatar: rivalry.opponentAvatar,
      }
    : {
        id: rivalry.challengerId,
        name: rivalry.challengerName,
        email: rivalry.challengerEmail,
        avatar: rivalry.challengerAvatar,
      };

  const myStats = rivalry.myStats;
  const opponentStats = rivalry.opponentStats;

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gamehub/rivalries/${rivalry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error accepting rivalry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gamehub/rivalries/${rivalry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error declining rivalry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine who's winning
  const myWins = myStats?.wins || 0;
  const opponentWins = opponentStats?.wins || 0;
  const isWinning = myWins > opponentWins;
  const isLosing = myWins < opponentWins;
  const isTied = myWins === opponentWins && rivalry.totalMatches > 0;

  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-colors ${
        isPending
          ? "border-yellow-500/30"
          : isActive
          ? "border-purple-500/30 hover:border-purple-500/50"
          : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icons.Swords className="h-5 w-5 text-purple-500" />
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              isPending
                ? "bg-yellow-500/10 text-yellow-500"
                : isActive
                ? "bg-purple-500/10 text-purple-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isPending ? "Pending" : isActive ? "Active" : "Ended"}
          </span>
        </div>
        {isActive && (
          <Link
            href={`/dashboard/gamehub/rivalries/${rivalry.id}`}
            className="text-xs text-primary hover:underline"
          >
            View Details
          </Link>
        )}
      </div>

      {/* VS Display */}
      <div className="flex items-center justify-between gap-4">
        {/* You */}
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground mb-1">You</p>
          <div
            className={`text-3xl font-bold ${
              isWinning ? "text-green-500" : isLosing ? "text-red-500" : "text-foreground"
            }`}
          >
            {myWins}
          </div>
          <p className="text-xs text-muted-foreground mt-1">wins</p>
          {myStats && myStats.currentStreak > 0 && (
            <p className="text-xs text-green-500 mt-1 flex items-center justify-center gap-1">
              <Icons.Flame className="h-3 w-3" />
              {myStats.currentStreak} streak
            </p>
          )}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-muted-foreground">VS</span>
          {rivalry.totalMatches > 0 && (
            <span className="text-xs text-muted-foreground">
              {rivalry.totalMatches} games
            </span>
          )}
        </div>

        {/* Opponent */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {opponent.avatar ? (
              <img
                src={opponent.avatar}
                alt={opponent.name || "Opponent"}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(opponent.name || opponent.email)[0].toUpperCase()}
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate max-w-[80px]">
              {opponent.name || opponent.email}
            </p>
          </div>
          <div
            className={`text-3xl font-bold ${
              isLosing ? "text-green-500" : isWinning ? "text-red-500" : "text-foreground"
            }`}
          >
            {opponentWins}
          </div>
          <p className="text-xs text-muted-foreground mt-1">wins</p>
          {opponentStats && opponentStats.currentStreak > 0 && (
            <p className="text-xs text-orange-500 mt-1 flex items-center justify-center gap-1">
              <Icons.Flame className="h-3 w-3" />
              {opponentStats.currentStreak} streak
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {canAccept && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Check className="h-4 w-4" />
            )}
            Accept
          </button>
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <Icons.X className="h-4 w-4" />
            Decline
          </button>
        </div>
      )}

      {isPending && isChallenger && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-center text-muted-foreground">
            Waiting for {opponent.name || opponent.email} to accept...
          </p>
        </div>
      )}

      {isActive && (
        <div className="mt-4 pt-4 border-t border-border">
          <Link
            href={`/dashboard/gamehub/rivalries/${rivalry.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            <Icons.Plus className="h-4 w-4" />
            Record Match
          </Link>
        </div>
      )}
    </div>
  );
}
