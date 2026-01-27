"use client";

import { Icons } from "@/components/icons";

interface Participant {
  id: string;
  userId: string;
  seed: number | null;
  isEliminated: boolean;
  eliminatedAt: number | null;
  finalPlacement: number | null;
  totalKills: number;
  totalDeaths: number;
  totalRoundsWon: number;
  totalRoundsLost: number;
  matchesWon: number;
  matchesLost: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface TournamentParticipantsProps {
  participants: Participant[];
  hostId: string;
  isHost: boolean;
  tournamentStatus: string;
  trackKills: boolean;
}

export function TournamentParticipants({
  participants,
  hostId,
  isHost,
  tournamentStatus,
  trackKills,
}: TournamentParticipantsProps) {
  // Sort by placement if completed, otherwise by seed
  const sortedParticipants = [...participants].sort((a, b) => {
    if (tournamentStatus === "completed") {
      if (a.finalPlacement && b.finalPlacement) {
        return a.finalPlacement - b.finalPlacement;
      }
      if (a.finalPlacement) return -1;
      if (b.finalPlacement) return 1;
    }
    return (a.seed || 999) - (b.seed || 999);
  });

  const getPlacementBadge = (placement: number | null) => {
    if (!placement) return null;

    switch (placement) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
            <Icons.Star className="h-3 w-3" />
            1st
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/10 px-2 py-0.5 text-xs font-medium text-slate-400">
            2nd
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-700/10 px-2 py-0.5 text-xs font-medium text-amber-700">
            3rd
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {placement}th
          </span>
        );
    }
  };

  const calculateKD = (kills: number, deaths: number) => {
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : "0.00";
    return (kills / deaths).toFixed(2);
  };

  return (
    <div className="space-y-2">
      {sortedParticipants.map((participant) => {
        const isHostUser = participant.userId === hostId;
        const kd = calculateKD(participant.totalKills, participant.totalDeaths);

        return (
          <div
            key={participant.id}
            className={`flex items-center justify-between rounded-lg border p-3 ${
              participant.isEliminated
                ? "border-border/50 bg-muted/30 opacity-75"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Seed */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {participant.seed || "?"}
              </div>

              {/* Name */}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      participant.isEliminated
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {participant.user.name || participant.user.email}
                  </span>
                  {isHostUser && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                      Host
                    </span>
                  )}
                  {getPlacementBadge(participant.finalPlacement)}
                </div>
                {tournamentStatus !== "registration" && (
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>
                      {participant.matchesWon}W - {participant.matchesLost}L
                    </span>
                    {trackKills && (
                      <>
                        <span>•</span>
                        <span>
                          {participant.totalKills}K / {participant.totalDeaths}D
                        </span>
                        <span>•</span>
                        <span>K/D: {kd}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {participant.isEliminated ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                  <Icons.XCircle className="h-3 w-3" />
                  Eliminated R{participant.eliminatedAt}
                </span>
              ) : tournamentStatus === "in_progress" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                  <Icons.Zap className="h-3 w-3" />
                  Active
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
