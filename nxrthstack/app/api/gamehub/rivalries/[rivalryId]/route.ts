import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getRivalry,
  getRivalryMatches,
  acceptRivalry,
  declineRivalry,
  endRivalry,
} from "@/lib/gamehub/rivalries";

type RouteParams = {
  params: Promise<{ rivalryId: string }>;
};

// GET /api/gamehub/rivalries/[rivalryId] - Get rivalry details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rivalryId } = await params;
    const [rivalry, matches] = await Promise.all([
      getRivalry(session.user.id, rivalryId),
      getRivalryMatches(rivalryId),
    ]);

    if (!rivalry) {
      return NextResponse.json({ error: "Rivalry not found" }, { status: 404 });
    }

    return NextResponse.json({ rivalry, matches });
  } catch (error) {
    console.error("Error fetching rivalry:", error);
    return NextResponse.json(
      { error: "Failed to fetch rivalry" },
      { status: 500 }
    );
  }
}

// POST /api/gamehub/rivalries/[rivalryId] - Accept/decline/end rivalry
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rivalryId } = await params;
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case "accept":
        result = await acceptRivalry(session.user.id, rivalryId);
        break;
      case "decline":
        result = await declineRivalry(session.user.id, rivalryId);
        break;
      case "end":
        result = await endRivalry(session.user.id, rivalryId);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling rivalry action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
