import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFeed } from "@/lib/gamehub/activity";
import { getFriends } from "@/lib/gamehub/friends";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ActivityCard } from "@/components/gamehub/activity-card";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Activity Feed | GameHub - NxrthStack",
};

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [activities, friends] = await Promise.all([
    getFeed(session.user.id, { limit: 30 }),
    getFriends(session.user.id),
  ]);

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
            <span className="text-foreground">Activity Feed</span>
          </div>
          <h1 className="text-3xl font-bold">
            <GradientText>Activity Feed</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">
            See what you and your friends have been up to
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <FadeIn delay={0.1}>
            {activities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Icons.Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No activity yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  {friends.length === 0
                    ? "Add friends to see their activity here!"
                    : "Activity from you and your friends will appear here."}
                </p>
                {friends.length === 0 && (
                  <Link
                    href="/dashboard/gamehub/friends"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                  >
                    <Icons.UserPlus className="h-4 w-4" />
                    Add Friends
                  </Link>
                )}
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  currentUserId={session.user.id}
                />
              ))
            )}
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Friends Summary */}
          <FadeIn delay={0.2}>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Friends</h3>
                <Link
                  href="/dashboard/gamehub/friends"
                  className="text-xs text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No friends yet. Add friends to see their activity!
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.slice(0, 5).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-2 py-1"
                    >
                      {friend.discordAvatar ? (
                        <img
                          src={friend.discordAvatar}
                          alt={friend.name || "Friend"}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(friend.name || friend.email)[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-foreground truncate">
                        {friend.discordUsername || friend.name || friend.email}
                      </span>
                    </div>
                  ))}
                  {friends.length > 5 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      +{friends.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </FadeIn>

          {/* Quick Links */}
          <FadeIn delay={0.3}>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/gamehub/sessions"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icons.Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-foreground">Sessions</span>
                </Link>
                <Link
                  href="/dashboard/gamehub/achievements"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icons.Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-foreground">Achievements</span>
                </Link>
                <Link
                  href="/dashboard/gamehub/rivalries"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icons.Swords className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-foreground">Rivalries</span>
                </Link>
                <Link
                  href="/dashboard/gamehub/leaderboards"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icons.BarChart className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">Leaderboards</span>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
