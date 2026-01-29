import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
} from "@/lib/notifications/service";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  category: z.enum(["gamehub", "product", "system"]).optional(),
});

// GET /api/notifications - Fetch user notifications
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, parsed.data),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        hasMore: notifications.length === parsed.data.limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Mark all as read
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, category } = body;

    if (action === "mark_all_read") {
      const success = await markAllAsRead(session.user.id, category);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing notification action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
