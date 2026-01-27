"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const TOURNAMENT_SIZES = [4, 8, 16, 32];
const BEST_OF_OPTIONS = [1, 3, 5];

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState(8);
  const [format, setFormat] = useState<"single_elimination" | "double_elimination">(
    "single_elimination"
  );
  const [trackKills, setTrackKills] = useState(true);
  const [bestOf, setBestOf] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gamehub/r6/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          size,
          format,
          trackKills,
          bestOf,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tournament");
      }

      router.push(`/dashboard/gamehub/r6/tournaments/${data.tournament.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Tournament Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Tournament Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekend Championship"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={100}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for your tournament..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Tournament Size */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tournament Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TOURNAMENT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-lg border p-3 text-center transition-all ${
                  size === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                <p className="text-2xl font-bold">{s}</p>
                <p className="text-xs text-muted-foreground">players</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat("single_elimination")}
              className={`rounded-lg border p-4 text-left transition-all ${
                format === "single_elimination"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <p className="font-medium text-foreground">Single Elimination</p>
              <p className="text-sm text-muted-foreground">
                Lose once and you're out
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormat("double_elimination")}
              disabled
              className="rounded-lg border border-border bg-background p-4 text-left opacity-50 cursor-not-allowed"
            >
              <p className="font-medium text-foreground">Double Elimination</p>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </button>
          </div>
        </div>

        {/* Best Of */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Match Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BEST_OF_OPTIONS.map((bo) => (
              <button
                key={bo}
                type="button"
                onClick={() => setBestOf(bo)}
                className={`rounded-lg border p-3 text-center transition-all ${
                  bestOf === bo
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                <p className="text-lg font-bold">Bo{bo}</p>
                <p className="text-xs text-muted-foreground">
                  {bo === 1
                    ? "Single game"
                    : `First to ${Math.ceil(bo / 2)}`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Track Kills */}
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
              className="text-sm font-medium text-foreground cursor-pointer"
              onClick={() => setTrackKills(!trackKills)}
            >
              Track Kills & Deaths
            </label>
            <p className="text-xs text-muted-foreground">
              Enable detailed K/D statistics for each game in the tournament
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
              Create Tournament
            </>
          )}
        </ShimmerButton>
      </div>
    </form>
  );
}
