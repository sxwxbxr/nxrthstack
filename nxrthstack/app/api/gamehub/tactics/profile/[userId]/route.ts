import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsUnitInstances, tacticsEquipment, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import type { Squad, EquipmentStat } from "@/lib/gamehub/tactics/types";
import type { Rarity } from "@/lib/gamehub/tactics/rarities";

/** GET - Public player profile (squads, units, equipment - NOT behavior rules) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Get player
    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, userId),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Get unit instances
    const unitInstances = await db
      .select()
      .from(tacticsUnitInstances)
      .where(eq(tacticsUnitInstances.playerId, player.id));

    // Get equipment
    const equipment = await db
      .select()
      .from(tacticsEquipment)
      .where(eq(tacticsEquipment.playerId, player.id));

    // Build squad info (without behavior rules!)
    const attackSquad = player.attackSquad as Squad | null;
    const defenseSquad = player.defenseSquad as Squad | null;

    function sanitizeSquad(squad: Squad | null) {
      if (!squad?.units) return null;
      return squad.units.map((u) => {
        const template = ALL_UNITS[u.templateId];
        const instance = unitInstances.find((i) => i.id === u.unitInstanceId);
        const unitEquip = equipment.filter((e) => e.unitInstanceId === u.unitInstanceId);
        return {
          templateId: u.templateId,
          name: template?.name ?? u.templateId,
          class: template?.class ?? "Unknown",
          instanceId: u.instanceId,
          position: u.position,
          rarity: (instance?.rarity ?? "common") as Rarity,
          level: instance?.level ?? 1,
          equipment: unitEquip.map((e) => ({
            id: e.id,
            slot: e.slot,
            name: e.name,
            rarity: e.rarity as Rarity,
            stats: e.stats as EquipmentStat[],
            enchantLevel: e.enchantLevel,
            equipmentLevel: e.equipmentLevel,
          })),
        };
      });
    }

    const winRate =
      player.totalWins + player.totalLosses > 0
        ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
        : 0;

    return NextResponse.json({
      profile: {
        userId,
        name: user?.name || "Unknown",
        rating: player.rating,
        totalWins: player.totalWins,
        totalLosses: player.totalLosses,
        winRate,
        campaignLevel: player.campaignLevel,
        warfareRating: player.warfareRating,
        warfareWins: player.warfareWins,
        warfareLosses: player.warfareLosses,
        attackSquad: sanitizeSquad(attackSquad),
        defenseSquad: sanitizeSquad(defenseSquad),
      },
    });
  } catch (error) {
    console.error("Error fetching player profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
