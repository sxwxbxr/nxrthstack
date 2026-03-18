import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getMcServerAccess } from "@/lib/gamehub/minecraft";
import { db } from "@/lib/db";
import { mcServerEvents, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/gamehub/minecraft/server/events?serverId=xxx&limit=50&offset=0&category=...
 * Returns paginated server events (audit log).
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");

    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role) {
      return NextResponse.json({ error: "No server access" }, { status: 403 });
    }

    const conditions = [eq(mcServerEvents.serverId, serverId)];
    if (category) {
      conditions.push(eq(mcServerEvents.category, category));
    }

    const events = await db
      .select({
        id: mcServerEvents.id,
        action: mcServerEvents.action,
        category: mcServerEvents.category,
        details: mcServerEvents.details,
        createdAt: mcServerEvents.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(mcServerEvents)
      .leftJoin(users, eq(mcServerEvents.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(mcServerEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mcServerEvents)
      .where(and(...conditions));

    return NextResponse.json({ events, total: Number(count) });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
