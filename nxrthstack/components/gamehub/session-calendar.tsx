"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/icons";
import { GAME_OPTIONS } from "@/lib/gamehub/sessions-constants";

interface CalendarEntry {
  id: string;
  title: string;
  game: string;
  startTime: Date;
  endTime: Date;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
}

interface SessionCalendarProps {
  entries: CalendarEntry[];
  currentUserId: string;
  currentUserName: string | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SessionCalendar({ entries, currentUserId, currentUserName }: SessionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("week");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);

  // Get the start of the current week (Sunday)
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay());
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  // Filter entries for current view
  const visibleEntries = useMemo(() => {
    const start = view === "week" ? weekStart : new Date(currentDate.setHours(0, 0, 0, 0));
    const end = new Date(start);
    end.setDate(end.getDate() + (view === "week" ? 7 : 1));

    return entries.filter((entry) => {
      const entryStart = new Date(entry.startTime);
      return entryStart >= start && entryStart < end;
    });
  }, [entries, weekStart, currentDate, view]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (view === "week" ? 7 : 1));
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (view === "week" ? 7 : 1));
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);

    // Don't allow creating entries in the past
    if (slotDate < new Date()) return;

    setSelectedSlot({ date: slotDate, hour });
    setIsCreating(true);
  };

  const getEntryPosition = (entry: CalendarEntry, dayIndex: number) => {
    const startTime = new Date(entry.startTime);
    const endTime = new Date(entry.endTime);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      top: `${startHour * 48}px`, // 48px per hour
      height: `${Math.max(duration * 48, 24)}px`,
    };
  };

  const getGameColor = (game: string) => {
    const colors: Record<string, string> = {
      r6: "bg-orange-500/80 border-orange-400",
      minecraft: "bg-green-500/80 border-green-400",
      pokemon: "bg-yellow-500/80 border-yellow-400",
      valorant: "bg-red-500/80 border-red-400",
      cs2: "bg-blue-500/80 border-blue-400",
      apex: "bg-red-600/80 border-red-500",
      other: "bg-purple-500/80 border-purple-400",
    };
    return colors[game] || colors.other;
  };

  const formatDateHeader = () => {
    if (view === "week") {
      const endOfWeek = new Date(weekStart);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Icons.ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Icons.ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Today
          </button>
          <h2 className="text-lg font-semibold text-foreground ml-2">
            {formatDateHeader()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedSlot({ date: new Date(), hour: new Date().getHours() + 1 });
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Icons.Plus className="h-4 w-4" />
            Add Session
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border border-border rounded-xl overflow-hidden bg-card flex flex-col">
        {/* Day Headers - Fixed */}
        <div className="flex border-b border-border flex-shrink-0">
          <div className="w-16 flex-shrink-0 border-r border-border bg-muted/30 h-10" />
          <div className={`flex-1 grid ${view === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
            {(view === "week" ? weekDays : [currentDate]).map((day, dayIndex) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={dayIndex}
                  className={`h-10 border-r border-border last:border-r-0 flex flex-col items-center justify-center ${
                    isToday ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{DAYS[day.getDay()]}</span>
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0 border-r border-border bg-muted/30">
              <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-b border-border/50 text-xs text-muted-foreground px-2 flex items-start pt-1"
                >
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </div>
              ))}
            </div>
          </div>

          {/* Days Grid */}
          <div className={`flex-1 grid ${view === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
            {(view === "week" ? weekDays : [currentDate]).map((day, dayIndex) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEntries = visibleEntries.filter(
                (e) => new Date(e.startTime).toDateString() === day.toDateString()
              );

              return (
                <div key={dayIndex} className="border-r border-border last:border-r-0 relative">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleSlotClick(day, hour)}
                        className="h-12 border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                      />
                    ))}

                    {/* Entries */}
                    {dayEntries.map((entry) => {
                      const pos = getEntryPosition(entry, dayIndex);
                      const isOwn = entry.userId === currentUserId;
                      const gameLabel = GAME_OPTIONS.find((g) => g.value === entry.game)?.label || entry.game;

                      return (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          isOwn={isOwn}
                          gameLabel={gameLabel}
                          position={pos}
                          colorClass={getGameColor(entry.game)}
                          onEdit={isOwn ? () => {
                            setEditingEntry(entry);
                          } : undefined}
                        />
                      );
                    })}

                    {/* Current Time Indicator */}
                    {isToday && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none z-10"
                        style={{
                          top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 48}px`,
                        }}
                      >
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* Create Entry Modal */}
      {isCreating && selectedSlot && (
        <CreateEntryModal
          initialDate={selectedSlot.date}
          initialHour={selectedSlot.hour}
          currentUserName={currentUserName}
          onClose={() => {
            setIsCreating(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

function EntryCard({
  entry,
  isOwn,
  gameLabel,
  position,
  colorClass,
  onEdit,
}: {
  entry: CalendarEntry;
  isOwn: boolean;
  gameLabel: string;
  position: { top: string; height: string };
  colorClass: string;
  onEdit?: () => void;
}) {
  return (
    <div
      onClick={onEdit}
      className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs text-white border-l-2 overflow-hidden transition-opacity ${colorClass} ${
        onEdit ? "cursor-pointer hover:opacity-90" : ""
      }`}
      style={{ top: position.top, height: position.height }}
      title={`${entry.userName || "Unknown"} - ${gameLabel}${isOwn ? " (Click to edit)" : ""}`}
    >
      <div className="flex items-center gap-1">
        <span className="font-medium truncate flex-1">{entry.title || gameLabel}</span>
        {isOwn && <Icons.Pencil className="h-3 w-3 flex-shrink-0 opacity-70" />}
      </div>
      <div className="text-white/80 truncate">
        {new Date(entry.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        {" - "}
        {new Date(entry.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </div>
      <div className="text-white/70 truncate text-[10px]">
        {isOwn ? "You" : entry.userName || "Unknown"}
      </div>
    </div>
  );
}

function CreateEntryModal({
  initialDate,
  initialHour,
  currentUserName,
  onClose,
}: {
  initialDate: Date;
  initialHour: number;
  currentUserName: string | null;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStartTime = new Date(initialDate);
  defaultStartTime.setHours(initialHour, 0, 0, 0);

  const defaultEndTime = new Date(defaultStartTime);
  defaultEndTime.setHours(defaultEndTime.getHours() + 1);

  const [formData, setFormData] = useState({
    title: "",
    game: "r6",
    date: initialDate.toISOString().split("T")[0],
    startTime: `${initialHour.toString().padStart(2, "0")}:00`,
    endTime: `${((initialHour + 1) % 24).toString().padStart(2, "0")}:00`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      // Handle overnight sessions
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const response = await fetch("/api/gamehub/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || `${currentUserName || "Someone"}'s ${GAME_OPTIONS.find(g => g.value === formData.game)?.label} session`,
          game: formData.game,
          activityType: "casual",
          scheduledAt: startDateTime.toISOString(),
          durationMinutes: Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Schedule Gaming Time</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Ranked grind, Chill session..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Game */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Game
            </label>
            <select
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {GAME_OPTIONS.map((game) => (
                <option key={game.value} value={game.value}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                From
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                To
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
              className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
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
              Add to Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEntryModal({
  entry,
  onClose,
}: {
  entry: CalendarEntry;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = new Date(entry.startTime);
  const endDate = new Date(entry.endTime);

  const [formData, setFormData] = useState({
    title: entry.title,
    game: entry.game,
    date: startDate.toISOString().split("T")[0],
    startTime: `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`,
    endTime: `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const response = await fetch(`/api/gamehub/sessions/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          game: formData.game,
          scheduledAt: startDateTime.toISOString(),
          durationMinutes: Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update session");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/gamehub/sessions/${entry.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete session");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Session</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Session title..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Game
            </label>
            <select
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {GAME_OPTIONS.map((game) => (
                <option key={game.value} value={game.value}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                From
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                To
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.Trash2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
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
                <Icons.Check className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
