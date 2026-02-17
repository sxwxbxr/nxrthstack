import { auth } from "@/lib/auth";
import { db, tacticsPlayers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { parseTacticsScript } from "@/lib/gamehub/tactics/tacticsscript/parser";
import type { Squad, SquadUnit } from "@/lib/gamehub/tactics/types";

interface RouteParams {
  params: Promise<{ unitInstanceId: string }>;
}

function findUnitInSquads(
  attackSquad: Squad | null,
  defenseSquad: Squad | null,
  instanceId: string
): { unit: SquadUnit; squadType: "attack" | "defense" } | null {
  if (attackSquad?.units) {
    const unit = attackSquad.units.find((u) => u.instanceId === instanceId);
    if (unit) return { unit, squadType: "attack" };
  }
  if (defenseSquad?.units) {
    const unit = defenseSquad.units.find((u) => u.instanceId === instanceId);
    if (unit) return { unit, squadType: "defense" };
  }
  return null;
}

/** GET - Fetch behavior script for a specific unit */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitInstanceId } = await params;

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const result = findUnitInSquads(
      player.attackSquad as Squad | null,
      player.defenseSquad as Squad | null,
      unitInstanceId
    );

    if (!result) {
      return NextResponse.json({ error: "Unit not found in any squad" }, { status: 404 });
    }

    const template = ALL_UNITS[result.unit.templateId];

    return NextResponse.json({
      instanceId: unitInstanceId,
      templateId: result.unit.templateId,
      squadType: result.squadType,
      behaviorRules: result.unit.behaviorRules,
      behaviorScript: result.unit.behaviorScript ?? "",
      template: template
        ? {
            name: template.name,
            class: template.class,
            abilities: template.abilities.map((a) => ({
              id: a.id,
              name: a.name,
              cooldownTicks: a.cooldownTicks,
              description: a.description,
              effectType: a.effectType,
              range: a.range,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching script:", error);
    return NextResponse.json({ error: "Failed to fetch script" }, { status: 500 });
  }
}

/** PUT - Save behavior script for a specific unit */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitInstanceId } = await params;
    const body = await request.json();
    const { script } = body as { script: string };

    if (typeof script !== "string") {
      return NextResponse.json({ error: "Script must be a string" }, { status: 400 });
    }

    // Parse and validate
    const parseResult = parseTacticsScript(script);
    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: "Script has errors",
        parseErrors: parseResult.errors,
      }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const attackSquad = player.attackSquad as Squad | null;
    const defenseSquad = player.defenseSquad as Squad | null;

    const result = findUnitInSquads(attackSquad, defenseSquad, unitInstanceId);
    if (!result) {
      return NextResponse.json({ error: "Unit not found in any squad" }, { status: 404 });
    }

    // Update the unit's behavior in the correct squad
    const squad = result.squadType === "attack" ? attackSquad : defenseSquad;
    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    const updatedUnits = squad.units.map((u) => {
      if (u.instanceId === unitInstanceId) {
        return {
          ...u,
          behaviorRules: parseResult.rules,
          behaviorScript: script,
        };
      }
      return u;
    });

    const updatedSquad: Squad = { units: updatedUnits };
    const updateData = result.squadType === "attack"
      ? { attackSquad: updatedSquad, updatedAt: new Date() }
      : { defenseSquad: updatedSquad, updatedAt: new Date() };

    await db
      .update(tacticsPlayers)
      .set(updateData)
      .where(eq(tacticsPlayers.userId, session.user.id));

    return NextResponse.json({
      success: true,
      rules: parseResult.rules,
      ruleCount: parseResult.rules.length,
    });
  } catch (error) {
    console.error("Error saving script:", error);
    return NextResponse.json({ error: "Failed to save script" }, { status: 500 });
  }
}
