import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcAccessGrants, mcServers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") return null;
  return session.user.id;
}

/**
 * GET /api/admin/gamehub/minecraft/access-grants
 */
export async function GET() {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const grants = await db
      .select({
        id: mcAccessGrants.id,
        userId: mcAccessGrants.userId,
        serverId: mcAccessGrants.serverId,
        role: mcAccessGrants.role,
        grantedAt: mcAccessGrants.createdAt,
        userName: users.name,
        userEmail: users.email,
        serverName: mcServers.name,
      })
      .from(mcAccessGrants)
      .leftJoin(users, eq(mcAccessGrants.userId, users.id))
      .leftJoin(mcServers, eq(mcAccessGrants.serverId, mcServers.id))
      .orderBy(desc(mcAccessGrants.createdAt));

    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Error fetching access grants:", error);
    return NextResponse.json({ error: "Failed to fetch grants" }, { status: 500 });
  }
}

/**
 * POST /api/admin/gamehub/minecraft/access-grants
 * Direct grant (admin grants access to a user without code).
 */
export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, serverId, role } = await request.json();
    if (!userId || !serverId || !role) {
      return NextResponse.json(
        { error: "userId, serverId, and role are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(mcAccessGrants)
      .values({
        userId,
        serverId,
        role,
        grantedById: adminId,
      })
      .onConflictDoUpdate({
        target: [mcAccessGrants.userId, mcAccessGrants.serverId],
        set: { role },
      })
      .returning();

    return NextResponse.json({ grant: created });
  } catch (error) {
    console.error("Error creating access grant:", error);
    return NextResponse.json({ error: "Failed to create grant" }, { status: 500 });
  }
}
