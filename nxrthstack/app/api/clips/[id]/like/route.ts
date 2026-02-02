import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, clipLikes, clips } from "@/lib/db";
import { eq, and } from "drizzle-orm";

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

    // Check if clip exists
    const clip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await db.query.clipLikes.findFirst({
      where: and(
        eq(clipLikes.clipId, id),
        eq(clipLikes.userId, session.user.id)
      ),
    });

    if (existingLike) {
      // Unlike
      await db
        .delete(clipLikes)
        .where(
          and(
            eq(clipLikes.clipId, id),
            eq(clipLikes.userId, session.user.id)
          )
        );

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.insert(clipLikes).values({
        clipId: id,
        userId: session.user.id,
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
