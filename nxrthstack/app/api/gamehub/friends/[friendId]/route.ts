import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/lib/gamehub/friends";

type RouteParams = {
  params: Promise<{ friendId: string }>;
};

// POST /api/gamehub/friends/[friendId] - Accept friend request
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "accept") {
      const result = await acceptFriendRequest(session.user.id, friendId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "decline") {
      const result = await declineFriendRequest(session.user.id, friendId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error handling friend request:", error);
    return NextResponse.json(
      { error: "Failed to process friend request" },
      { status: 500 }
    );
  }
}

// DELETE /api/gamehub/friends/[friendId] - Remove friend
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await params;
    const result = await removeFriend(session.user.id, friendId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 }
    );
  }
}
