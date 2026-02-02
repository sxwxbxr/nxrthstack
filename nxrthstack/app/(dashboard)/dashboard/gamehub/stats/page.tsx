import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { getGamingStats } from "@/lib/gamehub/stats";
import { CATEGORY_LABELS, RARITY_COLORS } from "@/lib/gamehub/achievements";

export const metadata = {
  title: "Gaming Stats | GameHub - NxrthStack",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: "primary" | "green" | "red" | "yellow" | "blue" | "purple";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default async function GamingStatsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const stats = await getGamingStats(session.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Gaming Stats</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your complete GameHub activity overview
          </p>
        </div>
      </FadeIn>

      {/* Overview Section */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.User className="h-5 w-5 text-primary" />
            Profile Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">
                {stats.overview.discordConnected ? (
                  <span className="text-green-500">Linked</span>
                ) : (
                  <span className="text-muted-foreground">Not Linked</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">Discord</p>
              {stats.overview.discordUsername && (
                <p className="text-xs text-primary mt-1">{stats.overview.discordUsername}</p>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">
                {new Date(stats.overview.memberSince).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">{stats.overview.totalOverlays}</p>
              <p className="text-sm text-muted-foreground">Stream Overlays</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">{stats.overview.totalFeedback}</p>
              <p className="text-sm text-muted-foreground">Feedback Submitted</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Achievements Section */}
      <FadeIn delay={0.15}>
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </h2>
            <Link
              href="/dashboard/gamehub/achievements"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Unlocked"
              value={`${stats.achievements.totalUnlocked}/${stats.achievements.totalAvailable}`}
              icon={Icons.Award}
              color="yellow"
            />
            <StatCard
              label="Total Points"
              value={stats.achievements.totalPoints}
              icon={Icons.Star}
              color="primary"
            />
            <StatCard
              label="Completion"
              value={`${Math.round((stats.achievements.totalUnlocked / stats.achievements.totalAvailable) * 100)}%`}
              icon={Icons.Target}
              color="green"
            />
            <StatCard
              label="Points to Max"
              value={stats.achievements.maxPoints - stats.achievements.totalPoints}
              icon={Icons.TrendingUp}
              color="blue"
            />
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(stats.achievements.byCategory).map(([category, data]) => (
              <div
                key={category}
                className="p-3 rounded-lg bg-card border border-border"
              >
                <p className="text-sm font-medium text-foreground">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </p>
                <p className="text-lg font-bold text-primary">
                  {data.unlocked}/{data.total}
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(data.unlocked / data.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Unlocks */}
          {stats.achievements.recentUnlocks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Unlocks</h3>
              <div className="space-y-2">
                {stats.achievements.recentUnlocks.map((achievement) => (
                  <div
                    key={achievement.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Icons.Award className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-foreground">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">+{achievement.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* R6 Stats Section */}
      <FadeIn delay={0.2}>
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Gamepad className="h-5 w-5 text-orange-500" />
              Rainbow Six Siege
            </h2>
            <Link
              href="/dashboard/gamehub/r6"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Matches"
              value={stats.r6.totalMatches}
              icon={Icons.Swords}
              color="primary"
            />
            <StatCard
              label="Win Rate"
              value={`${stats.r6.winRate}%`}
              icon={stats.r6.winRate >= 50 ? Icons.TrendingUp : Icons.TrendingDown}
              color={stats.r6.winRate >= 50 ? "green" : "red"}
            />
            <StatCard
              label="K/D Ratio"
              value={stats.r6.kdRatio}
              icon={Icons.Target}
              color={stats.r6.kdRatio >= 1 ? "green" : "yellow"}
            />
            <StatCard
              label="Tournaments Won"
              value={stats.r6.tournamentsWon}
              icon={Icons.Crown}
              color="yellow"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <p className="text-xl font-bold text-green-500">{stats.r6.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <p className="text-xl font-bold text-red-500">{stats.r6.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <p className="text-xl font-bold text-foreground">{stats.r6.totalKills}</p>
              <p className="text-xs text-muted-foreground">Total Kills</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <p className="text-xl font-bold text-foreground">{stats.r6.totalDeaths}</p>
              <p className="text-xs text-muted-foreground">Total Deaths</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border border-border">
              <p className="text-xl font-bold text-foreground">{stats.r6.tournamentsJoined}</p>
              <p className="text-xs text-muted-foreground">Tournaments</p>
            </div>
          </div>

          {/* Recent Matches */}
          {stats.r6.recentMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Matches</h3>
              <div className="space-y-2">
                {stats.r6.recentMatches.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          match.won
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {match.won ? (
                          <Icons.Check className="h-4 w-4" />
                        ) : (
                          <Icons.X className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {match.won ? "Victory" : "Defeat"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {match.kills}/{match.deaths}
                      </p>
                      <p className="text-xs text-muted-foreground">K/D</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.r6.totalMatches === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.Gamepad className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No matches recorded yet</p>
              <Link
                href="/dashboard/gamehub/r6/1v1"
                className="text-primary hover:underline text-sm"
              >
                Start your first 1v1
              </Link>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Quick Links */}
      <FadeIn delay={0.25}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/gamehub/achievements"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group"
          >
            <Icons.Trophy className="h-8 w-8 text-yellow-500 mb-2" />
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              Achievements
            </h3>
            <p className="text-sm text-muted-foreground">View all achievements</p>
          </Link>
          <Link
            href="/dashboard/gamehub/r6/1v1"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group"
          >
            <Icons.Swords className="h-8 w-8 text-orange-500 mb-2" />
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              1v1 Tracker
            </h3>
            <p className="text-sm text-muted-foreground">Track your matches</p>
          </Link>
          <Link
            href="/dashboard/gamehub/overlays"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group"
          >
            <Icons.Tv className="h-8 w-8 text-purple-500 mb-2" />
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              Stream Overlays
            </h3>
            <p className="text-sm text-muted-foreground">Manage your overlays</p>
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group"
          >
            <Icons.Link className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              Connect Discord
            </h3>
            <p className="text-sm text-muted-foreground">Link your account</p>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
