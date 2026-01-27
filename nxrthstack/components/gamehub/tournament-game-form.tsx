"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface Match {
  id: string;
  player1Score: number;
  player2Score: number;
  player1: { id: string; name: string | null; email: string } | null;
  player2: { id: string; name: string | null; email: string } | null;
  games: {
    id: string;
    gameNumber: number;
    winnerId: string | null;
  }[];
}

interface TournamentGameFormProps {
  tournamentId: string;
  match: Match;
  bestOf: number;
  trackKills: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const R6_MAPS = [
  "Bank",
  "Border",
  "Chalet",
  "Clubhouse",
  "Coastline",
  "Consulate",
  "Kafe Dostoyevsky",
  "Kanal",
  "Nighthaven Labs",
  "Oregon",
  "Outback",
  "Skyscraper",
  "Theme Park",
  "Villa",
];

export function TournamentGameForm({
  tournamentId,
  match,
  bestOf,
  trackKills,
  onSuccess,
  onCancel,
}: TournamentGameFormProps) {
  const [winnerId, setWinnerId] = useState<string>("");
  const [player1Kills, setPlayer1Kills] = useState("");
  const [player1Deaths, setPlayer1Deaths] = useState("");
  const [player2Kills, setPlayer2Kills] = useState("");
  const [player2Deaths, setPlayer2Deaths] = useState("");
  const [player1RoundsWon, setPlayer1RoundsWon] = useState("");
  const [player2RoundsWon, setPlayer2RoundsWon] = useState("");
  const [mapPlayed, setMapPlayed] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameNumber = match.games.length + 1;
  const gamesNeeded = Math.ceil(bestOf / 2);

  const player1Name = match.player1?.name || match.player1?.email || "Player 1";
  const player2Name = match.player2?.name || match.player2?.email || "Player 2";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamehub/r6/tournaments/${tournamentId}/matches/${match.id}/games`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winnerId,
            player1Kills: player1Kills ? parseInt(player1Kills) : undefined,
            player1Deaths: player1Deaths ? parseInt(player1Deaths) : undefined,
            player2Kills: player2Kills ? parseInt(player2Kills) : undefined,
            player2Deaths: player2Deaths ? parseInt(player2Deaths) : undefined,
            player1RoundsWon: player1RoundsWon
              ? parseInt(player1RoundsWon)
              : undefined,
            player2RoundsWon: player2RoundsWon
              ? parseInt(player2RoundsWon)
              : undefined,
            mapPlayed: mapPlayed || undefined,
            notes: notes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record game");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record game");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Game Info */}
      <div className="text-center pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Game {gameNumber} of {bestOf}
        </p>
        <p className="text-lg font-semibold text-foreground">
          {player1Name}{" "}
          <span className="text-primary">
            {match.player1Score} - {match.player2Score}
          </span>{" "}
          {player2Name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          First to {gamesNeeded} wins the match
        </p>
      </div>

      {/* Winner Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Who won this game?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setWinnerId(match.player1?.id || "")}
            className={`rounded-lg border p-4 text-center transition-all ${
              winnerId === match.player1?.id
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                : "border-border bg-background text-foreground hover:border-cyan-500/50"
            }`}
          >
            <Icons.User className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium truncate">{player1Name}</p>
          </button>
          <button
            type="button"
            onClick={() => setWinnerId(match.player2?.id || "")}
            className={`rounded-lg border p-4 text-center transition-all ${
              winnerId === match.player2?.id
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-border bg-background text-foreground hover:border-orange-500/50"
            }`}
          >
            <Icons.User className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium truncate">{player2Name}</p>
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
              {player1Name}
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={player1RoundsWon}
              onChange={(e) => setPlayer1RoundsWon(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground text-center text-lg font-semibold focus:border-primary focus:outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {player2Name}
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={player2RoundsWon}
              onChange={(e) => setPlayer2RoundsWon(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground text-center text-lg font-semibold focus:border-primary focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* K/D Stats */}
      {trackKills && (
        <div className="p-4 rounded-lg border border-border bg-background">
          <p className="text-sm font-medium text-foreground mb-3">
            K/D Stats (Optional)
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">{player1Name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Kills</label>
                  <input
                    type="number"
                    min="0"
                    value={player1Kills}
                    onChange={(e) => setPlayer1Kills(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1 text-foreground text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deaths</label>
                  <input
                    type="number"
                    min="0"
                    value={player1Deaths}
                    onChange={(e) => setPlayer1Deaths(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1 text-foreground text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">{player2Name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Kills</label>
                  <input
                    type="number"
                    min="0"
                    value={player2Kills}
                    onChange={(e) => setPlayer2Kills(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1 text-foreground text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deaths</label>
                  <input
                    type="number"
                    min="0"
                    value={player2Deaths}
                    onChange={(e) => setPlayer2Deaths(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1 text-foreground text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Map Played (Optional)
        </label>
        <select
          value={mapPlayed}
          onChange={(e) => setMapPlayed(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Select a map...</option>
          {R6_MAPS.map((map) => (
            <option key={map} value={map}>
              {map}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this game..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
          rows={2}
          maxLength={500}
        />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <ShimmerButton
          type="submit"
          disabled={isLoading || !winnerId}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Icons.Check className="h-4 w-4 mr-2" />
              Record Game
            </>
          )}
        </ShimmerButton>
      </div>
    </form>
  );
}
