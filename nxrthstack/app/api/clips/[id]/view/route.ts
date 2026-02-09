import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, clips } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .update(clips)
      .set({ viewCount: sql`${clips.viewCount} + 1` })
      .where(eq(clips.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to increment view count:", error);
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
