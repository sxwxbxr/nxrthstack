import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, storedRoms, romConfigs, users } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

// GET - List stored ROMs
export async function GET() {
  try {
    const session = await auth();

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

    // Get all active stored ROMs with their config info
    const roms = await db.query.storedRoms.findMany({
      where: eq(storedRoms.isActive, true),
      orderBy: [desc(storedRoms.createdAt)],
    });

    // Get ROM configs for additional metadata
    const configs = await db.query.romConfigs.findMany({
      where: eq(romConfigs.isActive, true),
    });

    const configMap = new Map(configs.map((c) => [c.gameCode, c]));

    const romsWithInfo = roms.map((rom) => {
      const config = configMap.get(rom.gameCode);
      return {
        id: rom.id,
        displayName: rom.displayName,
        gameCode: rom.gameCode,
        gameName: config?.gameName || rom.gameCode,
        platform: config?.platform || "Unknown",
        generation: config?.generation || 0,
        fileSizeBytes: rom.fileSizeBytes,
        createdAt: rom.createdAt,
      };
    });

    return NextResponse.json(romsWithInfo);
  } catch (error) {
    console.error("Error fetching stored ROMs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ROMs" },
      { status: 500 }
    );
  }
}

// POST - Upload a new ROM
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const displayName = formData.get("displayName") as string | null;
    const gameCode = formData.get("gameCode") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!displayName || !gameCode) {
      return NextResponse.json(
        { error: "Display name and game code are required" },
        { status: 400 }
      );
    }

    // Validate game code exists
    const config = await db.query.romConfigs.findFirst({
      where: eq(romConfigs.gameCode, gameCode),
    });

    if (!config) {
      return NextResponse.json(
        { error: "Invalid game code" },
        { status: 400 }
      );
    }

    // Validate file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".gb", ".gbc", ".gba"].includes(extension)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be .gb, .gbc, or .gba" },
        { status: 400 }
      );
    }

    // Validate file size (max 32MB)
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 32MB" },
        { status: 400 }
      );
    }

    // Calculate checksum
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Check if this exact ROM already exists
    const existingRom = await db.query.storedRoms.findFirst({
      where: and(
        eq(storedRoms.checksum, checksum),
        eq(storedRoms.isActive, true)
      ),
    });

    if (existingRom) {
      return NextResponse.json(
        { error: "This ROM has already been uploaded", existingId: existingRom.id },
        { status: 409 }
      );
    }

    // Upload to NAS storage
    if (!NAS_STORAGE_URL || !NAS_API_KEY) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    const nasFormData = new FormData();
    nasFormData.append("file", new Blob([arrayBuffer], { type: file.type || "application/octet-stream" }), file.name);

    const uploadResponse = await fetch(`${NAS_STORAGE_URL}/upload?folder=pokemon-roms`, {
      method: "POST",
      headers: {
        "X-API-Key": NAS_API_KEY,
      },
      body: nasFormData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.json().catch(() => ({ error: "Upload failed" }));
      console.error("NAS upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.error || "Failed to upload ROM" },
        { status: uploadResponse.status }
      );
    }

    const uploadResult = await uploadResponse.json();

    // Save to database
    const [newRom] = await db
      .insert(storedRoms)
      .values({
        gameCode,
        displayName,
        fileKey: uploadResult.url,
        fileSizeBytes: file.size,
        checksum,
        uploadedBy: session.user.id,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      id: newRom.id,
      displayName: newRom.displayName,
      gameCode: newRom.gameCode,
      gameName: config.gameName,
      platform: config.platform,
      generation: config.generation,
      fileSizeBytes: newRom.fileSizeBytes,
      createdAt: newRom.createdAt,
    });
  } catch (error) {
    console.error("Error uploading ROM:", error);
    return NextResponse.json(
      { error: "Failed to upload ROM" },
      { status: 500 }
    );
  }
}
