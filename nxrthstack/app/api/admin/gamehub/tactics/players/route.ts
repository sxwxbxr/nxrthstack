import { auth } from "@/lib/auth";
import { db, tacticsPlayers, users } from "@/lib/db";
import { eq, desc, sql, ilike } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

/** GET - List tactics players with search/pagination */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get("search") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;

    // Count total
    const countQuery = search
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(tacticsPlayers)
          .innerJoin(users, eq(tacticsPlayers.userId, users.id))
          .where(ilike(users.name, `%${search}%`))
      : db.select({ count: sql<number>`count(*)` }).from(tacticsPlayers);

    const [countResult] = await countQuery;
    const total = countResult?.count ?? 0;

    // Fetch players
    let query = db
      .select({
        id: tacticsPlayers.id,
        userId: tacticsPlayers.userId,
        rating: tacticsPlayers.rating,
        currency: tacticsPlayers.currency,
        totalWins: tacticsPlayers.totalWins,
        totalLosses: tacticsPlayers.totalLosses,
        campaignLevel: tacticsPlayers.campaignLevel,
        warfareRating: tacticsPlayers.warfareRating,
        loginStreak: tacticsPlayers.loginStreak,
        createdAt: tacticsPlayers.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(tacticsPlayers)
      .innerJoin(users, eq(tacticsPlayers.userId, users.id))
      .orderBy(desc(tacticsPlayers.rating))
      .limit(limit)
      .offset(offset);

    if (search) {
      query = query.where(ilike(users.name, `%${search}%`)) as typeof query;
    }

    const players = await query;

    return NextResponse.json({
      players,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
