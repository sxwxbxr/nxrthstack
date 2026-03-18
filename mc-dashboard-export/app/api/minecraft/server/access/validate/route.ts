import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mcAccessCodes, mcAccessGrants } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redeemAccessCodeSchema } from "@/lib/gamehub/minecraft-schemas";
import { logMcEvent } from "@/lib/gamehub/minecraft";

/**
 * POST /api/gamehub/minecraft/server/access/validate
 * Redeem an access code to gain server access.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = redeemAccessCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // Find the access code
    const [accessCode] = await db
      .select()
      .from(mcAccessCodes)
      .where(eq(mcAccessCodes.code, code))
      .limit(1);

    if (!accessCode) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    if (!accessCode.isActive) {
      return NextResponse.json(
        { error: "This access code has been deactivated" },
        { status: 400 }
      );
    }

    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This access code has expired" },
        { status: 400 }
      );
    }

    if (
      accessCode.maxUses !== null &&
      accessCode.currentUses >= accessCode.maxUses
    ) {
      return NextResponse.json(
        { error: "This access code has been fully redeemed" },
        { status: 400 }
      );
    }

    // Check if user already has access to this server
    const [existingGrant] = await db
      .select()
      .from(mcAccessGrants)
      .where(
        and(
          eq(mcAccessGrants.userId, session.user.id),
          eq(mcAccessGrants.serverId, accessCode.serverId)
        )
      )
      .limit(1);

    if (existingGrant) {
      return NextResponse.json(
        { error: "You already have access to this server" },
        { status: 400 }
      );
    }

    // Create access grant
    const [grant] = await db
      .insert(mcAccessGrants)
      .values({
        serverId: accessCode.serverId,
        userId: session.user.id,
        role: accessCode.defaultRole,
        grantedViaCodeId: accessCode.id,
      })
      .returning();

    // Increment code usage
    await db
      .update(mcAccessCodes)
      .set({
        currentUses: sql`${mcAccessCodes.currentUses} + 1`,
      })
      .where(eq(mcAccessCodes.id, accessCode.id));

    // Log event
    await logMcEvent(
      accessCode.serverId,
      session.user.id,
      "access_granted",
      "access",
      { codeId: accessCode.id, codeLabel: accessCode.label, role: accessCode.defaultRole }
    );

    return NextResponse.json({
      success: true,
      grant: {
        id: grant.id,
        serverId: grant.serverId,
        role: grant.role,
      },
    });
  } catch (error) {
    console.error("Error redeeming access code:", error);
    return NextResponse.json(
      { error: "Failed to redeem access code" },
      { status: 500 }
    );
  }
}
