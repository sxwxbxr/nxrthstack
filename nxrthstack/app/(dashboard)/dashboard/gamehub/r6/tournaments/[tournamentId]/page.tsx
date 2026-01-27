import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { TournamentBracket } from "@/components/gamehub/tournament-bracket";
import { TournamentHeader } from "@/components/gamehub/tournament-header";
import { TournamentParticipants } from "@/components/gamehub/tournament-participants";
import { TournamentStats } from "@/components/gamehub/tournament-stats";
import { db } from "@/lib/db";
import { r6Tournaments, r6TournamentParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const metadata = {
  title: "Tournament | R6 Siege - NxrthStack",
};

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const session = await auth();
  const { tournamentId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isFriend && session.user.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  // Fetch tournament with all related data
  const tournament = await db.query.r6Tournaments.findFirst({
    where: eq(r6Tournaments.id, tournamentId),
    with: {
      host: {
        columns: { id: true, name: true, email: true },
      },
      winner: {
        columns: { id: true, name: true, email: true },
      },
      participants: {
        with: {
          user: {
            columns: { id: true, name: true, email: true },
          },
        },
      },
      matches: {
        with: {
          player1: {
            columns: { id: true, name: true, email: true },
          },
          player2: {
            columns: { id: true, name: true, email: true },
          },
          winner: {
            columns: { id: true, name: true, email: true },
          },
          games: true,
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  // Check if user is host or participant
  const isHost = tournament.hostId === session.user.id;
  const isParticipant = tournament.participants.some(
    (p) => p.userId === session.user.id
  );

  if (!isHost && !isParticipant && session.user.role !== "admin") {
    redirect("/dashboard/gamehub/r6/tournaments");
  }

  // Calculate total rounds
  const totalRounds = Math.log2(tournament.size);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6/tournaments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Tournaments
        </Link>
        <TournamentHeader
          tournament={tournament}
          isHost={isHost}
          currentUserId={session.user.id}
        />
      </FadeIn>

      {/* Tournament Status */}
      {tournament.status === "registration" && (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Icons.Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Waiting for Players
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tournament.participants.length} / {tournament.size} players
                  joined
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Invite Code</p>
                <p className="text-2xl font-bold text-primary tracking-wider">
                  {tournament.inviteCode}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {tournament.status === "completed" && tournament.winner && (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/5 p-6 text-center">
            <Icons.Star className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
            <h3 className="text-xl font-bold text-foreground mb-1">
              Tournament Champion
            </h3>
            <p className="text-2xl font-bold text-yellow-500">
              {tournament.winner.name || tournament.winner.email}
            </p>
          </div>
        </FadeIn>
      )}

      {/* Bracket */}
      {tournament.status !== "registration" && (
        <FadeIn delay={0.15}>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Bracket
            </h2>
            <TournamentBracket
              tournament={tournament}
              matches={tournament.matches}
              totalRounds={totalRounds}
              currentUserId={session.user.id}
              isHost={isHost}
            />
          </div>
        </FadeIn>
      )}

      {/* Participants */}
      <FadeIn delay={0.2}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Participants ({tournament.participants.length}/{tournament.size})
          </h2>
          <TournamentParticipants
            participants={tournament.participants}
            hostId={tournament.hostId}
            isHost={isHost}
            tournamentStatus={tournament.status}
            trackKills={tournament.trackKills}
          />
        </div>
      </FadeIn>

      {/* Stats */}
      {tournament.status !== "registration" && tournament.trackKills && (
        <FadeIn delay={0.25}>
          <TournamentStats
            participants={tournament.participants}
            matches={tournament.matches}
          />
        </FadeIn>
      )}
    </div>
  );
}
