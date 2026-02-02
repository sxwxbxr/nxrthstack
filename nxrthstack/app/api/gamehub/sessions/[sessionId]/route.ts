import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSession,
  getSessionRsvps,
  updateRsvp,
  cancelSession,
} from "@/lib/gamehub/sessions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userSession = await auth();
    const { searchParams } = new URL(request.url);
    const includeRsvps = searchParams.get("rsvps") === "true";

    const session = await getSession(sessionId, userSession?.user?.id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user can view private session
    if (session.isPrivate && session.host.id !== userSession?.user?.id) {
      // Check if user has RSVP or invite
      if (!session.userRsvp) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (includeRsvps) {
      const rsvps = await getSessionRsvps(sessionId);
      return NextResponse.json({ ...session, rsvps });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userSession = await auth();

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, status, note } = body;

    if (action === "rsvp") {
      if (!status || !["going", "maybe", "not_going"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid RSVP status" },
          { status: 400 }
        );
      }

      await updateRsvp(sessionId, userSession.user.id, status, note);
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      await cancelSession(sessionId, userSession.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update session:", error);
    const message = error instanceof Error ? error.message : "Failed to update session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
