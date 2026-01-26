import { auth } from "@/lib/auth";
import { db, r6Lobbies, r6Matches } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { JoinLobbyForm } from "@/components/gamehub/join-lobby-form";

export const metadata = {
  title: "1v1 Tracker | Rainbow Six Siege - NxrthStack",
};

async function getUserLobbies(userId: string) {
  const lobbies = await db.query.r6Lobbies.findMany({
    where: or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId)),
    orderBy: [desc(r6Lobbies.updatedAt)],
    with: {
      host: true,
      opponent: true,
      matches: true,
    },
  });

  return lobbies.map((lobby) => {
    const userWins = lobby.matches.filter((m) => m.winnerId === userId).length;
    const opponentWins = lobby.matches.length - userWins;
    const isHost = lobby.hostId === userId;

    return {
      ...lobby,
      host: lobby.host
        ? { id: lobby.host.id, name: lobby.host.name }
        : null,
      opponent: lobby.opponent
        ? { id: lobby.opponent.id, name: lobby.opponent.name }
        : null,
      userWins,
      opponentWins,
      isHost,
      totalMatches: lobby.matches.length,
    };
  });
}

export default async function R61v1Page() {
  const session = await auth();
  const lobbies = await getUserLobbies(session!.user.id);

  const activeLobbies = lobbies.filter((l) => l.status === "active");
  const openLobbies = lobbies.filter((l) => l.status === "open");
  const completedLobbies = lobbies.filter((l) => l.status === "completed");

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>1v1 Tracker</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your 1v1 matches against friends
            </p>
          </div>
          <Link href="/dashboard/gamehub/r6/1v1/create">
            <ShimmerButton>
              <Icons.Plus className="h-4 w-4 mr-2" />
              Create Lobby
            </ShimmerButton>
          </Link>
        </div>
      </FadeIn>

      {/* Join Lobby */}
      <FadeIn delay={0.1}>
        <JoinLobbyForm />
      </FadeIn>

      {/* Active Lobbies */}
      {activeLobbies.length > 0 && (
        <FadeIn delay={0.2}>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Active Lobbies
          </h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {activeLobbies.map((lobby) => (
              <StaggerItem key={lobby.id}>
                <Link href={`/dashboard/gamehub/r6/1v1/${lobby.id}`}>
                  <div className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">
                        {lobby.name}
                      </h3>
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                        Active
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {lobby.host?.name || "Unknown"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {lobby.isHost ? lobby.userWins : lobby.opponentWins}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-muted-foreground">
                        vs
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {lobby.opponent?.name || "Unknown"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {lobby.isHost ? lobby.opponentWins : lobby.userWins}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {lobby.totalMatches} matches played
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* Open Lobbies */}
      {openLobbies.length > 0 && (
        <FadeIn delay={0.3}>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Waiting for Opponent
          </h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {openLobbies.map((lobby) => (
              <StaggerItem key={lobby.id}>
                <Link href={`/dashboard/gamehub/r6/1v1/${lobby.id}`}>
                  <div className="rounded-xl border border-dashed border-border bg-card p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">
                        {lobby.name}
                      </h3>
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                        Open
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Invite Code:{" "}
                      <span className="font-mono font-semibold text-primary">
                        {lobby.inviteCode}
                      </span>
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Share this code with your opponent to start tracking
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* Completed Lobbies */}
      {completedLobbies.length > 0 && (
        <FadeIn delay={0.4}>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Completed
          </h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {completedLobbies.map((lobby) => (
              <StaggerItem key={lobby.id}>
                <Link href={`/dashboard/gamehub/r6/1v1/${lobby.id}`}>
                  <div className="rounded-xl border border-border bg-card/50 p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">
                        {lobby.name}
                      </h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Completed
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {lobby.host?.name || "Unknown"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {lobby.isHost ? lobby.userWins : lobby.opponentWins}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-muted-foreground">
                        vs
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {lobby.opponent?.name || "Unknown"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {lobby.isHost ? lobby.opponentWins : lobby.userWins}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* Empty State */}
      {lobbies.length === 0 && (
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Icons.Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No lobbies yet
            </h3>
            <p className="mt-2 text-muted-foreground">
              Create a lobby or join one with an invite code
            </p>
            <div className="mt-6">
              <Link href="/dashboard/gamehub/r6/1v1/create">
                <ShimmerButton>
                  <Icons.Plus className="h-4 w-4 mr-2" />
                  Create Your First Lobby
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
