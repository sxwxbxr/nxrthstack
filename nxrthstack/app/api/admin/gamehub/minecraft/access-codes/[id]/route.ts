import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcAccessCodes, users } from "@/lib/db/schema";
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
 * PATCH /api/admin/gamehub/minecraft/access-codes/[id]
 * Deactivate a code.
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
    const body = await request.json();

    await db
      .update(mcAccessCodes)
      .set({ isActive: body.isActive ?? false })
      .where(eq(mcAccessCodes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating access code:", error);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/gamehub/minecraft/access-codes/[id]
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
    await db.delete(mcAccessCodes).where(eq(mcAccessCodes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting access code:", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
