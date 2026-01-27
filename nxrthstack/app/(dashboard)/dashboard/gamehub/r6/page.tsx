import { auth } from "@/lib/auth";
import { db, r6Lobbies, r6Matches } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { R6Features } from "@/components/gamehub/r6-features";

export const metadata = {
  title: "Rainbow Six Siege | GameHub - NxrthStack",
};

async function getUserStats(userId: string) {
  // Get user's lobbies
  const lobbies = await db.query.r6Lobbies.findMany({
    where: or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId)),
  });

  // Get total matches and wins
  let totalMatches = 0;
  let totalWins = 0;

  for (const lobby of lobbies) {
    const matches = await db.query.r6Matches.findMany({
      where: eq(r6Matches.lobbyId, lobby.id),
    });

    totalMatches += matches.length;
    totalWins += matches.filter((m) => m.winnerId === userId).length;
  }

  return {
    totalLobbies: lobbies.length,
    activeLobbies: lobbies.filter((l) => l.status === "active").length,
    totalMatches,
    totalWins,
    winRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
  };
}


export default async function R6HubPage() {
  const session = await auth();
  const stats = await getUserStats(session!.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <GradientText>Rainbow Six Siege</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tools and trackers for R6 Siege
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total Lobbies</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <AnimatedCounter value={stats.totalLobbies} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Active Lobbies</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <AnimatedCounter value={stats.activeLobbies} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <AnimatedCounter value={stats.totalMatches} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              <AnimatedCounter value={stats.winRate} suffix="%" />
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Features */}
      <FadeIn delay={0.2}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Features</h2>
        <R6Features />
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/gamehub/r6/1v1/create">
            <ShimmerButton>
              <Icons.Plus className="h-4 w-4 mr-2" />
              Create 1v1 Lobby
            </ShimmerButton>
          </Link>
          <Link href="/dashboard/gamehub/r6/tournaments/create">
            <ShimmerButton>
              <Icons.Swords className="h-4 w-4 mr-2" />
              Create Tournament
            </ShimmerButton>
          </Link>
          <Link href="/dashboard/gamehub/r6/randomizer">
            <ShimmerButton className="bg-accent">
              <Icons.Zap className="h-4 w-4 mr-2" />
              Randomize Operator
            </ShimmerButton>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
