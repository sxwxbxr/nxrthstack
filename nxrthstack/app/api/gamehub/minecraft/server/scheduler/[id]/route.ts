import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  agentFetch,
  getMcServerAccess,
  hasMinRole,
  logMcEvent,
} from "@/lib/gamehub/minecraft";
import { db } from "@/lib/db";
import { mcScheduledActions, gamingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/gamehub/minecraft/server/scheduler/[id]
 * Cancel a scheduled session and all its actions.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find scheduled actions for this session
    const actions = await db
      .select()
      .from(mcScheduledActions)
      .where(eq(mcScheduledActions.sessionId, id));

    if (actions.length === 0) {
      // Maybe the id is a direct action id
      const [directAction] = await db
        .select()
        .from(mcScheduledActions)
        .where(eq(mcScheduledActions.id, id))
        .limit(1);

      if (!directAction) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      const access = await getMcServerAccess(
        session.user.id,
        directAction.serverId
      );
      if (
        !access.hasAccess ||
        !access.role ||
        !hasMinRole(access.role, "operator")
      ) {
        return NextResponse.json(
          { error: "Operator role required" },
          { status: 403 }
        );
      }

      await db
        .update(mcScheduledActions)
        .set({ status: "cancelled" })
        .where(eq(mcScheduledActions.id, id));

      return NextResponse.json({ success: true });
    }

    const serverId = actions[0].serverId;
    const access = await getMcServerAccess(session.user.id, serverId);
    if (
      !access.hasAccess ||
      !access.role ||
      !hasMinRole(access.role, "operator")
    ) {
      return NextResponse.json(
        { error: "Operator role required" },
        { status: 403 }
      );
    }

    // Cancel all pending actions for this session
    for (const action of actions) {
      if (action.status === "pending") {
        await db
          .update(mcScheduledActions)
          .set({ status: "cancelled" })
          .where(eq(mcScheduledActions.id, action.id));
      }
    }

    // Cancel the gaming session
    const sessionId = actions[0].sessionId;
    if (sessionId) {
      await db
        .update(gamingSessions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(gamingSessions.id, sessionId));
    }

    // Notify agent
    try {
      await agentFetch(
        serverId,
        `/scheduler/${sessionId ?? id}`,
        session.user.id,
        access.role,
        { method: "DELETE" }
      );
    } catch {
      // Agent might be offline
    }

    await logMcEvent(
      serverId,
      session.user.id,
      "schedule_cancel",
      "scheduler",
      { sessionId: sessionId ?? id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return NextResponse.json(
      { error: "Failed to cancel schedule" },
      { status: 500 }
    );
  }
}
