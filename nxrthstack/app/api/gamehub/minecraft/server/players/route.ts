import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess } from "@/lib/gamehub/minecraft";

/**
 * GET /api/gamehub/minecraft/server/players?serverId=xxx
 * Returns online players, whitelist, ops, and banned players.
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
      "/players",
      session.user.id,
      access.role
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch players" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
