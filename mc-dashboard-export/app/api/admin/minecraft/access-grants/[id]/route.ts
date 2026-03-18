import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcAccessGrants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
 * PATCH /api/admin/gamehub/minecraft/access-grants/[id]
 * Change a user's role.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    await db
      .update(mcAccessGrants)
      .set({ role })
      .where(eq(mcAccessGrants.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating grant:", error);
    return NextResponse.json({ error: "Failed to update grant" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/gamehub/minecraft/access-grants/[id]
 * Revoke access.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(mcAccessGrants).where(eq(mcAccessGrants.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking grant:", error);
    return NextResponse.json({ error: "Failed to revoke grant" }, { status: 500 });
  }
}
