import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess, hasMinRole } from "@/lib/gamehub/minecraft";

/**
 * POST /api/gamehub/minecraft/server/console
 * Proxy a command to the agent's RCON. Requires operator role.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, command } = await request.json();

    if (!serverId || !command) {
      return NextResponse.json(
        { error: "serverId and command are required" },
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
        { error: "Operator role required" },
        { status: 403 }
      );
    }

    const response = await agentFetch(
      serverId,
      "/console/command",
      session.user.id,
      access.role,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Agent error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying console command:", error);
    return NextResponse.json(
      { error: "Failed to send command" },
      { status: 500 }
    );
  }
}
