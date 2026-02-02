import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  searchUsers,
} from "@/lib/gamehub/friends";

// GET /api/gamehub/friends - Get friends list and pending requests
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const searchQuery = searchParams.get("search");

    // Search users
    if (searchQuery) {
      const results = await searchUsers(session.user.id, searchQuery);
      return NextResponse.json({ users: results });
    }

    // Get friends data based on type
    if (type === "friends") {
      const friends = await getFriends(session.user.id);
      return NextResponse.json({ friends });
    }

    if (type === "pending") {
      const pending = await getPendingRequests(session.user.id);
      return NextResponse.json({ pending });
    }

    if (type === "sent") {
      const sent = await getSentRequests(session.user.id);
      return NextResponse.json({ sent });
    }

    // Default: return all
    const [friends, pending, sent] = await Promise.all([
      getFriends(session.user.id),
      getPendingRequests(session.user.id),
      getSentRequests(session.user.id),
    ]);

    return NextResponse.json({ friends, pending, sent });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

// POST /api/gamehub/friends - Send friend request
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { error: "Friend ID is required" },
        { status: 400 }
      );
    }

    const result = await sendFriendRequest(session.user.id, friendId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}
