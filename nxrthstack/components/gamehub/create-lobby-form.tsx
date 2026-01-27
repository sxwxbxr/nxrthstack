"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function CreateLobbyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trackKills, setTrackKills] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gamehub/r6/lobbies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          trackKills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lobby");
      }

      router.push(`/dashboard/gamehub/r6/1v1/${data.lobby.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lobby");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Lobby Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Lobby Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekend Warriors"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={100}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Give your lobby a memorable name
          </p>
        </div>

        {/* Track Kills Option */}
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setTrackKills(!trackKills)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                trackKills ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={trackKills}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  trackKills ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div>
            <label
              htmlFor="trackKills"
              className="text-sm font-medium text-foreground cursor-pointer"
              onClick={() => setTrackKills(!trackKills)}
            >
              Track Kills & Deaths
            </label>
            <p className="text-xs text-muted-foreground">
              Enable detailed statistics including K/D tracking for each match.
              You can upload scoreboard screenshots for automatic parsing.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <ShimmerButton type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? (
            <>
              <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Icons.Plus className="h-4 w-4 mr-2" />
              Create Lobby
            </>
          )}
        </ShimmerButton>
      </div>
    </form>
  );
}
