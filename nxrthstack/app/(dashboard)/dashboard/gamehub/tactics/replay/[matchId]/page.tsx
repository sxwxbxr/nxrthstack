import { auth } from "@/lib/auth";
import { db, tacticsMatches, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { ReplayClient } from "./replay-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Battle Replay | Tactics - NxrthStack",
};

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const session = await auth();
  const { matchId } = await params;

  const match = await db.query.tacticsMatches.findFirst({
    where: eq(tacticsMatches.id, matchId),
  });

  if (!match) {
    notFound();
  }

  // Only allow participants to view
  if (match.attackerId !== session!.user.id && match.defenderId !== session!.user.id) {
    notFound();
  }

  const attacker = await db.query.users.findFirst({
    where: eq(users.id, match.attackerId),
  });
  const defender = await db.query.users.findFirst({
    where: eq(users.id, match.defenderId),
  });

  const isAttacker = match.attackerId === session!.user.id;
  const won = (isAttacker && match.winner === "attacker") || (!isAttacker && match.winner === "defender");

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/gamehub/tactics/history"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.ChevronLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold">
              <GradientText>Battle Replay</GradientText>
            </h1>
            <p className="text-sm text-muted-foreground">
              {attacker?.name ?? "Attacker"} vs {defender?.name ?? "Defender"} &mdash;{" "}
              <span className={won ? "text-green-400" : "text-red-400"}>
                {won ? "Victory" : "Defeat"}
              </span>
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <ReplayClient
          events={match.events as any[]}
          attackerSquad={match.attackerSquadSnapshot as any}
          defenderSquad={match.defenderSquadSnapshot as any}
          mapId={match.mapId}
          maxTick={match.durationTicks}
          stats={match.stats as any}
        />
      </FadeIn>
    </div>
  );
}
