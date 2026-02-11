import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess } from "@/lib/gamehub/minecraft";

/**
 * GET /api/gamehub/minecraft/server/files/read?serverId=xxx&path=...
 * Read file contents.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const filePath = searchParams.get("path");

    if (!serverId || !filePath) {
      return NextResponse.json(
        { error: "serverId and path are required" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role) {
      return NextResponse.json({ error: "No server access" }, { status: 403 });
    }

    const response = await agentFetch(
      serverId,
      `/files/read?path=${encodeURIComponent(filePath)}`,
      session.user.id,
      access.role
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
