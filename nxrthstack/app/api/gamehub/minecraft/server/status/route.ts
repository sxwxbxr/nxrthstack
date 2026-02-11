import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess } from "@/lib/gamehub/minecraft";

/**
 * GET /api/gamehub/minecraft/server/status?serverId=xxx
 * Proxies status request to the server agent.
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
    if (!access.hasAccess || !access.role) {
      return NextResponse.json(
        { error: "No server access" },
        { status: 403 }
      );
    }

    const response = await agentFetch(
      serverId,
      "/status",
      session.user.id,
      access.role
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Agent unreachable", running: false },
        { status: 200 } // Return 200 so the UI can handle gracefully
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Agent might be down — return offline status instead of error
    return NextResponse.json({
      running: false,
      pid: null,
      uptime: 0,
      version: null,
      motd: null,
      players: { online: 0, max: 0, list: [] },
      tps: null,
      memory: { used: 0, max: 0, free: 0 },
      cpu: null,
      disk: { used: 0, total: 0 },
      agentOnline: false,
    });
  }
}
