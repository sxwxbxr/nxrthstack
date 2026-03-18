import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcAccessCodes, mcServers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Check admin role from DB
  const { users } = await import("@/lib/db/schema");
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") return null;
  return session.user.id;
}

/**
 * GET /api/admin/gamehub/minecraft/access-codes
 */
export async function GET() {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const codes = await db
      .select({
        id: mcAccessCodes.id,
        code: mcAccessCodes.code,
        label: mcAccessCodes.label,
        defaultRole: mcAccessCodes.defaultRole,
        maxUses: mcAccessCodes.maxUses,
        usedCount: mcAccessCodes.currentUses,
        isActive: mcAccessCodes.isActive,
        expiresAt: mcAccessCodes.expiresAt,
        createdAt: mcAccessCodes.createdAt,
        serverName: mcServers.name,
        serverId: mcAccessCodes.serverId,
      })
      .from(mcAccessCodes)
      .leftJoin(mcServers, eq(mcAccessCodes.serverId, mcServers.id))
      .orderBy(desc(mcAccessCodes.createdAt));

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Error fetching access codes:", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

/**
 * POST /api/admin/gamehub/minecraft/access-codes
 */
export async function POST(request: Request) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { serverId, label, defaultRole, maxUses, expiresAt } =
      await request.json();

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId is required" },
        { status: 400 }
      );
    }

    const code = `NXRTH-MC-${nanoid(6).toUpperCase()}`;

    const [created] = await db
      .insert(mcAccessCodes)
      .values({
        serverId,
        code,
        label: label || null,
        defaultRole: defaultRole || "viewer",
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: userId,
      })
      .returning();

    return NextResponse.json({ code: created });
  } catch (error) {
    console.error("Error creating access code:", error);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }
}
