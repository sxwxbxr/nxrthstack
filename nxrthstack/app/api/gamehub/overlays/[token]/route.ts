import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streamOverlays, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Fetch overlay data by token (public, no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const [overlay] = await db
      .select({
        id: streamOverlays.id,
        type: streamOverlays.type,
        name: streamOverlays.name,
        config: streamOverlays.config,
        isActive: streamOverlays.isActive,
        userId: streamOverlays.userId,
        userName: users.name,
      })
      .from(streamOverlays)
      .innerJoin(users, eq(streamOverlays.userId, users.id))
      .where(eq(streamOverlays.accessToken, token))
      .limit(1);

    if (!overlay) {
      return NextResponse.json(
        { error: "Overlay not found" },
        { status: 404 }
      );
    }

    if (!overlay.isActive) {
      return NextResponse.json(
        { error: "Overlay is disabled" },
        { status: 403 }
      );
    }

    return NextResponse.json({ overlay });
  } catch (error) {
    console.error("Error fetching overlay:", error);
    return NextResponse.json(
      { error: "Failed to fetch overlay" },
      { status: 500 }
    );
  }
}
