import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess, hasMinRole } from "@/lib/gamehub/minecraft";

/**
 * GET /api/gamehub/minecraft/server/files?serverId=xxx&path=...
 * List directory contents.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const dirPath = searchParams.get("path") || ".";

    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role) {
      return NextResponse.json({ error: "No server access" }, { status: 403 });
    }

    const response = await agentFetch(
      serverId,
      `/files?path=${encodeURIComponent(dirPath)}`,
      session.user.id,
      access.role
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

/**
 * DELETE /api/gamehub/minecraft/server/files
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, path: filePath } = await request.json();
    if (!serverId || !filePath) {
      return NextResponse.json({ error: "serverId and path are required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role || !hasMinRole(access.role, "manager")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const response = await agentFetch(
      serverId,
      `/files?path=${encodeURIComponent(filePath)}`,
      session.user.id,
      access.role,
      { method: "DELETE" }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
