import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess, hasMinRole } from "@/lib/gamehub/minecraft";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role) {
      return NextResponse.json({ error: "No server access" }, { status: 403 });
    }

    const response = await agentFetch(serverId, "/config/properties", session.user.id, access.role);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error reading properties:", error);
    return NextResponse.json({ error: "Failed to read properties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, updates } = await request.json();
    if (!serverId || !updates) {
      return NextResponse.json({ error: "serverId and updates are required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role || !hasMinRole(access.role, "manager")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const response = await agentFetch(serverId, "/config/properties", session.user.id, access.role, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating properties:", error);
    return NextResponse.json({ error: "Failed to update properties" }, { status: 500 });
  }
}
