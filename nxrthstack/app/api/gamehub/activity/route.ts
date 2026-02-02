import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getFeed, type ActivityType } from "@/lib/gamehub/activity";

// GET /api/gamehub/activity - Get activity feed
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const game = searchParams.get("game") || undefined;
    const type = searchParams.get("type") as ActivityType | undefined;
    const friendsOnly = searchParams.get("friendsOnly") === "true";

    const activities = await getFeed(session.user.id, {
      limit: Math.min(limit, 50),
      offset,
      game,
      type,
      friendsOnly,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}
