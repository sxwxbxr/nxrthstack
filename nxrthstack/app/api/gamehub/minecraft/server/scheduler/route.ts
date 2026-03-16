import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  agentFetch,
  getMcServerAccess,
  hasMinRole,
  logMcEvent,
} from "@/lib/gamehub/minecraft";
import { db } from "@/lib/db";
import {
  mcScheduledActions,
  gamingSessions,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, gte, or } from "drizzle-orm";

/**
 * GET /api/gamehub/minecraft/server/scheduler?serverId=xxx
 * List scheduled sessions for a server.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId is required" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "No server access" },
        { status: 403 }
      );
    }

    // Get all scheduled actions grouped by sessionId
    const actions = await db
      .select({
        id: mcScheduledActions.id,
        serverId: mcScheduledActions.serverId,
        sessionId: mcScheduledActions.sessionId,
        action: mcScheduledActions.action,
        scheduledAt: mcScheduledActions.scheduledAt,
        payload: mcScheduledActions.payload,
        status: mcScheduledActions.status,
        executedAt: mcScheduledActions.executedAt,
        resultMessage: mcScheduledActions.resultMessage,
        createdAt: mcScheduledActions.createdAt,
        createdById: mcScheduledActions.createdById,
      })
      .from(mcScheduledActions)
      .where(eq(mcScheduledActions.serverId, serverId))
      .orderBy(desc(mcScheduledActions.scheduledAt));

    // Get associated gaming sessions
    const sessionIds = [
      ...new Set(actions.map((a) => a.sessionId).filter(Boolean)),
    ] as string[];

    const sessions =
      sessionIds.length > 0
        ? await db
            .select({
              id: gamingSessions.id,
              title: gamingSessions.title,
              scheduledAt: gamingSessions.scheduledAt,
              durationMinutes: gamingSessions.durationMinutes,
              status: gamingSessions.status,
              hostId: gamingSessions.hostId,
            })
            .from(gamingSessions)
            .where(or(...sessionIds.map((id) => eq(gamingSessions.id, id))))
        : [];

    // Get creator names
    const creatorIds = [...new Set(actions.map((a) => a.createdById))];
    const creators =
      creatorIds.length > 0
        ? await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(or(...creatorIds.map((id) => eq(users.id, id))))
        : [];

    // Group by session
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    const creatorMap = new Map(creators.map((c) => [c.id, c]));

    // Build grouped schedules
    const groupedBySession = new Map<
      string,
      typeof actions
    >();
    for (const action of actions) {
      const key = action.sessionId ?? action.id;
      if (!groupedBySession.has(key)) {
        groupedBySession.set(key, []);
      }
      groupedBySession.get(key)!.push(action);
    }

    const schedules = Array.from(groupedBySession.entries()).map(
      ([key, groupActions]) => {
        const firstAction = groupActions[0];
        const gs = firstAction.sessionId
          ? sessionMap.get(firstAction.sessionId)
          : null;

        const startAction = groupActions.find((a) => a.action === "start");
        const stopAction = groupActions.find((a) => a.action === "stop");
        const creator = creatorMap.get(firstAction.createdById);

        // Determine overall status
        const allExecuted = groupActions.every(
          (a) => a.status === "executed" || a.status === "cancelled"
        );
        const anyActive = groupActions.some(
          (a) => a.status === "executed" && a.action === "start"
        );
        const allCancelled = groupActions.every(
          (a) => a.status === "cancelled"
        );

        let status: "pending" | "active" | "completed" | "cancelled" =
          "pending";
        if (allCancelled) status = "cancelled";
        else if (allExecuted) status = "completed";
        else if (anyActive) status = "active";

        return {
          id: key,
          serverId: firstAction.serverId,
          sessionId: firstAction.sessionId,
          title: gs?.title ?? "Scheduled Session",
          scheduledAt: (
            startAction?.scheduledAt ?? firstAction.scheduledAt
          ).toISOString(),
          endTime: stopAction
            ? stopAction.scheduledAt.toISOString()
            : gs
              ? new Date(
                  gs.scheduledAt.getTime() +
                    (gs.durationMinutes ?? 60) * 60000
                ).toISOString()
              : firstAction.scheduledAt.toISOString(),
          status,
          createdBy: {
            id: firstAction.createdById,
            name: creator?.name ?? null,
          },
          actions: groupActions.map((a) => ({
            id: a.id,
            action: a.action,
            scheduledAt: a.scheduledAt.toISOString(),
            status: a.status,
            executedAt: a.executedAt?.toISOString() ?? null,
            resultMessage: a.resultMessage,
          })),
        };
      }
    );

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamehub/minecraft/server/scheduler
 * Create a new scheduled session with auto-start/stop/warnings.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      serverId,
      title,
      scheduledAt,
      durationMinutes,
      autoStart = true,
      autoStop = true,
      warnings = true,
    } = body;

    if (!serverId || !scheduledAt || !durationMinutes) {
      return NextResponse.json(
        { error: "serverId, scheduledAt, and durationMinutes are required" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role) {
      return NextResponse.json(
        { error: "No server access" },
        { status: 403 }
      );
    }

    if (!hasMinRole(access.role, "operator")) {
      return NextResponse.json(
        { error: "Operator role required to create schedules" },
        { status: 403 }
      );
    }

    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    const now = new Date();

    if (startTime <= now) {
      return NextResponse.json(
        { error: "Schedule must be in the future" },
        { status: 400 }
      );
    }

    // Create gaming session
    const [gamingSession] = await db
      .insert(gamingSessions)
      .values({
        hostId: session.user.id,
        title: title || "Minecraft Session",
        game: "minecraft",
        activityType: "casual",
        scheduledAt: startTime,
        durationMinutes,
      })
      .returning();

    // Build scheduled actions
    const actionsToCreate: {
      serverId: string;
      sessionId: string;
      createdById: string;
      action: string;
      scheduledAt: Date;
      payload: Record<string, unknown> | null;
    }[] = [];

    if (autoStart) {
      // Start 5 minutes before
      const autoStartTime = new Date(startTime.getTime() - 5 * 60000);
      actionsToCreate.push({
        serverId,
        sessionId: gamingSession.id,
        createdById: session.user.id,
        action: "start",
        scheduledAt: autoStartTime > now ? autoStartTime : startTime,
        payload: null,
      });
    }

    if (warnings) {
      // Warning at 5 minutes before end
      const warn5 = new Date(endTime.getTime() - 5 * 60000);
      if (warn5 > startTime) {
        actionsToCreate.push({
          serverId,
          sessionId: gamingSession.id,
          createdById: session.user.id,
          action: "rcon_command",
          scheduledAt: warn5,
          payload: {
            command:
              "say Server shutting down in 5 minutes! Save your progress.",
          },
        });
      }

      // Warning at 1 minute before end
      const warn1 = new Date(endTime.getTime() - 1 * 60000);
      if (warn1 > startTime) {
        actionsToCreate.push({
          serverId,
          sessionId: gamingSession.id,
          createdById: session.user.id,
          action: "rcon_command",
          scheduledAt: warn1,
          payload: {
            command: "say Server shutting down in 1 minute!",
          },
        });
      }
    }

    if (autoStop) {
      actionsToCreate.push({
        serverId,
        sessionId: gamingSession.id,
        createdById: session.user.id,
        action: "stop",
        scheduledAt: endTime,
        payload: null,
      });
    }

    // Insert all actions
    if (actionsToCreate.length > 0) {
      await db.insert(mcScheduledActions).values(actionsToCreate);
    }

    // Push to agent
    try {
      await agentFetch(serverId, "/scheduler/sync", session.user.id, access.role, {
        method: "POST",
        body: JSON.stringify({
          sessionId: gamingSession.id,
          actions: actionsToCreate.map((a) => ({
            action: a.action,
            scheduledAt: a.scheduledAt.toISOString(),
            payload: a.payload,
          })),
        }),
      });
    } catch {
      // Agent might be offline; actions are in DB and will sync on next startup
    }

    await logMcEvent(serverId, session.user.id, "schedule_create", "scheduler", {
      sessionId: gamingSession.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      autoStart,
      autoStop,
      warnings,
    });

    return NextResponse.json({
      success: true,
      sessionId: gamingSession.id,
      actionsCreated: actionsToCreate.length,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
