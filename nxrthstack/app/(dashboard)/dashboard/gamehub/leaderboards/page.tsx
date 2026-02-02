import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getLeaderboard,
  getLeaderboardCategories,
  type LeaderboardCategory,
  type LeaderboardPeriod,
} from "@/lib/gamehub/leaderboards";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { LeaderboardTable } from "@/components/gamehub/leaderboard-table";
import { LeaderboardFilters } from "@/components/gamehub/leaderboard-filters";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Leaderboards | GameHub - NxrthStack",
};

type PageProps = {
  searchParams: Promise<{
    category?: string;
    period?: string;
  }>;
};

const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  achievement_points: "Achievement Points",
  r6_wins: "R6 1v1 Wins",
  r6_kd: "R6 K/D Ratio",
  rivalry_wins: "Rivalry Wins",
  sessions_hosted: "Sessions Hosted",
};

export default async function LeaderboardsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const category = (params.category || "achievement_points") as LeaderboardCategory;
  const period = (params.period || "all_time") as LeaderboardPeriod;

  // Validate params
  const validCategories = getLeaderboardCategories().map((c) => c.value);
  const validPeriods: LeaderboardPeriod[] = ["weekly", "monthly", "all_time"];

  const safeCategory = validCategories.includes(category)
    ? category
    : "achievement_points";
  const safePeriod = validPeriods.includes(period) ? period : "all_time";

  const data = await getLeaderboard(session.user.id, safeCategory, safePeriod);
  const categories = getLeaderboardCategories();

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
            <span className="text-foreground">Leaderboards</span>
          </div>
          <h1 className="text-3xl font-bold">
            <GradientText>Global Leaderboards</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete for the top spots across GameHub
          </p>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <LeaderboardFilters
          categories={categories}
          currentCategory={safeCategory}
          currentPeriod={safePeriod}
        />
      </FadeIn>

      {/* Leaderboard */}
      <FadeIn delay={0.2}>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Icons.Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">
              {CATEGORY_LABELS[safeCategory]}
            </h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground capitalize">
              {safePeriod.replace("_", " ")}
            </span>
          </div>

          <LeaderboardTable
            entries={data.entries}
            categoryLabel={CATEGORY_LABELS[safeCategory]}
            userRank={data.userRank}
            userScore={data.userScore}
          />
        </div>
      </FadeIn>
    </div>
  );
}
