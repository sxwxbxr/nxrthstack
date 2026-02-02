import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserRivalries } from "@/lib/gamehub/rivalries";
import { getFriends } from "@/lib/gamehub/friends";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { RivalryCard } from "@/components/gamehub/rivalry-card";
import { ChallengeButton } from "@/components/gamehub/challenge-button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Rivalries | GameHub - NxrthStack",
};

export default async function RivalriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [rivalries, friends] = await Promise.all([
    getUserRivalries(session.user.id),
    getFriends(session.user.id),
  ]);

  const activeRivalries = rivalries.filter((r) => r.status === "active");
  const pendingRivalries = rivalries.filter((r) => r.status === "pending");
  const endedRivalries = rivalries.filter((r) => r.status === "ended");

  // Get friends not in active rivalries
  const activeOpponentIds = new Set(
    activeRivalries.flatMap((r) => [r.challengerId, r.opponentId])
  );
  const pendingOpponentIds = new Set(
    pendingRivalries.flatMap((r) => [r.challengerId, r.opponentId])
  );
  const availableFriends = friends.filter(
    (f) => !activeOpponentIds.has(f.friendId) && !pendingOpponentIds.has(f.friendId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href="/dashboard/gamehub"
                className="hover:text-foreground transition-colors"
              >
                GameHub
              </Link>
              <Icons.ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Rivalries</span>
            </div>
            <h1 className="text-3xl font-bold">
              <GradientText>Rivalries</GradientText>
            </h1>
            <p className="text-muted-foreground mt-1">
              Challenge friends to head-to-head competitions
            </p>
          </div>
          {availableFriends.length > 0 && (
            <ChallengeButton friends={availableFriends} />
          )}
        </div>
      </FadeIn>

      {/* Pending Challenges */}
      {pendingRivalries.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Bell className="h-5 w-5 text-yellow-500" />
              Pending Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRivalries.map((rivalry) => (
                <RivalryCard
                  key={rivalry.id}
                  rivalry={rivalry}
                  currentUserId={session.user.id}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Active Rivalries */}
      <FadeIn delay={0.2}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icons.Swords className="h-5 w-5 text-purple-500" />
            Active Rivalries
          </h2>
          {activeRivalries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Icons.Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No active rivalries
              </h3>
              <p className="text-muted-foreground mb-4">
                {friends.length === 0
                  ? "Add friends to start challenging them!"
                  : "Challenge a friend to start a rivalry!"}
              </p>
              {friends.length === 0 ? (
                <Link
                  href="/dashboard/gamehub/friends"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                >
                  <Icons.UserPlus className="h-4 w-4" />
                  Add Friends
                </Link>
              ) : availableFriends.length > 0 ? (
                <ChallengeButton friends={availableFriends} />
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRivalries.map((rivalry) => (
                <RivalryCard
                  key={rivalry.id}
                  rivalry={rivalry}
                  currentUserId={session.user.id}
                />
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Ended Rivalries */}
      {endedRivalries.length > 0 && (
        <FadeIn delay={0.3}>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Trophy className="h-5 w-5 text-muted-foreground" />
              Past Rivalries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endedRivalries.slice(0, 4).map((rivalry) => (
                <RivalryCard
                  key={rivalry.id}
                  rivalry={rivalry}
                  currentUserId={session.user.id}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
