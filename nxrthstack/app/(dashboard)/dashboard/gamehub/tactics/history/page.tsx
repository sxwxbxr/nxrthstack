import { auth } from "@/lib/auth";
import { db, tacticsMatches, users } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Match History | Tactics - NxrthStack",
};

async function getMatchHistory(userId: string) {
  return db
    .select({
      id: tacticsMatches.id,
      attackerId: tacticsMatches.attackerId,
      defenderId: tacticsMatches.defenderId,
      winner: tacticsMatches.winner,
      attackerRatingBefore: tacticsMatches.attackerRatingBefore,
      defenderRatingBefore: tacticsMatches.defenderRatingBefore,
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
    .limit(50);
}

export default async function MatchHistoryPage() {
  const session = await auth();
  const matches = await getMatchHistory(session!.user.id);

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold tactics-heading">
          <GradientText>Match History</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your recent battles and replays.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        {matches.length === 0 ? (
          <div className="text-center py-12 rounded-sm border-2 border-border bg-card tactics-card">
            <Icons.Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium">No matches yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Head to the Battle page to find your first opponent!
            </p>
            <Link
              href="/dashboard/gamehub/tactics/battle"
              className="inline-block mt-4 rounded-sm bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors tactics-button tactics-button-primary"
            >
              Find Match
            </Link>
          </div>
        ) : (
          <div className="rounded-sm border-2 border-border bg-card overflow-hidden tactics-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tactics-label">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tactics-label">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tactics-label">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tactics-label">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tactics-label">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tactics-label">Replay</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const isAttacker = match.attackerId === session!.user.id;
                  const won = (isAttacker && match.winner === "attacker") || (!isAttacker && match.winner === "defender");
                  const ratingChange = isAttacker ? match.attackerRatingChange : match.defenderRatingChange;
                  const myRating = isAttacker ? match.attackerRatingBefore : match.defenderRatingBefore;

                  return (
                    <tr key={match.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                          {won ? "Victory" : "Defeat"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {isAttacker ? "Attacker" : "Defender"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{myRating}</span>
                        <span className={`ml-2 text-sm font-medium ${ratingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {ratingChange >= 0 ? "+" : ""}{ratingChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {match.durationSeconds}s
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {match.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/gamehub/tactics/replay/${match.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Icons.Eye className="h-3 w-3" />
                          Watch
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
