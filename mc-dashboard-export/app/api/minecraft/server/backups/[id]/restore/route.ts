import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { agentFetch, getMcServerAccess, hasMinRole } from "@/lib/gamehub/minecraft";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { serverId } = await request.json();
    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 });
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess || !access.role || !hasMinRole(access.role, "admin")) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const response = await agentFetch(
      serverId,
      `/backups/${id}/restore`,
      session.user.id,
      access.role,
      { method: "POST" }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
