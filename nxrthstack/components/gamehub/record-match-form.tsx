"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ScreenshotParser } from "./screenshot-parser";
import type { ParsedMatchData } from "@/lib/r6/screenshot-parser";

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
  const [player1RoundsWon, setPlayer1RoundsWon] = useState<string>("");
  const [player2RoundsWon, setPlayer2RoundsWon] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(trackKills); // Show by default when K/D tracking enabled
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Handle parsed screenshot data
  const handleScreenshotParsed = useCallback(
    (data: ParsedMatchData) => {
      let filled = false;

      // Auto-fill winner if detected
      if (data.winner) {
        setWinnerId(data.winner === "player1" ? hostId : opponentId);
        filled = true;
      }

      // Auto-fill rounds won from team scores
      if (data.team1Score !== null) {
        setPlayer1RoundsWon(data.team1Score.toString());
        filled = true;
      }
      if (data.team2Score !== null) {
        setPlayer2RoundsWon(data.team2Score.toString());
        filled = true;
      }

      // Auto-fill K/D stats if tracking enabled and detected
      if (trackKills) {
        if (data.player1.kills !== null) {
          setPlayer1Kills(data.player1.kills.toString());
          filled = true;
        }
        if (data.player1.deaths !== null) {
          setPlayer1Deaths(data.player1.deaths.toString());
          filled = true;
        }
        if (data.player2.kills !== null) {
          setPlayer2Kills(data.player2.kills.toString());
          filled = true;
        }
        if (data.player2.deaths !== null) {
          setPlayer2Deaths(data.player2.deaths.toString());
          filled = true;
        }

        // Show advanced section if we filled stats
        if (
          data.player1.kills !== null ||
          data.player1.deaths !== null ||
          data.player2.kills !== null ||
          data.player2.deaths !== null
        ) {
          setShowAdvanced(true);
        }
      }

      setAutoFilled(filled);
    },
    [hostId, opponentId, trackKills]
  );

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
            player1RoundsWon: player1RoundsWon ? parseInt(player1RoundsWon) : undefined,
            player2RoundsWon: player2RoundsWon ? parseInt(player2RoundsWon) : undefined,
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
      setPlayer1RoundsWon("");
      setPlayer2RoundsWon("");
      setNotes("");
      setShowAdvanced(false);
      setShowScreenshot(false);
      setAutoFilled(false);

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
        {/* Screenshot Parser Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowScreenshot(!showScreenshot)}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Icons.Image className="h-4 w-4" />
            {showScreenshot ? "Hide Screenshot Parser" : "Parse from Screenshot (Beta)"}
          </button>

          {showScreenshot && (
            <div className="mt-3">
              <ScreenshotParser
                hostName={hostName}
                opponentName={opponentName}
                onParsed={handleScreenshotParsed}
                disabled={isLoading}
              />
              {autoFilled && (
                <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                  <Icons.CheckCircle className="h-3 w-3" />
                  Form auto-filled from screenshot. Please verify before submitting.
                </p>
              )}
            </div>
          )}
        </div>

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

        {/* Round Score */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Round Score (Optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {hostName}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={player1RoundsWon}
                onChange={(e) => setPlayer1RoundsWon(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground text-center text-lg font-semibold focus:border-primary focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {opponentName}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={player2RoundsWon}
                onChange={(e) => setPlayer2RoundsWon(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground text-center text-lg font-semibold focus:border-primary focus:outline-none"
                placeholder="0"
              />
            </div>
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
