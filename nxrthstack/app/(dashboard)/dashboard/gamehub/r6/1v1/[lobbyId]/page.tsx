import { auth } from "@/lib/auth";
import { db, r6Lobbies, r6Matches } from "@/lib/db";
import { eq, or, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { RecordMatchForm } from "@/components/gamehub/record-match-form";
import { LobbyActions } from "@/components/gamehub/lobby-actions";
import { R6StatsCharts } from "@/components/gamehub/r6-stats-charts";

interface PageProps {
  params: Promise<{ lobbyId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lobbyId } = await params;
  const lobby = await db.query.r6Lobbies.findFirst({
    where: eq(r6Lobbies.id, lobbyId),
  });

  return {
    title: lobby
      ? `${lobby.name} | 1v1 Tracker - NxrthStack`
      : "Lobby Not Found",
  };
}

async function getLobby(lobbyId: string, userId: string) {
  const lobby = await db.query.r6Lobbies.findFirst({
    where: and(
      eq(r6Lobbies.id, lobbyId),
      or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId))
    ),
    with: {
      host: true,
      opponent: true,
      matches: {
        orderBy: [desc(r6Matches.createdAt)],
      },
    },
  });

  return lobby;
}

export default async function LobbyDetailPage({ params }: PageProps) {
  const session = await auth();
  const { lobbyId } = await params;
  const lobby = await getLobby(lobbyId, session!.user.id);

  if (!lobby) {
    notFound();
  }

  const isHost = lobby.hostId === session!.user.id;
  const hostWins = lobby.matches.filter((m) => m.winnerId === lobby.hostId).length;
  const opponentWins = lobby.matches.filter(
    (m) => m.winnerId === lobby.opponentId
  ).length;

  // Calculate K/D stats if tracking is enabled
  let hostKills = 0;
  let hostDeaths = 0;
  let opponentKills = 0;
  let opponentDeaths = 0;

  if (lobby.trackKills) {
    lobby.matches.forEach((match) => {
      hostKills += match.player1Kills || 0;
      hostDeaths += match.player1Deaths || 0;
      opponentKills += match.player2Kills || 0;
      opponentDeaths += match.player2Deaths || 0;
    });
  }

  // Calculate total rounds won
  let hostRoundsWon = 0;
  let opponentRoundsWon = 0;

  lobby.matches.forEach((match) => {
    hostRoundsWon += match.player1RoundsWon || 0;
    opponentRoundsWon += match.player2RoundsWon || 0;
  });

  const hasRoundData = hostRoundsWon > 0 || opponentRoundsWon > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6/1v1"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to 1v1 Tracker
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{lobby.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  lobby.status === "active"
                    ? "bg-green-500/10 text-green-500"
                    : lobby.status === "open"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {lobby.status === "active"
                  ? "Active"
                  : lobby.status === "open"
                  ? "Waiting for Opponent"
                  : "Completed"}
              </span>
              {lobby.trackKills && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  K/D Tracking
                </span>
              )}
              {lobby.deletionRequestedBy && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  Deletion Pending
                </span>
              )}
            </div>
          </div>
          <LobbyActions
            lobby={{
              id: lobby.id,
              status: lobby.status,
              hostId: lobby.hostId,
              opponentId: lobby.opponentId,
              deletionRequestedBy: lobby.deletionRequestedBy,
            }}
            currentUserId={session!.user.id}
            isHost={isHost}
          />
        </div>
      </FadeIn>

      {/* Invite Code (for open lobbies) */}
      {lobby.status === "open" && (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Share this code with your opponent
            </p>
            <p className="text-4xl font-mono font-bold tracking-wider">
              <GradientText>{lobby.inviteCode}</GradientText>
            </p>
          </div>
        </FadeIn>
      )}

      {/* Score Board */}
      {lobby.status === "active" && (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="grid grid-cols-3 items-center">
              {/* Host */}
              <div className="text-center">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10 mb-3">
                  <Icons.User className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground">
                  {lobby.host?.name || "Host"}
                </p>
                <p className="text-5xl font-bold mt-2">
                  <AnimatedCounter value={hostWins} />
                </p>
                <div className="mt-2 space-y-1">
                  {hasRoundData && (
                    <p className="text-sm text-muted-foreground">
                      Rounds: <span className="text-green-500">{hostRoundsWon}</span>
                      {" / "}
                      <span className="text-destructive">{opponentRoundsWon}</span>
                    </p>
                  )}
                  {lobby.trackKills && (
                    <p className="text-sm text-muted-foreground">
                      K/D: {hostKills}/{hostDeaths} (
                      {hostDeaths > 0 ? (hostKills / hostDeaths).toFixed(2) : hostKills}
                      )
                    </p>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">VS</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {lobby.matches.length} matches
                </p>
                {hasRoundData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {hostRoundsWon + opponentRoundsWon} rounds
                  </p>
                )}
              </div>

              {/* Opponent */}
              <div className="text-center">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-accent mb-3">
                  <Icons.User className="h-8 w-8 text-accent-foreground" />
                </div>
                <p className="font-semibold text-foreground">
                  {lobby.opponent?.name || "Opponent"}
                </p>
                <p className="text-5xl font-bold mt-2">
                  <AnimatedCounter value={opponentWins} />
                </p>
                <div className="mt-2 space-y-1">
                  {hasRoundData && (
                    <p className="text-sm text-muted-foreground">
                      Rounds: <span className="text-green-500">{opponentRoundsWon}</span>
                      {" / "}
                      <span className="text-destructive">{hostRoundsWon}</span>
                    </p>
                  )}
                  {lobby.trackKills && (
                    <p className="text-sm text-muted-foreground">
                      K/D: {opponentKills}/{opponentDeaths} (
                      {opponentDeaths > 0
                        ? (opponentKills / opponentDeaths).toFixed(2)
                        : opponentKills}
                      )
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Record Match */}
      {lobby.status === "active" && (
        <FadeIn delay={0.2}>
          <RecordMatchForm
            lobbyId={lobby.id}
            hostId={lobby.hostId}
            hostName={lobby.host?.name || "Host"}
            opponentId={lobby.opponentId!}
            opponentName={lobby.opponent?.name || "Opponent"}
            trackKills={lobby.trackKills}
          />
        </FadeIn>
      )}

      {/* Match History */}
      {lobby.matches.length > 0 && (
        <FadeIn delay={0.3}>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Match History
          </h2>
          <StaggerContainer className="space-y-3">
            {lobby.matches.map((match, index) => {
              const isHostWinner = match.winnerId === lobby.hostId;
              const winnerName = isHostWinner
                ? lobby.host?.name
                : lobby.opponent?.name;

              return (
                <StaggerItem key={match.id}>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          #{lobby.matches.length - index}
                        </span>
                        <span
                          className={`font-semibold ${
                            match.winnerId === session!.user.id
                              ? "text-green-500"
                              : "text-destructive"
                          }`}
                        >
                          {winnerName} won
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {/* Round Score */}
                    {(match.player1RoundsWon !== null || match.player2RoundsWon !== null) && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-semibold">
                          <span className={isHostWinner ? "text-green-500" : "text-foreground"}>
                            {match.player1RoundsWon || 0}
                          </span>
                          <span className="text-muted-foreground"> - </span>
                          <span className={!isHostWinner ? "text-green-500" : "text-foreground"}>
                            {match.player2RoundsWon || 0}
                          </span>
                        </span>
                      </div>
                    )}
                    {/* K/D Stats */}
                    {lobby.trackKills && (match.player1Kills !== null || match.player2Kills !== null) && (
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {lobby.host?.name}: {match.player1Kills || 0}/
                          {match.player1Deaths || 0}
                        </span>
                        <span>|</span>
                        <span>
                          {lobby.opponent?.name}: {match.player2Kills || 0}/
                          {match.player2Deaths || 0}
                        </span>
                      </div>
                    )}
                    {match.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {match.notes}
                      </p>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* Stats Visualization */}
      {lobby.matches.length > 0 && lobby.opponent && (
        <FadeIn delay={0.4}>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.TrendingUp className="w-5 h-5 text-primary" />
            Statistics
          </h2>
          <R6StatsCharts
            matches={lobby.matches}
            player1Id={lobby.hostId}
            player2Id={lobby.opponentId!}
            player1Name={lobby.host?.name || "Host"}
            player2Name={lobby.opponent?.name || "Opponent"}
            trackKills={lobby.trackKills}
          />
        </FadeIn>
      )}
    </div>
  );
}
