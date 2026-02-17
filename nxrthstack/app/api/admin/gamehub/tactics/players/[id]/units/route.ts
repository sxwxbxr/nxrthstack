import { auth } from "@/lib/auth";
import { db, tacticsUnitInstances } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";

/** POST - Add a unit instance to a player */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;
    const body = await request.json();
    const { templateId, rarity = "common", level = 1 } = body;

    if (!templateId || !ALL_UNITS[templateId]) {
      return NextResponse.json({ error: "Invalid unit template" }, { status: 400 });
    }

    const [instance] = await db
      .insert(tacticsUnitInstances)
      .values({ playerId, templateId, rarity, level })
      .returning();

    return NextResponse.json({ instance });
  } catch (error) {
    console.error("Error adding unit:", error);
    return NextResponse.json({ error: "Failed to add unit" }, { status: 500 });
  }
}

/** PATCH - Update a unit instance */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;
    const body = await request.json();
    const { instanceId, rarity, level, xp } = body;

    if (!instanceId) {
      return NextResponse.json({ error: "Missing instanceId" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (rarity !== undefined) updates.rarity = rarity;
    if (level !== undefined) updates.level = level;
    if (xp !== undefined) updates.xp = xp;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(tacticsUnitInstances)
      .set(updates)
      .where(
        and(
          eq(tacticsUnitInstances.id, instanceId),
          eq(tacticsUnitInstances.playerId, playerId)
        )
      )
      .returning();

    return NextResponse.json({ instance: updated });
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

/** DELETE - Remove a unit instance */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
      return NextResponse.json({ error: "Missing instanceId" }, { status: 400 });
    }

    await db
      .delete(tacticsUnitInstances)
      .where(
        and(
          eq(tacticsUnitInstances.id, instanceId),
          eq(tacticsUnitInstances.playerId, playerId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
