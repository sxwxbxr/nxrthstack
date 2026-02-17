import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsUnitInstances, tacticsEquipment } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/** GET - Fetch all unit instances for player (with their equipment) */
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

    const instances = await db
      .select()
      .from(tacticsUnitInstances)
      .where(eq(tacticsUnitInstances.playerId, player.id));

    // Get all equipment to map to instances
    const equipment = await db
      .select()
      .from(tacticsEquipment)
      .where(eq(tacticsEquipment.playerId, player.id));

    // Group equipment by unitInstanceId
    const equipmentByUnit: Record<string, typeof equipment> = {};
    for (const equip of equipment) {
      if (equip.unitInstanceId) {
        if (!equipmentByUnit[equip.unitInstanceId]) {
          equipmentByUnit[equip.unitInstanceId] = [];
        }
        equipmentByUnit[equip.unitInstanceId].push(equip);
      }
    }

    const result = instances.map((inst) => ({
      ...inst,
      equipment: equipmentByUnit[inst.id] ?? [],
    }));

    return NextResponse.json({ units: result });
  } catch (error) {
    console.error("Error fetching unit instances:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}
