import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, clipComments, clips, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Check if clip exists
    const clip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const comments = await db
      .select({
        id: clipComments.id,
        content: clipComments.content,
        createdAt: clipComments.createdAt,
        userId: clipComments.userId,
        userName: users.name,
        userDiscordAvatar: users.discordAvatar,
      })
      .from(clipComments)
      .leftJoin(users, eq(clipComments.userId, users.id))
      .where(eq(clipComments.clipId, id))
      .orderBy(desc(clipComments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if clip exists
    const clip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const [newComment] = await db
      .insert(clipComments)
      .values({
        clipId: id,
        userId: session.user.id,
        content: parsed.data.content,
      })
      .returning();

    // Get user info for the response
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        name: true,
        discordAvatar: true,
      },
    });

    return NextResponse.json({
      comment: {
        ...newComment,
        userName: user?.name,
        userDiscordAvatar: user?.discordAvatar,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
