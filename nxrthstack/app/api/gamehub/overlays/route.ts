import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamOverlays } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// GET - List user's overlays
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const overlays = await db
      .select()
      .from(streamOverlays)
      .where(eq(streamOverlays.userId, session.user.id));

    return NextResponse.json({ overlays });
  } catch (error) {
    console.error("Error fetching overlays:", error);
    return NextResponse.json(
      { error: "Failed to fetch overlays" },
      { status: 500 }
    );
  }
}

// POST - Create a new overlay
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, name, config } = await request.json();

    if (!type || !name) {
      return NextResponse.json(
        { error: "Type and name are required" },
        { status: 400 }
      );
    }

    const validTypes = ["shiny_counter", "r6_stats", "pokemon_team"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid overlay type" },
        { status: 400 }
      );
    }

    // Generate unique access token
    const accessToken = crypto.randomBytes(24).toString("hex");

    const [overlay] = await db
      .insert(streamOverlays)
      .values({
        userId: session.user.id,
        type,
        name,
        config: config || {},
        accessToken,
      })
      .returning();

    return NextResponse.json({ overlay });
  } catch (error) {
    console.error("Error creating overlay:", error);
    return NextResponse.json(
      { error: "Failed to create overlay" },
      { status: 500 }
    );
  }
}

// PATCH - Update an overlay
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, config, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Overlay ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(streamOverlays)
      .where(
        and(
          eq(streamOverlays.id, id),
          eq(streamOverlays.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Overlay not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = config;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [overlay] = await db
      .update(streamOverlays)
      .set(updateData)
      .where(eq(streamOverlays.id, id))
      .returning();

    return NextResponse.json({ overlay });
  } catch (error) {
    console.error("Error updating overlay:", error);
    return NextResponse.json(
      { error: "Failed to update overlay" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an overlay
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Overlay ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    await db
      .delete(streamOverlays)
      .where(
        and(
          eq(streamOverlays.id, id),
          eq(streamOverlays.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting overlay:", error);
    return NextResponse.json(
      { error: "Failed to delete overlay" },
      { status: 500 }
    );
  }
}
