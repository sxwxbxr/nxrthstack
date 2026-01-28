import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, featureRequests, featureVotes, users } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { unlockAchievement } from "@/lib/gamehub/unlock-achievement";

const createRequestSchema = z.object({
  type: z.enum(["feature", "bug"]),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  category: z.enum(["gamehub", "shop", "dashboard", "general"]).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";

    // Get all feature requests with vote counts
    const requests = await db
      .select({
        id: featureRequests.id,
        type: featureRequests.type,
        title: featureRequests.title,
        description: featureRequests.description,
        status: featureRequests.status,
        priority: featureRequests.priority,
        category: featureRequests.category,
        adminNotes: featureRequests.adminNotes,
        createdAt: featureRequests.createdAt,
        updatedAt: featureRequests.updatedAt,
        authorId: featureRequests.authorId,
        authorName: users.name,
        authorEmail: users.email,
        voteCount: sql<number>`(
          SELECT COUNT(*) FROM feature_votes
          WHERE feature_votes.request_id = ${featureRequests.id}
        )`.as("vote_count"),
      })
      .from(featureRequests)
      .leftJoin(users, eq(featureRequests.authorId, users.id))
      .orderBy(desc(sql`vote_count`), desc(featureRequests.createdAt));

    // Get user's votes
    const userVotes = await db
      .select({ requestId: featureVotes.requestId })
      .from(featureVotes)
      .where(eq(featureVotes.userId, session.user.id));

    const votedIds = new Set(userVotes.map((v) => v.requestId));

    // Format response (hide admin notes for non-admins)
    const formattedRequests = requests.map((r) => ({
      ...r,
      adminNotes: isAdmin ? r.adminNotes : undefined,
      hasVoted: votedIds.has(r.id),
      isOwner: r.authorId === session.user.id,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Failed to fetch feature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [newRequest] = await db
      .insert(featureRequests)
      .values({
        authorId: session.user.id,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category || "general",
      })
      .returning();

    // Unlock the feedback_submitted achievement
    await unlockAchievement(session.user.id, "feedback_submitted");

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Failed to create feature request:", error);
    return NextResponse.json(
      { error: "Failed to create feature request" },
      { status: 500 }
    );
  }
}
