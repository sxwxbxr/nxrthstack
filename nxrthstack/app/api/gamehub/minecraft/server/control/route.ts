import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  agentFetch,
  getMcServerAccess,
  hasMinRole,
  logMcEvent,
} from "@/lib/gamehub/minecraft";

const VALID_ACTIONS = ["start", "stop", "restart", "kill"] as const;
type ControlAction = (typeof VALID_ACTIONS)[number];

const ACTION_MIN_ROLE: Record<ControlAction, "operator" | "admin"> = {
  start: "operator",
  stop: "operator",
  restart: "operator",
  kill: "admin",
};

/**
 * POST /api/gamehub/minecraft/server/control
 * Proxy a control action (start/stop/restart/kill) to the agent.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, action } = await request.json();

    if (!serverId || !action) {
      return NextResponse.json(
        { error: "serverId and action are required" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
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

    const minRole = ACTION_MIN_ROLE[action as ControlAction];
    if (!hasMinRole(access.role, minRole)) {
      return NextResponse.json(
        { error: `${minRole} role required for ${action}` },
        { status: 403 }
      );
    }

    const response = await agentFetch(
      serverId,
      `/control/${action}`,
      session.user.id,
      access.role,
      { method: "POST" }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Agent error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    await logMcEvent(serverId, session.user.id, action, "control", {
      action,
      result: data.message,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying control action:", error);
    return NextResponse.json(
      { error: "Failed to execute control action" },
      { status: 500 }
    );
  }
}
