import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";
import { db, clips, clipLikes, users } from "@/lib/db";
import { desc, eq, and, sql, ilike, or } from "drizzle-orm";
import { z } from "zod";

const createClipSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  game: z.string().min(1).max(50),
  category: z.enum(["funny", "clutch", "fail", "tutorial", "highlight"]).optional(),
  blobUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
  isPublic: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const game = searchParams.get("game");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");
    const featured = searchParams.get("featured") === "true";

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(clips.isPublic, true)];

    if (game) {
      conditions.push(eq(clips.game, game));
    }
    if (category) {
      conditions.push(eq(clips.category, category));
    }
    if (userId) {
      conditions.push(eq(clips.userId, userId));
    }
    if (featured) {
      conditions.push(eq(clips.isFeatured, true));
    }
    if (search) {
      conditions.push(
        or(
          ilike(clips.title, `%${search}%`),
          ilike(clips.description, `%${search}%`)
        )!
      );
    }

    const allClips = await db
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
        createdAt: clips.createdAt,
        userId: clips.userId,
        userName: users.name,
        userDiscordAvatar: users.discordAvatar,
        likeCount: sql<number>`(SELECT COUNT(*) FROM clip_likes WHERE clip_id = ${clips.id})`.as("like_count"),
        commentCount: sql<number>`(SELECT COUNT(*) FROM clip_comments WHERE clip_id = ${clips.id})`.as("comment_count"),
      })
      .from(clips)
      .leftJoin(users, eq(clips.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(clips.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clips)
      .where(and(...conditions));

    return NextResponse.json({
      clips: allClips,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getSessionWithUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createClipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [newClip] = await db
      .insert(clips)
      .values({
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        game: parsed.data.game,
        category: parsed.data.category || null,
        blobUrl: parsed.data.blobUrl,
        thumbnailUrl: parsed.data.thumbnailUrl || null,
        durationSeconds: parsed.data.durationSeconds || null,
        isPublic: parsed.data.isPublic,
      })
      .returning();

    return NextResponse.json({ clip: newClip }, { status: 201 });
  } catch (error) {
    console.error("Failed to create clip:", error);
    return NextResponse.json(
      { error: "Failed to create clip" },
      { status: 500 }
    );
  }
}
