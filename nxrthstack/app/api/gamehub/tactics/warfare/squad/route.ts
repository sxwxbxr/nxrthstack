import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsUnitInstances } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import type { Squad } from "@/lib/gamehub/tactics/types";

const MIN_SQUAD_SIZE = 5;
const MAX_SQUAD_SIZE = 10;
const GRID_WIDTH = 8;
const ATTACKER_DEPLOY_ROWS = [5, 6, 7]; // 3 rows for 10 units
const DEFENDER_DEPLOY_ROWS = [0, 1, 2];

function validateWarfareSquad(
  squad: Squad,
  unlockedUnitIds: string[],
  squadType: "attack" | "defense"
): string | null {
  if (!squad?.units || !Array.isArray(squad.units)) {
    return "Invalid squad format";
  }

  if (squad.units.length < MIN_SQUAD_SIZE || squad.units.length > MAX_SQUAD_SIZE) {
    return `Warfare squad must have ${MIN_SQUAD_SIZE}-${MAX_SQUAD_SIZE} units`;
  }

  const deployRows = squadType === "attack" ? ATTACKER_DEPLOY_ROWS : DEFENDER_DEPLOY_ROWS;
  const positionSet = new Set<string>();

  for (const unit of squad.units) {
    if (!ALL_UNITS[unit.templateId]) {
      return `Unknown unit template: ${unit.templateId}`;
    }
    if (!unlockedUnitIds.includes(unit.templateId)) {
      return `Unit not unlocked: ${unit.templateId}`;
    }

    if (
      unit.position.x < 0 || unit.position.x >= GRID_WIDTH ||
      !deployRows.includes(unit.position.y)
    ) {
      return `Invalid position for ${unit.templateId}: must be in warfare deployment zone`;
    }

    const posKey = `${unit.position.x},${unit.position.y}`;
    if (positionSet.has(posKey)) {
      return `Duplicate position: ${posKey}`;
    }
    positionSet.add(posKey);

    if (unit.behaviorRules && unit.behaviorRules.length > 10) {
      return `Too many behavior rules for ${unit.templateId} (max 10)`;
    }
  }

  return null;
}

async function validateUnitInstances(
  squad: Squad,
  playerId: string
): Promise<string | null> {
  const instanceIds = squad.units
    .map((u) => u.unitInstanceId)
    .filter((id): id is string => !!id);

  if (instanceIds.length === 0) return null;

  const instances = await db
    .select({ id: tacticsUnitInstances.id, templateId: tacticsUnitInstances.templateId })
    .from(tacticsUnitInstances)
    .where(
      and(
        eq(tacticsUnitInstances.playerId, playerId),
        inArray(tacticsUnitInstances.id, instanceIds)
      )
    );

  const foundIds = new Set(instances.map((i) => i.id));

  for (const unit of squad.units) {
    if (!unit.unitInstanceId) continue;
    if (!foundIds.has(unit.unitInstanceId)) {
      return `Unit instance not found: ${unit.unitInstanceId}`;
    }
    const inst = instances.find((i) => i.id === unit.unitInstanceId);
    if (inst && inst.templateId !== unit.templateId) {
      return `Unit instance ${unit.unitInstanceId} is a ${inst.templateId}, not ${unit.templateId}`;
    }
  }

  return null;
}

/** GET - Fetch warfare squads */
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

    return NextResponse.json({
      warfareAttackSquad: player.warfareAttackSquad,
      warfareDefenseSquad: player.warfareDefenseSquad,
      unlockedUnitIds: player.unlockedUnitIds,
      warfareRating: player.warfareRating,
      warfareWins: player.warfareWins,
      warfareLosses: player.warfareLosses,
    });
  } catch (error) {
    console.error("Error fetching warfare squads:", error);
    return NextResponse.json({ error: "Failed to fetch warfare squads" }, { status: 500 });
  }
}

/** PUT - Save warfare attack or defense squad */
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
    const validationError = validateWarfareSquad(squad, unlockedIds, type);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const instanceError = await validateUnitInstances(squad, player.id);
    if (instanceError) {
      return NextResponse.json({ error: instanceError }, { status: 400 });
    }

    const updateData = type === "attack"
      ? { warfareAttackSquad: squad, updatedAt: new Date() }
      : { warfareDefenseSquad: squad, updatedAt: new Date() };

    const [updated] = await db
      .update(tacticsPlayers)
      .set(updateData)
      .where(eq(tacticsPlayers.userId, session.user.id))
      .returning();

    return NextResponse.json({
      success: true,
      squad: type === "attack" ? updated.warfareAttackSquad : updated.warfareDefenseSquad,
    });
  } catch (error) {
    console.error("Error saving warfare squad:", error);
    return NextResponse.json({ error: "Failed to save warfare squad" }, { status: 500 });
  }
}
