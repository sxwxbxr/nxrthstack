"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface RecordMatchFormProps {
  lobbyId: string;
  hostId: string;
  hostName: string;
  opponentId: string;
  opponentName: string;
  trackKills: boolean;
}

export function RecordMatchForm({
  lobbyId,
  hostId,
  hostName,
  opponentId,
  opponentName,
  trackKills,
}: RecordMatchFormProps) {
  const router = useRouter();
  const [winnerId, setWinnerId] = useState<string>("");
  const [player1Kills, setPlayer1Kills] = useState<string>("");
  const [player1Deaths, setPlayer1Deaths] = useState<string>("");
  const [player2Kills, setPlayer2Kills] = useState<string>("");
  const [player2Deaths, setPlayer2Deaths] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamehub/r6/lobbies/${lobbyId}/matches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
            player1Kills: player1Kills ? parseInt(player1Kills) : undefined,
            player1Deaths: player1Deaths ? parseInt(player1Deaths) : undefined,
            player2Kills: player2Kills ? parseInt(player2Kills) : undefined,
            player2Deaths: player2Deaths ? parseInt(player2Deaths) : undefined,
            notes: notes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record match");
      }

      // Reset form
      setWinnerId("");
      setPlayer1Kills("");
      setPlayer1Deaths("");
      setPlayer2Kills("");
      setPlayer2Deaths("");
      setNotes("");
      setShowAdvanced(false);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record match");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-4">Record Match</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Winner Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Who won?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWinnerId(hostId)}
              className={`rounded-lg border p-4 text-center transition-all ${
                winnerId === hostId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              <Icons.User className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">{hostName}</p>
            </button>
            <button
              type="button"
              onClick={() => setWinnerId(opponentId)}
              className={`rounded-lg border p-4 text-center transition-all ${
                winnerId === opponentId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              <Icons.User className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">{opponentName}</p>
            </button>
          </div>
        </div>

        {/* K/D Stats (if tracking enabled) */}
        {trackKills && (
          <>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {showAdvanced ? (
                <>
                  <Icons.ChevronDown className="h-4 w-4 rotate-180" />
                  Hide K/D Stats
                </>
              ) : (
                <>
                  <Icons.ChevronDown className="h-4 w-4" />
                  Add K/D Stats (Optional)
                </>
              )}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-background">
                {/* Host Stats */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {hostName}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Kills
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={player1Kills}
                        onChange={(e) => setPlayer1Kills(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Deaths
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={player1Deaths}
                        onChange={(e) => setPlayer1Deaths(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Opponent Stats */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {opponentName}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Kills
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={player2Kills}
                        onChange={(e) => setPlayer2Kills(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Deaths
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={player2Deaths}
                        onChange={(e) => setPlayer2Deaths(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this match..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Submit */}
        <ShimmerButton
          type="submit"
          disabled={isLoading || !winnerId}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Icons.Check className="h-4 w-4 mr-2" />
              Record Match
            </>
          )}
        </ShimmerButton>
      </form>
    </div>
  );
}
