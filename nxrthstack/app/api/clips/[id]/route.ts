import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, clips, clipLikes, clipComments, users } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const updateClipSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(["funny", "clutch", "fail", "tutorial", "highlight"]).optional(),
  isPublic: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    const clip = await db
      .select({
        id: clips.id,
        title: clips.title,
        description: clips.description,
        game: clips.game,
        category: clips.category,
        blobUrl: clips.blobUrl,
        thumbnailUrl: clips.thumbnailUrl,
        durationSeconds: clips.durationSeconds,
        viewCount: clips.viewCount,
        isFeatured: clips.isFeatured,
        isPublic: clips.isPublic,
        createdAt: clips.createdAt,
        userId: clips.userId,
        userName: users.name,
        userDiscordAvatar: users.discordAvatar,
        likeCount: sql<number>`(SELECT COUNT(*) FROM clip_likes WHERE clip_id = ${clips.id})`.as("like_count"),
        commentCount: sql<number>`(SELECT COUNT(*) FROM clip_comments WHERE clip_id = ${clips.id})`.as("comment_count"),
      })
      .from(clips)
      .leftJoin(users, eq(clips.userId, users.id))
      .where(eq(clips.id, id))
      .limit(1);

    if (clip.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clipData = clip[0];

    // Check if clip is private and user is not the owner
    if (!clipData.isPublic && clipData.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Check if current user has liked this clip
    let hasLiked = false;
    if (session?.user?.id) {
      const like = await db.query.clipLikes.findFirst({
        where: and(
          eq(clipLikes.clipId, id),
          eq(clipLikes.userId, session.user.id)
        ),
      });
      hasLiked = !!like;
    }

    // Increment view count (don't await to not slow down response)
    db.update(clips)
      .set({ viewCount: sql`${clips.viewCount} + 1` })
      .where(eq(clips.id, id))
      .execute();

    return NextResponse.json({
      clip: {
        ...clipData,
        hasLiked,
      },
    });
  } catch (error) {
    console.error("Failed to fetch clip:", error);
    return NextResponse.json(
      { error: "Failed to fetch clip" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateClipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check ownership
    const existingClip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
    });

    if (!existingClip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (existingClip.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedClip] = await db
      .update(clips)
      .set(parsed.data)
      .where(eq(clips.id, id))
      .returning();

    return NextResponse.json({ clip: updatedClip });
  } catch (error) {
    console.error("Failed to update clip:", error);
    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existingClip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
    });

    if (!existingClip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (existingClip.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(clips).where(eq(clips.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete clip:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 }
    );
  }
}
