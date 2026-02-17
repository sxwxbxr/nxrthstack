import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsEquipment } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateEquipment } from "@/lib/gamehub/tactics/equipment";
import { canFuseRarity, getFusionCost, getNextRarity } from "@/lib/gamehub/tactics/fusion";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";
import type { EquipmentSlot } from "@/lib/gamehub/tactics/types";

/** POST - Fuse 3 same-rarity equipment into 1 of next rarity */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentIds } = body as { equipmentIds: string[] };

    if (!Array.isArray(equipmentIds) || equipmentIds.length !== 3) {
      return NextResponse.json({ error: "Must provide exactly 3 equipment IDs" }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Fetch the 3 items
    const items = await db
      .select()
      .from(tacticsEquipment)
      .where(
        and(
          eq(tacticsEquipment.playerId, player.id),
          inArray(tacticsEquipment.id, equipmentIds)
        )
      );

    if (items.length !== 3) {
      return NextResponse.json({ error: "Some equipment not found" }, { status: 404 });
    }

    // All must be same rarity
    const rarity = items[0].rarity as Rarity;
    if (!items.every((i) => i.rarity === rarity)) {
      return NextResponse.json({ error: "All 3 items must be the same rarity" }, { status: 400 });
    }

    // Must be fusable
    if (!canFuseRarity(rarity)) {
      return NextResponse.json({ error: "Cannot fuse this rarity" }, { status: 400 });
    }

    // Must be unequipped
    if (items.some((i) => i.unitInstanceId !== null)) {
      return NextResponse.json({ error: "All items must be unequipped" }, { status: 400 });
    }

    const cost = getFusionCost(rarity);
    if (player.currency < cost) {
      return NextResponse.json({ error: "Not enough currency" }, { status: 400 });
    }

    const nextRarity = getNextRarity(rarity)!;
    const slot = items[0].slot as EquipmentSlot; // New item inherits first item's slot

    // Generate new item at higher rarity
    const seed = Math.floor(Math.random() * 2147483647);
    const generated = generateEquipment(slot, nextRarity, seed);

    // Delete the 3 items
    await db
      .delete(tacticsEquipment)
      .where(inArray(tacticsEquipment.id, equipmentIds));

    // Deduct cost
    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency - cost })
      .where(eq(tacticsPlayers.id, player.id));

    // Create new item
    const [newEquip] = await db
      .insert(tacticsEquipment)
      .values({
        playerId: player.id,
        slot: generated.slot,
        name: generated.name,
        rarity: generated.rarity,
        stats: generated.stats,
        enchantLevel: 0,
        cursed: false,
        curseStats: [],
      })
      .returning();

    return NextResponse.json({
      equipment: newEquip,
      fusedRarity: nextRarity,
      costPaid: cost,
      currencyRemaining: player.currency - cost,
    });
  } catch (error) {
    console.error("Error fusing equipment:", error);
    return NextResponse.json({ error: "Failed to fuse equipment" }, { status: 500 });
  }
}
