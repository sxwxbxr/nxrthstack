import { auth } from "@/lib/auth";
import { db, tacticsEquipment } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

/** POST - Add equipment to a player */
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
    const { slot, name, rarity, stats = [], unitInstanceId = null } = body;

    if (!slot || !name || !rarity) {
      return NextResponse.json({ error: "Missing required fields (slot, name, rarity)" }, { status: 400 });
    }

    const [item] = await db
      .insert(tacticsEquipment)
      .values({ playerId, slot, name, rarity, stats, unitInstanceId })
      .returning();

    return NextResponse.json({ equipment: item });
  } catch (error) {
    console.error("Error adding equipment:", error);
    return NextResponse.json({ error: "Failed to add equipment" }, { status: 500 });
  }
}

/** DELETE - Remove equipment */
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
    const equipmentId = searchParams.get("equipmentId");

    if (!equipmentId) {
      return NextResponse.json({ error: "Missing equipmentId" }, { status: 400 });
    }

    await db
      .delete(tacticsEquipment)
      .where(
        and(
          eq(tacticsEquipment.id, equipmentId),
          eq(tacticsEquipment.playerId, playerId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
  }
}
