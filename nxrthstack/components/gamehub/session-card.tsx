"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { GAME_OPTIONS, ACTIVITY_OPTIONS, type RsvpStatus } from "@/lib/gamehub/sessions-constants";
import type { SessionWithDetails } from "@/lib/gamehub/sessions";

interface SessionCardProps {
  session: SessionWithDetails;
  isHost?: boolean;
  currentUserId?: string;
}

const RSVP_BUTTONS: { status: RsvpStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { status: "going", label: "Going", icon: Icons.Check, color: "bg-green-500/20 text-green-500 hover:bg-green-500/30" },
  { status: "maybe", label: "Maybe", icon: Icons.HelpCircle, color: "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" },
  { status: "not_going", label: "Can't Go", icon: Icons.X, color: "bg-red-500/20 text-red-500 hover:bg-red-500/30" },
];

export function SessionCard({ session, isHost, currentUserId }: SessionCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | undefined>(session.userRsvp);
  const [isUpdating, setIsUpdating] = useState(false);

  const gameLabel = GAME_OPTIONS.find((g) => g.value === session.game)?.label ?? session.game;
  const activityLabel = ACTIVITY_OPTIONS.find((a) => a.value === session.activityType)?.label;

  const scheduledDate = new Date(session.scheduledAt);
  const isToday = scheduledDate.toDateString() === new Date().toDateString();
  const isTomorrow = scheduledDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const timeLabel = scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const handleRsvp = async (status: RsvpStatus) => {
    if (isUpdating || !currentUserId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/gamehub/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rsvp", status }),
      });

      if (response.ok) {
        setRsvpStatus(status);
      }
    } catch (error) {
      console.error("Failed to update RSVP:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalGoing = session.rsvpCounts.going;
  const spotsLeft = session.maxParticipants ? session.maxParticipants - totalGoing : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {gameLabel}
            </span>
            {activityLabel && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                {activityLabel}
              </span>
            )}
            {isHost && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500">
                Host
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{session.title}</h3>
        </div>
        {session.isPrivate && (
          <Icons.Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {session.description}
        </p>
      )}

      {/* Time & Date */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Icons.Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icons.Clock className="h-4 w-4" />
          <span>{timeLabel}</span>
        </div>
        {session.durationMinutes && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icons.Timer className="h-4 w-4" />
            <span>{session.durationMinutes}min</span>
          </div>
        )}
      </div>

      {/* Host Info */}
      <div className="flex items-center gap-2 mb-3">
        {session.host.discordAvatar ? (
          <img
            src={session.host.discordAvatar}
            alt={session.host.name || "Host"}
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
            {(session.host.name || session.host.discordUsername || "?")[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          Hosted by{" "}
          <span className="text-foreground">
            {session.host.discordUsername || session.host.name || "Unknown"}
          </span>
        </span>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-4 text-sm mb-4">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-green-500">
            <Icons.Check className="h-3.5 w-3.5" />
            <span>{session.rsvpCounts.going}</span>
          </div>
          <span className="text-muted-foreground">going</span>
        </div>
        {session.rsvpCounts.maybe > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-yellow-500">{session.rsvpCounts.maybe}</span>
            <span>maybe</span>
          </div>
        )}
        {spotsLeft !== null && (
          <div className="text-muted-foreground">
            {spotsLeft > 0 ? (
              <span>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
            ) : (
              <span className="text-red-500">Full</span>
            )}
          </div>
        )}
      </div>

      {/* RSVP Buttons */}
      {currentUserId && !isHost && (
        <div className="flex gap-2">
          {RSVP_BUTTONS.map(({ status, label, icon: Icon, color }) => (
            <button
              key={status}
              onClick={() => handleRsvp(status)}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                rsvpStatus === status
                  ? color.replace("hover:", "")
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Host Actions */}
      {isHost && (
        <Link
          href={`/dashboard/gamehub/sessions/${session.id}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
        >
          <Icons.Settings className="h-4 w-4" />
          Manage Session
        </Link>
      )}
    </div>
  );
}
