import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsUnitInstances, tacticsWheelSpins } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { spinWheel, getWheelCost, getDuplicateCompensation } from "@/lib/gamehub/tactics/wheel";
import { UNIT_MAP } from "@/lib/gamehub/tactics/units";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

/** POST - Spin the lucky wheel */
export async function POST() {
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

    const cost = getWheelCost(player.wheelSpinCount);
    if (player.currency < cost) {
      return NextResponse.json({ error: "Not enough currency" }, { status: 400 });
    }

    // Spin!
    const seed = Math.floor(Math.random() * 2147483647);
    const result = spinWheel(seed);

    // Check if player already has this exact unit+rarity combo
    const existingInstance = await db
      .select()
      .from(tacticsUnitInstances)
      .where(
        and(
          eq(tacticsUnitInstances.playerId, player.id),
          eq(tacticsUnitInstances.templateId, result.templateId),
          eq(tacticsUnitInstances.rarity, result.rarity)
        )
      )
      .limit(1);

    const isDuplicate = existingInstance.length > 0;
    let compensation = 0;

    if (isDuplicate) {
      compensation = getDuplicateCompensation(cost);
    } else {
      // Create new unit instance
      await db.insert(tacticsUnitInstances).values({
        playerId: player.id,
        templateId: result.templateId,
        rarity: result.rarity,
        level: 1,
        xp: 0,
      });
    }

    // Deduct cost, add compensation if duplicate, increment spin count
    const newCurrency = player.currency - cost + compensation;
    await db
      .update(tacticsPlayers)
      .set({
        currency: newCurrency,
        wheelSpinCount: player.wheelSpinCount + 1,
      })
      .where(eq(tacticsPlayers.id, player.id));

    // Log spin
    await db.insert(tacticsWheelSpins).values({
      playerId: player.id,
      costPaid: cost,
      resultTemplateId: result.templateId,
      resultRarity: result.rarity,
      compensationCurrency: compensation,
    });

    const unitTemplate = UNIT_MAP[result.templateId];

    return NextResponse.json({
      result: {
        templateId: result.templateId,
        unitName: unitTemplate?.name ?? result.templateId,
        rarity: result.rarity,
        isDuplicate,
        compensation,
      },
      costPaid: cost,
      currencyRemaining: newCurrency,
      nextCost: getWheelCost(player.wheelSpinCount + 1),
    });
  } catch (error) {
    console.error("Error spinning wheel:", error);
    return NextResponse.json({ error: "Failed to spin wheel" }, { status: 500 });
  }
}

/** GET - Get wheel info and recent spins */
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

    const recentSpins = await db
      .select()
      .from(tacticsWheelSpins)
      .where(eq(tacticsWheelSpins.playerId, player.id))
      .orderBy(desc(tacticsWheelSpins.createdAt))
      .limit(10);

    // Get unit collection
    const instances = await db
      .select()
      .from(tacticsUnitInstances)
      .where(eq(tacticsUnitInstances.playerId, player.id));

    return NextResponse.json({
      cost: getWheelCost(player.wheelSpinCount),
      spinCount: player.wheelSpinCount,
      recentSpins: recentSpins.map((s) => ({
        id: s.id,
        templateId: s.resultTemplateId,
        unitName: UNIT_MAP[s.resultTemplateId]?.name ?? s.resultTemplateId,
        rarity: s.resultRarity,
        compensation: s.compensationCurrency,
        costPaid: s.costPaid,
        createdAt: s.createdAt.toISOString(),
      })),
      collection: instances.map((i) => ({
        templateId: i.templateId,
        rarity: i.rarity,
        level: i.level,
      })),
    });
  } catch (error) {
    console.error("Error fetching wheel data:", error);
    return NextResponse.json({ error: "Failed to fetch wheel data" }, { status: 500 });
  }
}
