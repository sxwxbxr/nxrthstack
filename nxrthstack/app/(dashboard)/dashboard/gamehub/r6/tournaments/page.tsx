import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { TournamentList } from "@/components/gamehub/tournament-list";
import { JoinTournamentForm } from "@/components/gamehub/join-tournament-form";
import { db } from "@/lib/db";
import { r6Tournaments, r6TournamentParticipants } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

export const metadata = {
  title: "Tournaments | R6 Siege - NxrthStack",
};

export default async function TournamentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isFriend && session.user.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  // Get participant tournament IDs
  const participantTournaments = await db
    .select({ tournamentId: r6TournamentParticipants.tournamentId })
    .from(r6TournamentParticipants)
    .where(eq(r6TournamentParticipants.userId, session.user.id));

  const participantIds = participantTournaments.map((p) => p.tournamentId);

  // Get all tournaments where user is host or participant
  const tournaments = await db.query.r6Tournaments.findMany({
    where: or(
      eq(r6Tournaments.hostId, session.user.id),
      ...participantIds.map((id) => eq(r6Tournaments.id, id))
    ),
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
    },
    orderBy: [desc(r6Tournaments.updatedAt)],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to R6 Hub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <GradientText>Tournaments</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create and compete in bracket-style tournaments with friends
            </p>
          </div>
          <Link href="/dashboard/gamehub/r6/tournaments/create">
            <ShimmerButton>
              <Icons.Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </ShimmerButton>
          </Link>
        </div>
      </FadeIn>

      {/* Join Tournament */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Join a Tournament
          </h2>
          <JoinTournamentForm />
        </div>
      </FadeIn>

      {/* Tournament List */}
      <FadeIn delay={0.2}>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Your Tournaments
        </h2>
        <TournamentList
          tournaments={tournaments}
          currentUserId={session.user.id}
        />
      </FadeIn>
    </div>
  );
}
