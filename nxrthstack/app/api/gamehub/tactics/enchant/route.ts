import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsEquipment, tacticsEnchantHistory } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { attemptEnchant, getEnchantCost, getSuccessRate, MAX_ENCHANT_LEVEL } from "@/lib/gamehub/tactics/enchanting";
import type { EquipmentItem, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

/** POST - Attempt to enchant equipment */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, safe } = body as { equipmentId: string; safe?: boolean };

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

    if (equipment.enchantLevel >= MAX_ENCHANT_LEVEL) {
      return NextResponse.json({ error: "Equipment is at max enchant level" }, { status: 400 });
    }

    const cost = getEnchantCost(equipment.rarity as Rarity, equipment.enchantLevel, !!safe);
    if (player.currency < cost) {
      return NextResponse.json({ error: "Not enough currency" }, { status: 400 });
    }

    // Build EquipmentItem for the enchant function
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
    const result = attemptEnchant(equipItem, seed, !!safe);

    // Deduct currency
    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency - cost })
      .where(eq(tacticsPlayers.id, player.id));

    // Apply result to equipment
    const currentStats = equipment.stats as EquipmentStat[];
    const currentCurseStats = equipment.curseStats as EquipmentStat[];

    if (result.result === "success" && result.statBoost) {
      // Boost the stat on the equipment
      const boostedStats = currentStats.map((s) => {
        if (s.stat === result.statBoost!.stat) {
          return { ...s, value: s.value + result.statBoost!.value };
        }
        return s;
      });

      await db
        .update(tacticsEquipment)
        .set({
          enchantLevel: result.newEnchantLevel,
          stats: boostedStats,
        })
        .where(eq(tacticsEquipment.id, equipmentId));
    } else if (result.result === "curse" && result.curseStat) {
      // Add or worsen curse
      const existingCurseIdx = currentCurseStats.findIndex(
        (c) => c.stat === result.curseStat!.stat
      );
      let newCurseStats: EquipmentStat[];
      if (existingCurseIdx >= 0) {
        newCurseStats = currentCurseStats.map((c, i) =>
          i === existingCurseIdx
            ? { ...c, value: c.value + result.curseStat!.value }
            : c
        );
      } else {
        newCurseStats = [...currentCurseStats, result.curseStat];
      }

      await db
        .update(tacticsEquipment)
        .set({
          cursed: true,
          curseStats: newCurseStats,
        })
        .where(eq(tacticsEquipment.id, equipmentId));
    }
    // Neutral: no changes to equipment

    // Log enchant history
    await db.insert(tacticsEnchantHistory).values({
      playerId: player.id,
      equipmentId,
      result: result.result,
      costPaid: cost,
      details: {
        statBoost: result.statBoost ?? null,
        curseStat: result.curseStat ?? null,
        enchantLevel: result.newEnchantLevel,
      },
    });

    // Fetch updated equipment
    const [updated] = await db
      .select()
      .from(tacticsEquipment)
      .where(eq(tacticsEquipment.id, equipmentId));

    return NextResponse.json({
      result: result.result,
      equipment: updated,
      statBoost: result.statBoost ?? null,
      curseStat: result.curseStat ?? null,
      costPaid: cost,
      currencyRemaining: player.currency - cost,
    });
  } catch (error) {
    console.error("Error enchanting:", error);
    return NextResponse.json({ error: "Failed to enchant" }, { status: 500 });
  }
}

/** GET - Fetch enchant history for the player */
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

    const history = await db
      .select()
      .from(tacticsEnchantHistory)
      .where(eq(tacticsEnchantHistory.playerId, player.id))
      .orderBy(desc(tacticsEnchantHistory.createdAt))
      .limit(20);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching enchant history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
