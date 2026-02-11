import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { issueAgentToken, getMcServerAccess } from "@/lib/gamehub/minecraft";

/**
 * POST /api/gamehub/minecraft/server/token
 * Issues a short-lived JWT for direct browser-to-agent connections (SSE).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await request.json();
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

    const tokenData = await issueAgentToken(
      serverId,
      session.user.id,
      access.role
    );

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Error issuing agent token:", error);
    return NextResponse.json(
      { error: "Failed to issue token" },
      { status: 500 }
    );
  }
}
