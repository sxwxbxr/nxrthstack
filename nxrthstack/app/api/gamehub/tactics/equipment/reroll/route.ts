import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsEquipment } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { rerollStats, getRerollCost } from "@/lib/gamehub/tactics/equipment";
import type { EquipmentItem, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

/** POST - Reroll equipment stats (with optional locked indices) */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, lockedIndices } = body as {
      equipmentId: string;
      lockedIndices: number[];
    };

    if (!equipmentId) {
      return NextResponse.json({ error: "Missing equipmentId" }, { status: 400 });
    }

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
      .where(and(eq(tacticsEquipment.id, equipmentId), eq(tacticsEquipment.playerId, player.id)));

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    const locked = Array.isArray(lockedIndices) ? lockedIndices : [];
    const cost = getRerollCost(equipment.rarity as Rarity, locked.length);

    if (player.currency < cost) {
      return NextResponse.json({ error: "Not enough currency" }, { status: 400 });
    }

    // Reconstruct EquipmentItem for reroll function
    const equipItem: EquipmentItem = {
      id: equipment.id,
      slot: equipment.slot as EquipmentItem["slot"],
      name: equipment.name,
      rarity: equipment.rarity as Rarity,
      stats: equipment.stats as EquipmentStat[],
      enchantLevel: equipment.enchantLevel,
      cursed: equipment.cursed,
      curseStats: equipment.curseStats as EquipmentStat[],
      equipmentLevel: equipment.equipmentLevel,
      equipmentXp: equipment.equipmentXp,
    };

    const seed = Math.floor(Math.random() * 2147483647);
    const newStats = rerollStats(equipItem, locked, seed);

    // Deduct currency and update stats
    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency - cost })
      .where(eq(tacticsPlayers.id, player.id));

    const [updated] = await db
      .update(tacticsEquipment)
      .set({ stats: newStats })
      .where(eq(tacticsEquipment.id, equipmentId))
      .returning();

    return NextResponse.json({
      equipment: updated,
      costPaid: cost,
      currencyRemaining: player.currency - cost,
    });
  } catch (error) {
    console.error("Error rerolling equipment:", error);
    return NextResponse.json({ error: "Failed to reroll equipment" }, { status: 500 });
  }
}
