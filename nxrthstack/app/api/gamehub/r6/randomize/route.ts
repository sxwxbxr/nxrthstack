import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Operators } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const randomizeSchema = z.object({
  role: z.enum(["attacker", "defender"]).optional(),
  excludeOperators: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = randomizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get all active operators
    let operators = await db.query.r6Operators.findMany({
      where: eq(r6Operators.isActive, true),
    });

    // Filter by role if specified
    if (parsed.data.role) {
      operators = operators.filter((op) => op.role === parsed.data.role);
    }

    // Exclude specific operators if specified
    if (parsed.data.excludeOperators && parsed.data.excludeOperators.length > 0) {
      operators = operators.filter(
        (op) => !parsed.data.excludeOperators!.includes(op.id)
      );
    }

    if (operators.length === 0) {
      return NextResponse.json(
        { error: "No operators available with the given filters" },
        { status: 400 }
      );
    }

    // Randomly select an operator
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];

    // Randomly select loadout
    const primaryWeapons = randomOperator.primaryWeapons as string[];
    const secondaryWeapons = randomOperator.secondaryWeapons as string[];
    const gadgets = randomOperator.gadgets as string[];
    const sights = randomOperator.sights as string[];
    const barrels = randomOperator.barrels as string[];
    const grips = randomOperator.grips as string[];
    const underbarrels = randomOperator.underbarrels as string[];

    const loadout = {
      primary:
        primaryWeapons.length > 0
          ? primaryWeapons[Math.floor(Math.random() * primaryWeapons.length)]
          : null,
      secondary:
        secondaryWeapons.length > 0
          ? secondaryWeapons[Math.floor(Math.random() * secondaryWeapons.length)]
          : null,
      gadget:
        gadgets.length > 0
          ? gadgets[Math.floor(Math.random() * gadgets.length)]
          : null,
    };

    const attachments = {
      sight:
        sights.length > 0
          ? sights[Math.floor(Math.random() * sights.length)]
          : null,
      barrel:
        barrels.length > 0
          ? barrels[Math.floor(Math.random() * barrels.length)]
          : null,
      grip:
        grips.length > 0
          ? grips[Math.floor(Math.random() * grips.length)]
          : null,
      underbarrel:
        underbarrels.length > 0
          ? underbarrels[Math.floor(Math.random() * underbarrels.length)]
          : null,
    };

    return NextResponse.json({
      operator: randomOperator,
      loadout,
      attachments,
    });
  } catch (error) {
    console.error("Failed to randomize operator:", error);
    return NextResponse.json(
      { error: "Failed to randomize operator" },
      { status: 500 }
    );
  }
}
