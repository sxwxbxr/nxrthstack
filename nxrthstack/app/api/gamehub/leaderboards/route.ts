import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getLeaderboard,
  getLeaderboardCategories,
  type LeaderboardCategory,
  type LeaderboardPeriod,
} from "@/lib/gamehub/leaderboards";

// GET /api/gamehub/leaderboards - Get leaderboard data
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") ||
      "achievement_points") as LeaderboardCategory;
    const period = (searchParams.get("period") || "all_time") as LeaderboardPeriod;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Validate category
    const validCategories = getLeaderboardCategories().map((c) => c.value);
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods: LeaderboardPeriod[] = ["weekly", "monthly", "all_time"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const data = await getLeaderboard(
      session.user.id,
      category,
      period,
      Math.min(limit, 100)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
