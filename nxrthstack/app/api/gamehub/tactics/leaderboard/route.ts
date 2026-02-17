import { auth } from "@/lib/auth";
import { db, tacticsPlayers, users } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/** GET - Fetch leaderboard (top 50 + requester's rank) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Top 50 by rating
    const topPlayers = await db
      .select({
        userId: tacticsPlayers.userId,
        rating: tacticsPlayers.rating,
        totalWins: tacticsPlayers.totalWins,
        totalLosses: tacticsPlayers.totalLosses,
        userName: users.name,
      })
      .from(tacticsPlayers)
      .innerJoin(users, eq(tacticsPlayers.userId, users.id))
      .orderBy(desc(tacticsPlayers.rating))
      .limit(50);

    // Get requester's rank
    const myPlayer = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    let myRank = null;
    if (myPlayer) {
      const [rankResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tacticsPlayers)
        .where(sql`${tacticsPlayers.rating} > ${myPlayer.rating}`);
      myRank = (rankResult?.count ?? 0) + 1;
    }

    return NextResponse.json({
      leaderboard: topPlayers.map((p, i) => ({
        rank: i + 1,
        userId: p.userId,
        name: p.userName || "Unknown",
        rating: p.rating,
        wins: p.totalWins,
        losses: p.totalLosses,
        winRate: p.totalWins + p.totalLosses > 0
          ? Math.round((p.totalWins / (p.totalWins + p.totalLosses)) * 100)
          : 0,
      })),
      myRank,
      myRating: myPlayer?.rating ?? 1000,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
