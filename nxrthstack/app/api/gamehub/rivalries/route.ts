import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserRivalries, createRivalry } from "@/lib/gamehub/rivalries";

// GET /api/gamehub/rivalries - Get user's rivalries
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rivalries = await getUserRivalries(session.user.id);

    return NextResponse.json({ rivalries });
  } catch (error) {
    console.error("Error fetching rivalries:", error);
    return NextResponse.json(
      { error: "Failed to fetch rivalries" },
      { status: 500 }
    );
  }
}

// POST /api/gamehub/rivalries - Create rivalry challenge
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { opponentId } = body;

    if (!opponentId) {
      return NextResponse.json(
        { error: "Opponent ID is required" },
        { status: 400 }
      );
    }

    const result = await createRivalry(session.user.id, opponentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, rivalryId: result.rivalryId });
  } catch (error) {
    console.error("Error creating rivalry:", error);
    return NextResponse.json(
      { error: "Failed to create rivalry" },
      { status: 500 }
    );
  }
}
