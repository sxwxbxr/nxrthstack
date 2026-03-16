"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMcContext } from "@/components/minecraft/mc-context";
import {
  useMcSchedule,
  cancelSchedule,
  type ScheduledSession,
} from "@/hooks/use-mc-schedule";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { McScheduleForm } from "@/components/minecraft/mc-schedule-form";
import { FadeIn } from "@/components/ui/fade-in";

type TabValue = "upcoming" | "history";

function getTimeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "now";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-blue-500/10 text-blue-500",
    active: "bg-green-500/10 text-green-500",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-red-500/10 text-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        styles[status] ?? styles.pending
      )}
    >
      {status}
    </span>
  );
}

function ScheduleCard({
  schedule,
  onCancel,
  canManage,
}: {
  schedule: ScheduledSession;
  onCancel: () => void;
  canManage: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Cancel this scheduled session?")) return;
    setCancelling(true);
    try {
      await cancelSchedule(schedule.id);
      onCancel();
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  const startDate = new Date(schedule.scheduledAt);
  const endDate = new Date(schedule.endTime);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {schedule.title}
            </h3>
            <StatusBadge status={schedule.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            {startDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            —{" "}
            {endDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {schedule.status === "pending" && (
            <p className="text-xs text-primary mt-1">
              {getTimeUntil(schedule.scheduledAt)}
            </p>
          )}
          {schedule.createdBy.name && (
            <p className="text-xs text-muted-foreground mt-1">
              by {schedule.createdBy.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            title="Show actions"
          >
            <Icons.ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showActions && "rotate-180"
              )}
            />
          </button>
          {canManage && schedule.status === "pending" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive disabled:opacity-50"
              title="Cancel"
            >
              {cancelling ? (
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Scheduled Actions
          </p>
          {schedule.actions.map((action) => (
            <div
              key={action.id}
              className="flex items-center gap-2 text-xs text-foreground"
            >
              <span className="font-mono text-muted-foreground w-16">
                {new Date(action.scheduledAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  action.status === "executed"
                    ? "bg-green-500"
                    : action.status === "failed"
                      ? "bg-red-500"
                      : action.status === "cancelled"
                        ? "bg-muted-foreground"
                        : "bg-blue-500"
                )}
              />
              <span className="flex-1">
                {action.action === "rcon_command"
                  ? "Send warning"
                  : action.action}
              </span>
              <span className="text-muted-foreground">{action.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function McScheduler() {
  const { serverId, userRole } = useMcContext();
  const { schedules, isLoading, mutate } = useMcSchedule(serverId);
  const [tab, setTab] = useState<TabValue>("upcoming");
  const [showForm, setShowForm] = useState(false);

  const canManage = hasMinRole(userRole, "operator");

  const upcomingSchedules = schedules.filter(
    (s) => s.status === "pending" || s.status === "active"
  );
  const pastSchedules = schedules.filter(
    (s) => s.status === "completed" || s.status === "cancelled"
  );

  const displayedSchedules =
    tab === "upcoming" ? upcomingSchedules : pastSchedules;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Session Scheduler
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTab("upcoming")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "upcoming"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Upcoming ({upcomingSchedules.length})
              </button>
              <button
                onClick={() => setTab("history")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "history"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                History ({pastSchedules.length})
              </button>
            </div>
            {canManage && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
              >
                <Icons.Plus className="h-4 w-4" />
                Schedule
              </button>
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        {displayedSchedules.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Icons.Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {tab === "upcoming"
                ? "No upcoming sessions scheduled."
                : "No past sessions."}
            </p>
            {tab === "upcoming" && canManage && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Schedule a session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onCancel={() => mutate()}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </FadeIn>

      {showForm && (
        <McScheduleForm
          serverId={serverId}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
