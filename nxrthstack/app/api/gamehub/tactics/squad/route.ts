import { auth } from "@/lib/auth";
import { db, tacticsPlayers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import type { Squad, SquadUnit } from "@/lib/gamehub/tactics/types";

const MIN_SQUAD_SIZE = 3;
const MAX_SQUAD_SIZE = 5;
const GRID_WIDTH = 8;
const ATTACKER_DEPLOY_ROWS = [6, 7];
const DEFENDER_DEPLOY_ROWS = [0, 1];

function validateSquad(
  squad: Squad,
  unlockedUnitIds: string[],
  squadType: "attack" | "defense"
): string | null {
  if (!squad?.units || !Array.isArray(squad.units)) {
    return "Invalid squad format";
  }

  if (squad.units.length < MIN_SQUAD_SIZE || squad.units.length > MAX_SQUAD_SIZE) {
    return `Squad must have ${MIN_SQUAD_SIZE}-${MAX_SQUAD_SIZE} units`;
  }

  const deployRows = squadType === "attack" ? ATTACKER_DEPLOY_ROWS : DEFENDER_DEPLOY_ROWS;
  const positionSet = new Set<string>();

  for (const unit of squad.units) {
    // Check unit template exists and is unlocked
    if (!ALL_UNITS[unit.templateId]) {
      return `Unknown unit template: ${unit.templateId}`;
    }
    if (!unlockedUnitIds.includes(unit.templateId)) {
      return `Unit not unlocked: ${unit.templateId}`;
    }

    // Check position is in deployment zone
    if (
      unit.position.x < 0 || unit.position.x >= GRID_WIDTH ||
      !deployRows.includes(unit.position.y)
    ) {
      return `Invalid position for ${unit.templateId}: must be in deployment zone`;
    }

    // Check no duplicate positions
    const posKey = `${unit.position.x},${unit.position.y}`;
    if (positionSet.has(posKey)) {
      return `Duplicate position: ${posKey}`;
    }
    positionSet.add(posKey);

    // Check behavior rules (max 5)
    if (unit.behaviorRules && unit.behaviorRules.length > 5) {
      return `Too many behavior rules for ${unit.templateId} (max 5)`;
    }
  }

  return null;
}

/** GET - Fetch both attack and defense squads */
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
      return NextResponse.json({ error: "Player not found. Visit tactics dashboard first." }, { status: 404 });
    }

    return NextResponse.json({
      attackSquad: player.attackSquad,
      defenseSquad: player.defenseSquad,
      unlockedUnitIds: player.unlockedUnitIds,
    });
  } catch (error) {
    console.error("Error fetching squads:", error);
    return NextResponse.json({ error: "Failed to fetch squads" }, { status: 500 });
  }
}

/** PUT - Save attack or defense squad */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, squad } = body as { type: "attack" | "defense"; squad: Squad };

    if (!type || !["attack", "defense"].includes(type)) {
      return NextResponse.json({ error: "Invalid squad type" }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const unlockedIds = player.unlockedUnitIds as string[];
    const validationError = validateSquad(squad, unlockedIds, type);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updateData = type === "attack"
      ? { attackSquad: squad, updatedAt: new Date() }
      : { defenseSquad: squad, updatedAt: new Date() };

    const [updated] = await db
      .update(tacticsPlayers)
      .set(updateData)
      .where(eq(tacticsPlayers.userId, session.user.id))
      .returning();

    return NextResponse.json({ success: true, squad: type === "attack" ? updated.attackSquad : updated.defenseSquad });
  } catch (error) {
    console.error("Error saving squad:", error);
    return NextResponse.json({ error: "Failed to save squad" }, { status: 500 });
  }
}
