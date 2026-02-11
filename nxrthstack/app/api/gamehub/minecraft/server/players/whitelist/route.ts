import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess, hasMinRole } from "@/lib/gamehub/minecraft";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, player } = await request.json();
    if (!serverId || !player) {
      return NextResponse.json(
        { error: "serverId and player are required" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role || !hasMinRole(access.role, "operator")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const response = await agentFetch(serverId, "/players/whitelist", session.user.id, access.role, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return NextResponse.json({ error: "Failed to add to whitelist" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, player } = await request.json();
    if (!serverId || !player) {
      return NextResponse.json(
        { error: "serverId and player are required" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role || !hasMinRole(access.role, "operator")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const response = await agentFetch(serverId, "/players/whitelist", session.user.id, access.role, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return NextResponse.json({ error: "Failed to remove from whitelist" }, { status: 500 });
  }
}
