import { auth } from "@/lib/auth";
import { db, gamehubAnnouncements } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

export const metadata = {
  title: "GameHub | Dashboard - NxrthStack",
};

async function getAnnouncements() {
  return db.query.gamehubAnnouncements.findMany({
    where: eq(gamehubAnnouncements.isActive, true),
    orderBy: [desc(gamehubAnnouncements.isPinned), desc(gamehubAnnouncements.createdAt)],
    limit: 10,
  });
}

const gameCategories = [
  {
    title: "Rainbow Six Siege",
    description: "1v1 Tracker and Operator Randomizer for competitive matches",
    href: "/dashboard/gamehub/r6",
    icon: Icons.Gamepad,
    features: ["1v1 Tracker", "Operator Randomizer", "Match Stats"],
  },
  {
    title: "Pokemon",
    description: "ROM Editor with randomization tools for Gen 1-3 games",
    href: "/dashboard/gamehub/pokemon",
    icon: Icons.Sparkles,
    features: ["ROM Editor", "Wild Randomizer", "Starter Picker"],
  },
  {
    title: "Minecraft",
    description: "Server tools and utilities for Minecraft",
    href: "/dashboard/gamehub/minecraft",
    icon: Icons.Package,
    features: ["Server Checker", "Enchantment Planner"],
  },
];

export default async function GameHubPage() {
  const session = await auth();
  const announcements = await getAnnouncements();
  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            Welcome to <GradientText>GameHub</GradientText>
          </h1>
          <div className="mt-2">
            <TextGenerateEffect
              words={`Hey ${session?.user?.name || "Friend"}! Check out the latest updates and tools for your favorite games.`}
              className="text-foreground/60"
            />
          </div>
        </div>
      </FadeIn>

      {/* Pinned Announcements / Blackboard */}
      {pinnedAnnouncements.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icons.Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Pinned Announcements
              </h2>
            </div>
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">
                      {announcement.title}
                    </h3>
                    {announcement.category && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {announcement.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground/60 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <p className="mt-2 text-xs text-foreground/60">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Cross-Game Features */}
      <FadeIn delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/gamehub/stats"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Icons.BarChart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Gaming Stats
                </h3>
                <p className="text-xs text-foreground/60">Your activity overview</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/sessions"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Icons.Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Session Scheduler
                </h3>
                <p className="text-xs text-foreground/60">Plan gaming sessions</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/achievements"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Icons.Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Achievements
                </h3>
                <p className="text-xs text-foreground/60">Track your progress</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/overlays"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Icons.Tv className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Stream Overlays
                </h3>
                <p className="text-xs text-foreground/60">For OBS/streaming</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/settings"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Icons.Link className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Connect Discord
                </h3>
                <p className="text-xs text-foreground/60">Link your account</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/friends"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Icons.Users className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Friends
                </h3>
                <p className="text-xs text-foreground/60">Connect with gamers</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/feed"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                <Icons.Activity className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Activity Feed
                </h3>
                <p className="text-xs text-foreground/60">See what friends do</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/rivalries"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <Icons.Swords className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Rivalries
                </h3>
                <p className="text-xs text-foreground/60">Head-to-head battles</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/leaderboards"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Icons.Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Leaderboards
                </h3>
                <p className="text-xs text-foreground/60">Global rankings</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/gamehub/passport"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Icons.User className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Gaming Passport
                </h3>
                <p className="text-xs text-foreground/60">Your public profile</p>
              </div>
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* Game Categories */}
      <FadeIn delay={0.2}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Games</h2>
        <BentoGrid>
          {gameCategories.map((game) => (
            <BentoGridItem key={game.title}>
              <Link href={game.href} className="block h-full">
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <game.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {game.title}
                    </h3>
                  </div>
                  <p className="text-foreground/60 mb-4">{game.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {game.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </FadeIn>

      {/* Recent Announcements */}
      {regularAnnouncements.length > 0 && (
        <FadeIn delay={0.3}>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Recent Updates
          </h2>
          <StaggerContainer className="space-y-3">
            {regularAnnouncements.map((announcement, index) => (
              <StaggerItem key={announcement.id}>
                <div className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {announcement.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/60">
                          {announcement.category}
                        </span>
                      )}
                      <span className="text-xs text-foreground/60">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground/60 line-clamp-2">
                    {announcement.content}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* Empty state for announcements */}
      {announcements.length === 0 && (
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Icons.Info className="mx-auto h-12 w-12 text-foreground/60" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No announcements yet
            </h3>
            <p className="mt-2 text-foreground/60">
              Check back later for updates and news about your favorite games!
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
