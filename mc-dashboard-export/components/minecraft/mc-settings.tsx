"use client";

import { useMcContext } from "@/components/minecraft/mc-context";
import { useMcPreferences } from "@/hooks/use-mc-preferences";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "gamehub",
    name: "GameHub",
    description: "Default purple accent",
    preview: "bg-purple-500",
  },
  {
    id: "minecraft",
    name: "Minecraft",
    description: "Emerald green accent",
    preview: "bg-emerald-500",
  },
  {
    id: "nether",
    name: "Nether",
    description: "Lava orange-red",
    preview: "bg-orange-600",
  },
  {
    id: "end",
    name: "End",
    description: "Deep purple",
    preview: "bg-violet-700",
  },
];

export function McSettings() {
  const { serverId } = useMcContext();
  const { preferences, isLoading, updatePreferences } =
    useMcPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Theme */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => updatePreferences({ theme: theme.id })}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors text-left",
                preferences.theme === theme.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <span
                className={cn("h-6 w-6 rounded-full shrink-0", theme.preview)}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {theme.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {theme.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Console settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Console</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={18}
                value={preferences.consoleFontSize}
                onChange={(e) =>
                  updatePreferences({
                    consoleFontSize: Number(e.target.value),
                  })
                }
                className="w-24 accent-primary"
              />
              <span className="text-sm text-foreground w-8 text-right">
                {preferences.consoleFontSize}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              Show Timestamps
            </label>
            <button
              onClick={() =>
                updatePreferences({
                  consoleTimestamps: !preferences.consoleTimestamps,
                })
              }
              className={cn(
                "rounded-full w-10 h-5 transition-colors relative",
                preferences.consoleTimestamps ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  preferences.consoleTimestamps
                    ? "translate-x-5"
                    : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Layout reset */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Layout</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Reset all widget positions to their defaults.
        </p>
        <button
          onClick={async () => {
            if (confirm("Reset all layouts to defaults?")) {
              await fetch("/api/gamehub/minecraft/server/layout", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serverId,
                  page: "overview",
                  layout: null,
                }),
              });
            }
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Reset Layouts
        </button>
      </div>
    </div>
  );
}
