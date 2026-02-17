import { auth } from "@/lib/auth";
import { db, tacticsPlayers, users } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

type LeaderboardTab = "pvp" | "campaign" | "warfare";

/** GET - Fetch leaderboard (top 50 + requester's rank) */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tab = (request.nextUrl.searchParams.get("tab") as LeaderboardTab) || "pvp";

    // Determine sort column and value column
    const sortColumn =
      tab === "campaign"
        ? tacticsPlayers.campaignLevel
        : tab === "warfare"
          ? tacticsPlayers.warfareRating
          : tacticsPlayers.rating;

    const winsColumn =
      tab === "warfare" ? tacticsPlayers.warfareWins : tacticsPlayers.totalWins;
    const lossesColumn =
      tab === "warfare" ? tacticsPlayers.warfareLosses : tacticsPlayers.totalLosses;

    // Top 50
    const topPlayers = await db
      .select({
        userId: tacticsPlayers.userId,
        rating: tacticsPlayers.rating,
        totalWins: tacticsPlayers.totalWins,
        totalLosses: tacticsPlayers.totalLosses,
        campaignLevel: tacticsPlayers.campaignLevel,
        warfareRating: tacticsPlayers.warfareRating,
        warfareWins: tacticsPlayers.warfareWins,
        warfareLosses: tacticsPlayers.warfareLosses,
        userName: users.name,
      })
      .from(tacticsPlayers)
      .innerJoin(users, eq(tacticsPlayers.userId, users.id))
      .orderBy(desc(sortColumn))
      .limit(50);

    // Get requester's data
    const myPlayer = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    let myRank = null;
    let myValue = 0;
    if (myPlayer) {
      const myVal =
        tab === "campaign"
          ? myPlayer.campaignLevel
          : tab === "warfare"
            ? myPlayer.warfareRating
            : myPlayer.rating;
      myValue = myVal;

      const [rankResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tacticsPlayers)
        .where(sql`${sortColumn} > ${myVal}`);
      myRank = (rankResult?.count ?? 0) + 1;
    }

    return NextResponse.json({
      tab,
      leaderboard: topPlayers.map((p, i) => {
        const wins = tab === "warfare" ? p.warfareWins : p.totalWins;
        const losses = tab === "warfare" ? p.warfareLosses : p.totalLosses;
        const value =
          tab === "campaign"
            ? p.campaignLevel
            : tab === "warfare"
              ? p.warfareRating
              : p.rating;

        return {
          rank: i + 1,
          userId: p.userId,
          name: p.userName || "Unknown",
          value,
          wins,
          losses,
          campaignLevel: p.campaignLevel,
          winRate:
            wins + losses > 0
              ? Math.round((wins / (wins + losses)) * 100)
              : 0,
        };
      }),
      myRank,
      myValue,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
