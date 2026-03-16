"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { createSchedule } from "@/hooks/use-mc-schedule";

interface McScheduleFormProps {
  serverId: string;
  initialDate?: Date;
  initialHour?: number;
  onClose: () => void;
  onCreated: () => void;
}

export function McScheduleForm({
  serverId,
  initialDate,
  initialHour,
  onClose,
  onCreated,
}: McScheduleFormProps) {
  const now = initialDate ?? new Date();
  const hour = initialHour ?? now.getHours() + 1;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: now.toISOString().split("T")[0],
    startTime: `${hour.toString().padStart(2, "0")}:00`,
    endTime: `${((hour + 2) % 24).toString().padStart(2, "0")}:00`,
    autoStart: true,
    autoStop: true,
    warnings: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(
        `${formData.date}T${formData.startTime}`
      );
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const durationMinutes = Math.round(
        (endDateTime.getTime() - startDateTime.getTime()) / 60000
      );

      await createSchedule({
        serverId,
        title: formData.title || "Minecraft Session",
        scheduledAt: startDateTime.toISOString(),
        durationMinutes,
        autoStart: formData.autoStart,
        autoStop: formData.autoStop,
        warnings: formData.warnings,
      });

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview actions
  const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
  const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  const previewActions: { time: string; label: string }[] = [];
  if (formData.autoStart) {
    const autoStart = new Date(startDateTime.getTime() - 5 * 60000);
    previewActions.push({
      time: autoStart.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: "Server auto-start",
    });
  }
  previewActions.push({
    time: startDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    label: "Session begins",
  });
  if (formData.warnings) {
    const warn5 = new Date(endDateTime.getTime() - 5 * 60000);
    previewActions.push({
      time: warn5.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: 'In-game warning: "5 minutes!"',
    });
    const warn1 = new Date(endDateTime.getTime() - 1 * 60000);
    previewActions.push({
      time: warn1.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: 'In-game warning: "1 minute!"',
    });
  }
  if (formData.autoStop) {
    previewActions.push({
      time: endDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: "Server auto-stop",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Schedule Minecraft Session
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Survival Night, Build Session..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Automation toggles */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Automation</p>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoStart}
                onChange={(e) =>
                  setFormData({ ...formData, autoStart: e.target.checked })
                }
                className="rounded border-border"
              />
              Auto-start server 5 min before session
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoStop}
                onChange={(e) =>
                  setFormData({ ...formData, autoStop: e.target.checked })
                }
                className="rounded border-border"
              />
              Auto-stop server when session ends
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={formData.warnings}
                onChange={(e) =>
                  setFormData({ ...formData, warnings: e.target.checked })
                }
                className="rounded border-border"
              />
              Send in-game shutdown warnings
            </label>
          </div>

          {/* Action preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Action Timeline Preview
            </p>
            <div className="space-y-1">
              {previewActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <span className="text-muted-foreground font-mono w-16">
                    {action.time}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{action.label}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.Calendar className="h-4 w-4" />
              )}
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
