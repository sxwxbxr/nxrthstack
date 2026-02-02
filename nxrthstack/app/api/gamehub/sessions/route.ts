import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSession,
  getUpcomingSessions,
  getUserSessions,
} from "@/lib/gamehub/sessions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // 'upcoming' | 'my'

    if (view === "my") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userSessions = await getUserSessions(session.user.id);
      return NextResponse.json(userSessions);
    }

    // Default: upcoming sessions
    const sessions = await getUpcomingSessions(session?.user?.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      game,
      activityType,
      scheduledAt,
      durationMinutes,
      maxParticipants,
      isPrivate,
    } = body;

    if (!title || !game || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields: title, game, scheduledAt" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    const newSession = await createSession(session.user.id, {
      title,
      description,
      game,
      activityType,
      scheduledAt: scheduledDate,
      durationMinutes,
      maxParticipants,
      isPrivate,
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
