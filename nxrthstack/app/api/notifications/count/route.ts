import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications/service";

// GET /api/notifications/count - Get unread count (lightweight for polling)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await getUnreadCount(session.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
