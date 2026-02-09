import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, storedRoms, romConfigs, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Download ROM data
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is friend or admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || (user.role !== "admin" && !user.isFriend)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the ROM
    const rom = await db.query.storedRoms.findFirst({
      where: and(eq(storedRoms.id, id), eq(storedRoms.isActive, true)),
    });

    if (!rom) {
      return NextResponse.json({ error: "ROM not found" }, { status: 404 });
    }

    // Get the ROM config for additional info
    const config = await db.query.romConfigs.findFirst({
      where: eq(romConfigs.gameCode, rom.gameCode),
    });

    // Fetch the ROM data from storage
    const response = await fetch(rom.fileKey);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ROM data" },
        { status: 500 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      id: rom.id,
      displayName: rom.displayName,
      gameCode: rom.gameCode,
      gameName: config?.gameName || rom.gameCode,
      platform: config?.platform || "Unknown",
      generation: config?.generation || 0,
      data: base64Data,
      fileSizeBytes: rom.fileSizeBytes,
    });
  } catch (error) {
    console.error("Error fetching ROM:", error);
    return NextResponse.json(
      { error: "Failed to fetch ROM" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a stored ROM (admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get the ROM
    const rom = await db.query.storedRoms.findFirst({
      where: eq(storedRoms.id, id),
    });

    if (!rom) {
      return NextResponse.json({ error: "ROM not found" }, { status: 404 });
    }

    // Delete from NAS storage
    try {
      if (NAS_STORAGE_URL && NAS_API_KEY) {
        const fileUrl = new URL(rom.fileKey);
        const pathParts = fileUrl.pathname.replace("/files/", "").split("/");
        const filename = pathParts.pop();
        const folder = pathParts.join("/");

        await fetch(
          `${NAS_STORAGE_URL}/files/${filename}${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`,
          {
            method: "DELETE",
            headers: { "X-API-Key": NAS_API_KEY },
          }
        );
      }
    } catch (storageError) {
      console.error("Error deleting from NAS:", storageError);
      // Continue anyway - the DB record can still be deleted
    }

    // Delete from database
    await db.delete(storedRoms).where(eq(storedRoms.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ROM:", error);
    return NextResponse.json(
      { error: "Failed to delete ROM" },
      { status: 500 }
    );
  }
}
