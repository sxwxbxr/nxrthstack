"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";

interface Tournament {
  id: string;
  name: string;
  status: string;
  size: number;
  format: string;
  bestOf: number;
  createdAt: Date;
  host: { id: string; name: string | null; email: string } | null;
  winner: { id: string; name: string | null; email: string } | null;
  participants: {
    id: string;
    userId: string;
    user: { id: string; name: string | null; email: string };
  }[];
}

interface TournamentListProps {
  tournaments: Tournament[];
  currentUserId: string;
}

export function TournamentList({
  tournaments,
  currentUserId,
}: TournamentListProps) {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Icons.Swords className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Tournaments Yet
        </h3>
        <p className="text-muted-foreground">
          Create a tournament or join one with an invite code
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registration":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
            <Icons.Users className="h-3 w-3" />
            Registration
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
            <Icons.Zap className="h-3 w-3" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Icons.CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {tournaments.map((tournament) => {
        const isHost = tournament.host?.id === currentUserId;

        return (
          <Link
            key={tournament.id}
            href={`/dashboard/gamehub/r6/tournaments/${tournament.id}`}
            className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icons.Swords className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {tournament.name}
                    </h3>
                    {isHost && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>
                      {tournament.participants.length}/{tournament.size} players
                    </span>
                    <span>•</span>
                    <span>
                      {tournament.format === "single_elimination"
                        ? "Single Elim"
                        : "Double Elim"}
                    </span>
                    <span>•</span>
                    <span>Bo{tournament.bestOf}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {tournament.winner && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Winner</p>
                    <p className="text-sm font-medium text-yellow-500">
                      {tournament.winner.name || tournament.winner.email}
                    </p>
                  </div>
                )}
                {getStatusBadge(tournament.status)}
                <Icons.ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
