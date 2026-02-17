import { auth } from "@/lib/auth";
import { db, tacticsMatches, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/** GET - Fetch match details and replay events */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const match = await db.query.tacticsMatches.findFirst({
      where: eq(tacticsMatches.id, id),
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only allow participants to view match details
    if (match.attackerId !== session.user.id && match.defenderId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to view this match" }, { status: 403 });
    }

    // Get user names
    const attacker = await db.query.users.findFirst({
      where: eq(users.id, match.attackerId),
    });
    const defender = await db.query.users.findFirst({
      where: eq(users.id, match.defenderId),
    });

    return NextResponse.json({
      match: {
        id: match.id,
        attackerId: match.attackerId,
        attackerName: attacker?.name || "Unknown",
        defenderId: match.defenderId,
        defenderName: defender?.name || "Unknown",
        attackerRatingBefore: match.attackerRatingBefore,
        defenderRatingBefore: match.defenderRatingBefore,
        attackerRatingChange: match.attackerRatingChange,
        defenderRatingChange: match.defenderRatingChange,
        attackerSquadSnapshot: match.attackerSquadSnapshot,
        defenderSquadSnapshot: match.defenderSquadSnapshot,
        mapId: match.mapId,
        seed: match.seed,
        winner: match.winner,
        durationTicks: match.durationTicks,
        durationSeconds: match.durationSeconds,
        stats: match.stats,
        events: match.events,
        createdAt: match.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}
