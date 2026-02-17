import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsEquipment, tacticsUnitInstances } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateEquipment, EQUIPMENT_SHOP_PRICES, BUYABLE_RARITIES } from "@/lib/gamehub/tactics/equipment";
import type { EquipmentSlot } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";
import { ALL_EQUIPMENT_SLOTS } from "@/lib/gamehub/tactics/types";

/** GET - Fetch all equipment for player */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const equipment = await db
      .select()
      .from(tacticsEquipment)
      .where(eq(tacticsEquipment.playerId, player.id));

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

/** POST - Buy equipment from shop */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slot, rarity } = body as { slot: EquipmentSlot; rarity: Rarity };

    // Validate slot
    if (!ALL_EQUIPMENT_SLOTS.includes(slot)) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    // Validate rarity
    if (!BUYABLE_RARITIES.includes(rarity)) {
      return NextResponse.json({ error: "Invalid rarity" }, { status: 400 });
    }

    const price = EQUIPMENT_SHOP_PRICES[rarity];
    if (price <= 0) {
      return NextResponse.json({ error: "Cannot buy this rarity" }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (player.currency < price) {
      return NextResponse.json({ error: "Not enough currency" }, { status: 400 });
    }

    // Generate equipment with random seed
    const seed = Math.floor(Math.random() * 2147483647);
    const generated = generateEquipment(slot, rarity, seed);

    // Deduct currency and create equipment
    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency - price })
      .where(eq(tacticsPlayers.id, player.id));

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
      currencySpent: price,
      currencyRemaining: player.currency - price,
    });
  } catch (error) {
    console.error("Error buying equipment:", error);
    return NextResponse.json({ error: "Failed to buy equipment" }, { status: 500 });
  }
}
