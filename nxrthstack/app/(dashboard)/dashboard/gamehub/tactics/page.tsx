import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsMatches, users } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { DungeonButton } from "@/components/gamehub/tactics/dungeon-button";
import { Icons } from "@/components/icons";
import { UNIT_LIST } from "@/lib/gamehub/tactics/units";

export const dynamic = "force-dynamic";

async function getPlayerData(userId: string) {
  const player = await db.query.tacticsPlayers.findFirst({
    where: eq(tacticsPlayers.userId, userId),
  });

  // Get recent matches
  const recentMatches = await db
    .select({
      id: tacticsMatches.id,
      attackerId: tacticsMatches.attackerId,
      defenderId: tacticsMatches.defenderId,
      winner: tacticsMatches.winner,
      attackerRatingChange: tacticsMatches.attackerRatingChange,
      defenderRatingChange: tacticsMatches.defenderRatingChange,
      durationSeconds: tacticsMatches.durationSeconds,
      createdAt: tacticsMatches.createdAt,
    })
    .from(tacticsMatches)
    .where(
      or(
        eq(tacticsMatches.attackerId, userId),
        eq(tacticsMatches.defenderId, userId)
      )
    )
    .orderBy(desc(tacticsMatches.createdAt))
    .limit(5);

  return { player, recentMatches };
}

export default async function TacticsDashboardPage() {
  const session = await auth();
  const { player, recentMatches } = await getPlayerData(session!.user.id);

  const winRate = player && (player.totalWins + player.totalLosses) > 0
    ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
    : 0;

  const unlockedCount = player ? (player.unlockedUnitIds as string[]).length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tactics-heading">
              <GradientText>Async PvP Tactics</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Build your squad, configure tactics, and battle other players asynchronously.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              <AnimatedCounter value={player?.rating ?? 1000} />
            </p>
          </div>
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <AnimatedCounter value={winRate} suffix="%" />
            </p>
          </div>
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <p className="text-sm text-muted-foreground">Wins / Losses</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <span className="text-green-400">{player?.totalWins ?? 0}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-red-400">{player?.totalLosses ?? 0}</span>
            </p>
          </div>
          <div className="rounded-sm border-2 border-border bg-card p-6 tactics-card">
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              <AnimatedCounter value={player?.currency ?? 0} />
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/gamehub/tactics/battle">
            <DungeonButton>
              <Icons.Swords className="h-4 w-4 mr-2" />
              Find Match
            </DungeonButton>
          </Link>
          <Link href="/dashboard/gamehub/tactics/squad">
            <DungeonButton variant="secondary">
              <Icons.Users className="h-4 w-4 mr-2" />
              Manage Squad
            </DungeonButton>
          </Link>
          <Link href="/dashboard/gamehub/tactics/shop" className="rounded-sm border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-2 tactics-button">
            <Icons.ShoppingBag className="h-4 w-4" />
            Shop
          </Link>
          <Link href="/dashboard/gamehub/tactics/inventory" className="rounded-sm border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-2 tactics-button">
            <Icons.Package className="h-4 w-4" />
            Inventory
          </Link>
          <Link href="/dashboard/gamehub/tactics/wheel" className="rounded-sm border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-2 tactics-button">
            <Icons.Dices className="h-4 w-4" />
            Lucky Wheel
          </Link>
          <Link href="/dashboard/gamehub/tactics/wizard-tower" className="rounded-sm border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-2 tactics-button">
            <Icons.Wand className="h-4 w-4" />
            Wizard Tower
          </Link>
        </div>
      </FadeIn>

      {/* Login Streak & Campaign */}
      <FadeIn delay={0.25}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Login Streak */}
          <div className="rounded-sm border-2 border-border bg-card p-4 tactics-card">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Flame className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold text-foreground tactics-heading">Login Streak</h3>
            </div>
            <p className="text-2xl font-bold text-orange-400 mb-1">
              Day {player?.loginStreak ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Log in daily to earn bonus currency!
            </p>
          </div>

          {/* Campaign Progress */}
          <div className="rounded-sm border-2 border-border bg-card p-4 tactics-card">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Map className="h-5 w-5 text-green-400" />
              <h3 className="font-semibold text-foreground tactics-heading">Campaign</h3>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-1">
              Level {player?.campaignLevel ?? 0}
            </p>
            <Link
              href="/dashboard/gamehub/tactics/campaign"
              className="text-xs text-primary hover:underline"
            >
              Continue Campaign →
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Unit Roster Progress */}
      <FadeIn delay={0.3}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3 tactics-heading">
            Unit Roster ({unlockedCount}/{UNIT_LIST.length})
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {UNIT_LIST.map((unit) => {
              const unlocked = player
                ? (player.unlockedUnitIds as string[]).includes(unit.id)
                : false;
              return (
                <div
                  key={unit.id}
                  className={`rounded-lg border p-2 text-center text-xs ${
                    unlocked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background opacity-40"
                  }`}
                >
                  <p className="font-medium text-foreground">{unit.name}</p>
                  <p className="text-muted-foreground">{unit.class}</p>
                  {!unlocked && unit.unlockCost > 0 && (
                    <p className="text-yellow-400 mt-1">{unit.unlockCost}g</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Recent Matches */}
      <FadeIn delay={0.4}>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3 tactics-heading">Recent Matches</h2>
          {recentMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Start battling!</p>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => {
                const isAttacker = match.attackerId === session!.user.id;
                const won = (isAttacker && match.winner === "attacker") || (!isAttacker && match.winner === "defender");
                const ratingChange = isAttacker ? match.attackerRatingChange : match.defenderRatingChange;

                return (
                  <Link
                    key={match.id}
                    href={`/dashboard/gamehub/tactics/replay/${match.id}`}
                    className="flex items-center justify-between rounded-sm border-2 border-border bg-background p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                        {won ? "W" : "L"}
                      </span>
                      <span className="text-sm text-foreground">
                        {isAttacker ? "vs defender" : "defended"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={ratingChange >= 0 ? "text-green-400" : "text-red-400"}>
                        {ratingChange >= 0 ? "+" : ""}{ratingChange}
                      </span>
                      <span className="text-muted-foreground">{match.durationSeconds}s</span>
                      <Icons.Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
