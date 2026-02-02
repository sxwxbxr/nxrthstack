import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { recordMatch, getRivalryMatches } from "@/lib/gamehub/rivalries";

type RouteParams = {
  params: Promise<{ rivalryId: string }>;
};

// GET /api/gamehub/rivalries/[rivalryId]/matches - Get rivalry matches
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rivalryId } = await params;
    const matches = await getRivalryMatches(rivalryId);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// POST /api/gamehub/rivalries/[rivalryId]/matches - Record a match
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rivalryId } = await params;
    const body = await request.json();
    const { game, winnerId, loserId, isDraw, metadata } = body;

    if (!game) {
      return NextResponse.json({ error: "Game is required" }, { status: 400 });
    }

    if (!isDraw && (!winnerId || !loserId)) {
      return NextResponse.json(
        { error: "Winner and loser are required for non-draw matches" },
        { status: 400 }
      );
    }

    const result = await recordMatch(session.user.id, rivalryId, {
      game,
      winnerId,
      loserId,
      isDraw,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording match:", error);
    return NextResponse.json(
      { error: "Failed to record match" },
      { status: 500 }
    );
  }
}
