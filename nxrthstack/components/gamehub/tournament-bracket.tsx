"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { TournamentGameForm } from "./tournament-game-form";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  status: string;
  player1Score: number;
  player2Score: number;
  player1: { id: string; name: string | null; email: string } | null;
  player2: { id: string; name: string | null; email: string } | null;
  winner: { id: string; name: string | null; email: string } | null;
  games: {
    id: string;
    gameNumber: number;
    winnerId: string | null;
    player1Kills: number | null;
    player1Deaths: number | null;
    player2Kills: number | null;
    player2Deaths: number | null;
    player1RoundsWon: number | null;
    player2RoundsWon: number | null;
  }[];
}

interface TournamentBracketProps {
  tournament: {
    id: string;
    status: string;
    bestOf: number;
    trackKills: boolean;
  };
  matches: Match[];
  totalRounds: number;
  currentUserId: string;
  isHost: boolean;
}

export function TournamentBracket({
  tournament,
  matches,
  totalRounds,
  currentUserId,
  isHost,
}: TournamentBracketProps) {
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {};
  for (let i = 1; i <= totalRounds; i++) {
    matchesByRound[i] = matches
      .filter((m) => m.round === i)
      .sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const getRoundName = (round: number) => {
    const roundsFromFinal = totalRounds - round;
    if (roundsFromFinal === 0) return "Finals";
    if (roundsFromFinal === 1) return "Semifinals";
    if (roundsFromFinal === 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  const canRecordGame = (match: Match) => {
    if (tournament.status !== "in_progress") return false;
    if (match.status === "completed" || match.status === "bye") return false;
    if (!match.player1 || !match.player2) return false;

    // Host can always record, or if you're in the match
    const isInMatch =
      match.player1?.id === currentUserId ||
      match.player2?.id === currentUserId;

    return isHost || isInMatch;
  };

  const handleGameRecorded = () => {
    setSelectedMatch(null);
    router.refresh();
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max py-4">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
          <div key={round} className="flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              {getRoundName(round)}
            </h3>
            <div
              className="flex flex-col justify-around flex-1 gap-4"
              style={{
                minHeight: `${Math.pow(2, totalRounds - round) * 100}px`,
              }}
            >
              {matchesByRound[round]?.map((match) => (
                <div
                  key={match.id}
                  className={`relative w-64 rounded-lg border ${
                    match.status === "completed"
                      ? "border-muted bg-muted/20"
                      : match.status === "in_progress"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                  }`}
                >
                  {/* Match Header */}
                  <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Match {match.matchNumber}
                    </span>
                    <span className="text-xs font-medium">
                      {match.player1Score} - {match.player2Score}
                    </span>
                  </div>

                  {/* Player 1 */}
                  <div
                    className={`px-3 py-2 flex items-center justify-between border-b border-border ${
                      match.winner?.id === match.player1?.id
                        ? "bg-green-500/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {match.winner?.id === match.player1?.id && (
                        <Icons.Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm truncate ${
                          match.player1
                            ? "text-foreground"
                            : "text-muted-foreground italic"
                        }`}
                      >
                        {match.player1?.name ||
                          match.player1?.email ||
                          "TBD"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground ml-2">
                      {match.player1Score}
                    </span>
                  </div>

                  {/* Player 2 */}
                  <div
                    className={`px-3 py-2 flex items-center justify-between ${
                      match.winner?.id === match.player2?.id
                        ? "bg-green-500/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {match.winner?.id === match.player2?.id && (
                        <Icons.Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm truncate ${
                          match.player2
                            ? "text-foreground"
                            : "text-muted-foreground italic"
                        }`}
                      >
                        {match.player2?.name ||
                          match.player2?.email ||
                          "TBD"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground ml-2">
                      {match.player2Score}
                    </span>
                  </div>

                  {/* Record Game Button */}
                  {canRecordGame(match) && (
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 border-t border-border transition-colors"
                    >
                      <Icons.Plus className="h-3 w-3 inline mr-1" />
                      Record Game
                    </button>
                  )}

                  {/* Games Summary */}
                  {match.games.length > 0 && (
                    <div className="px-3 py-2 border-t border-border">
                      <div className="flex gap-1">
                        {match.games.map((game) => (
                          <div
                            key={game.id}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                              game.winnerId === match.player1?.id
                                ? "bg-cyan-500/20 text-cyan-500"
                                : "bg-orange-500/20 text-orange-500"
                            }`}
                            title={`Game ${game.gameNumber}: ${
                              game.winnerId === match.player1?.id
                                ? match.player1?.name || "P1"
                                : match.player2?.name || "P2"
                            } won`}
                          >
                            {game.gameNumber}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Record Game Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Record Game
              </h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icons.Close className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <TournamentGameForm
                tournamentId={tournament.id}
                match={selectedMatch}
                bestOf={tournament.bestOf}
                trackKills={tournament.trackKills}
                onSuccess={handleGameRecorded}
                onCancel={() => setSelectedMatch(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
