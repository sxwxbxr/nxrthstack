import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsEquipment, tacticsUnitInstances } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getSellPrice } from "@/lib/gamehub/tactics/equipment";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

/** PATCH - Equip/unequip an item (set unitInstanceId) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { unitInstanceId } = body as { unitInstanceId: string | null };

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify equipment belongs to player
    const [equipment] = await db
      .select()
      .from(tacticsEquipment)
      .where(and(eq(tacticsEquipment.id, id), eq(tacticsEquipment.playerId, player.id)));

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // If equipping, verify unit instance belongs to player
    if (unitInstanceId) {
      const [unitInstance] = await db
        .select()
        .from(tacticsUnitInstances)
        .where(
          and(
            eq(tacticsUnitInstances.id, unitInstanceId),
            eq(tacticsUnitInstances.playerId, player.id)
          )
        );

      if (!unitInstance) {
        return NextResponse.json({ error: "Unit instance not found" }, { status: 404 });
      }

      // Unequip any existing item in this slot on this unit
      const existingInSlot = await db
        .select()
        .from(tacticsEquipment)
        .where(
          and(
            eq(tacticsEquipment.unitInstanceId, unitInstanceId),
            eq(tacticsEquipment.slot, equipment.slot),
            eq(tacticsEquipment.playerId, player.id)
          )
        );

      for (const existing of existingInSlot) {
        if (existing.id !== id) {
          await db
            .update(tacticsEquipment)
            .set({ unitInstanceId: null })
            .where(eq(tacticsEquipment.id, existing.id));
        }
      }
    }

    // Update equipment assignment
    const [updated] = await db
      .update(tacticsEquipment)
      .set({ unitInstanceId })
      .where(eq(tacticsEquipment.id, id))
      .returning();

    return NextResponse.json({ equipment: updated });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
  }
}

/** DELETE - Sell equipment */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify equipment belongs to player
    const [equipment] = await db
      .select()
      .from(tacticsEquipment)
      .where(and(eq(tacticsEquipment.id, id), eq(tacticsEquipment.playerId, player.id)));

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    const refund = getSellPrice(equipment.rarity as Rarity);

    // Delete equipment and refund currency
    await db.delete(tacticsEquipment).where(eq(tacticsEquipment.id, id));
    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency + refund })
      .where(eq(tacticsPlayers.id, player.id));

    return NextResponse.json({
      sold: true,
      refund,
      currencyRemaining: player.currency + refund,
    });
  } catch (error) {
    console.error("Error selling equipment:", error);
    return NextResponse.json({ error: "Failed to sell equipment" }, { status: 500 });
  }
}
