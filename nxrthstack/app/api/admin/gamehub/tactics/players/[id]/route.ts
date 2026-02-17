import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsUnitInstances, tacticsEquipment, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

/** GET - Full player detail */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, player.userId),
    });

    const unitInstances = await db
      .select()
      .from(tacticsUnitInstances)
      .where(eq(tacticsUnitInstances.playerId, playerId));

    const equipment = await db
      .select()
      .from(tacticsEquipment)
      .where(eq(tacticsEquipment.playerId, playerId));

    return NextResponse.json({
      player: {
        ...player,
        userName: user?.name,
        userEmail: user?.email,
      },
      unitInstances,
      equipment,
    });
  } catch (error) {
    console.error("Error fetching player detail:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

/** PATCH - Update player fields */
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

    // Allowed fields to update
    const allowedFields = [
      "rating", "currency", "campaignLevel",
      "warfareRating", "warfareWins", "warfareLosses",
      "totalWins", "totalLosses", "loginStreak",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(tacticsPlayers)
      .set(updates)
      .where(eq(tacticsPlayers.id, playerId))
      .returning();

    return NextResponse.json({ player: updated });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}
