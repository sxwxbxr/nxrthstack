import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getRivalry, getRivalryMatches } from "@/lib/gamehub/rivalries";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { RecordMatchForm } from "@/components/gamehub/record-rivalry-match";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Rivalry | GameHub - NxrthStack",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RivalryDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const [rivalry, matches] = await Promise.all([
    getRivalry(session.user.id, id),
    getRivalryMatches(id),
  ]);

  if (!rivalry) {
    notFound();
  }

  const isChallenger = rivalry.challengerId === session.user.id;
  const opponent = isChallenger
    ? {
        id: rivalry.opponentId,
        name: rivalry.opponentName,
        email: rivalry.opponentEmail,
        avatar: rivalry.opponentAvatar,
      }
    : {
        id: rivalry.challengerId,
        name: rivalry.challengerName,
        email: rivalry.challengerEmail,
        avatar: rivalry.challengerAvatar,
      };

  const myStats = rivalry.myStats;
  const opponentStats = rivalry.opponentStats;
  const myWins = myStats?.wins || 0;
  const opponentWins = opponentStats?.wins || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/dashboard/gamehub"
              className="hover:text-foreground transition-colors"
            >
              GameHub
            </Link>
            <Icons.ChevronRight className="h-4 w-4" />
            <Link
              href="/dashboard/gamehub/rivalries"
              className="hover:text-foreground transition-colors"
            >
              Rivalries
            </Link>
            <Icons.ChevronRight className="h-4 w-4" />
            <span className="text-foreground">
              vs {opponent.name || opponent.email}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            <GradientText>Rivalry</GradientText>
          </h1>
        </div>
      </FadeIn>

      {/* Scoreboard */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-purple-500/30 bg-card p-6">
          <div className="flex items-center justify-around">
            {/* You */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold mx-auto mb-2">
                {session.user.name?.[0] || "Y"}
              </div>
              <p className="font-medium text-foreground">You</p>
              <div
                className={`text-4xl font-bold mt-2 ${
                  myWins > opponentWins
                    ? "text-green-500"
                    : myWins < opponentWins
                    ? "text-red-500"
                    : "text-foreground"
                }`}
              >
                {myWins}
              </div>
              <p className="text-sm text-muted-foreground">wins</p>
              {myStats && (
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>{myStats.losses} losses</p>
                  <p>{myStats.draws} draws</p>
                  {myStats.currentStreak > 0 && (
                    <p className="text-green-500 flex items-center justify-center gap-1">
                      <Icons.Flame className="h-3 w-3" />
                      {myStats.currentStreak} win streak
                    </p>
                  )}
                  <p>Best: {myStats.bestStreak} streak</p>
                </div>
              )}
            </div>

            {/* VS */}
            <div className="text-center">
              <Icons.Swords className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-muted-foreground">VS</p>
              <p className="text-sm text-muted-foreground mt-2">
                {rivalry.totalMatches} games played
              </p>
              {rivalry.acceptedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Since {new Date(rivalry.acceptedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Opponent */}
            <div className="text-center">
              {opponent.avatar ? (
                <img
                  src={opponent.avatar}
                  alt={opponent.name || "Opponent"}
                  className="h-16 w-16 rounded-full mx-auto mb-2"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold mx-auto mb-2">
                  {(opponent.name || opponent.email)[0].toUpperCase()}
                </div>
              )}
              <p className="font-medium text-foreground">
                {opponent.name || opponent.email}
              </p>
              <div
                className={`text-4xl font-bold mt-2 ${
                  opponentWins > myWins
                    ? "text-green-500"
                    : opponentWins < myWins
                    ? "text-red-500"
                    : "text-foreground"
                }`}
              >
                {opponentWins}
              </div>
              <p className="text-sm text-muted-foreground">wins</p>
              {opponentStats && (
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>{opponentStats.losses} losses</p>
                  <p>{opponentStats.draws} draws</p>
                  {opponentStats.currentStreak > 0 && (
                    <p className="text-orange-500 flex items-center justify-center gap-1">
                      <Icons.Flame className="h-3 w-3" />
                      {opponentStats.currentStreak} win streak
                    </p>
                  )}
                  <p>Best: {opponentStats.bestStreak} streak</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Record Match */}
      {rivalry.status === "active" && (
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Plus className="h-5 w-5 text-primary" />
              Record Match
            </h2>
            <RecordMatchForm
              rivalryId={rivalry.id}
              userId={session.user.id}
              opponentId={opponent.id}
              opponentName={opponent.name || opponent.email}
            />
          </div>
        </FadeIn>
      )}

      {/* Match History */}
      <FadeIn delay={0.3}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.Clock className="h-5 w-5 text-muted-foreground" />
            Match History
          </h2>
          {matches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No matches recorded yet. Record your first match above!
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const isWinner = match.winnerId === session.user.id;
                const isLoser = match.loserId === session.user.id;

                return (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      match.isDraw
                        ? "border-muted bg-muted/20"
                        : isWinner
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          match.isDraw
                            ? "bg-muted text-muted-foreground"
                            : isWinner
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {match.isDraw ? "=" : isWinner ? "W" : "L"}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{match.game}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.playedAt).toLocaleDateString()} at{" "}
                          {new Date(match.playedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        match.isDraw
                          ? "text-muted-foreground"
                          : isWinner
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {match.isDraw ? "Draw" : isWinner ? "Victory" : "Defeat"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
