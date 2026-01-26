import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, featureRequests, featureVotes } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Toggle vote on a feature request
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify request exists
    const existingRequest = await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, id),
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await db.query.featureVotes.findFirst({
      where: and(
        eq(featureVotes.requestId, id),
        eq(featureVotes.userId, session.user.id)
      ),
    });

    if (existingVote) {
      // Remove vote
      await db
        .delete(featureVotes)
        .where(
          and(
            eq(featureVotes.requestId, id),
            eq(featureVotes.userId, session.user.id)
          )
        );

      return NextResponse.json({ voted: false });
    } else {
      // Add vote
      await db.insert(featureVotes).values({
        requestId: id,
        userId: session.user.id,
      });

      return NextResponse.json({ voted: true });
    }
  } catch (error) {
    console.error("Failed to toggle vote:", error);
    return NextResponse.json(
      { error: "Failed to toggle vote" },
      { status: 500 }
    );
  }
}
