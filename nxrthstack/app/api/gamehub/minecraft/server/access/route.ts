import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mcAccessGrants, mcServers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/gamehub/minecraft/server/access
 * Returns the current user's server access list with roles.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grants = await db
      .select({
        grantId: mcAccessGrants.id,
        role: mcAccessGrants.role,
        createdAt: mcAccessGrants.createdAt,
        serverId: mcServers.id,
        serverName: mcServers.name,
        serverSlug: mcServers.slug,
        agentUrl: mcServers.agentUrl,
        gamePort: mcServers.gamePort,
        maxPlayers: mcServers.maxPlayers,
        serverType: mcServers.serverType,
        iconUrl: mcServers.iconUrl,
        isActive: mcServers.isActive,
      })
      .from(mcAccessGrants)
      .innerJoin(mcServers, eq(mcAccessGrants.serverId, mcServers.id))
      .where(eq(mcAccessGrants.userId, session.user.id));

    // Also get all active servers (for the server list with lock icons)
    const allServers = await db
      .select({
        id: mcServers.id,
        name: mcServers.name,
        slug: mcServers.slug,
        gamePort: mcServers.gamePort,
        maxPlayers: mcServers.maxPlayers,
        serverType: mcServers.serverType,
        iconUrl: mcServers.iconUrl,
        isActive: mcServers.isActive,
      })
      .from(mcServers)
      .where(eq(mcServers.isActive, true));

    // Build the server list with access info
    const grantMap = new Map(grants.map((g) => [g.serverId, g]));
    const servers = allServers.map((server) => {
      const grant = grantMap.get(server.id);
      return {
        ...server,
        hasAccess: !!grant,
        role: grant?.role ?? null,
        grantId: grant?.grantId ?? null,
      };
    });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Error fetching MC access:", error);
    return NextResponse.json(
      { error: "Failed to fetch server access" },
      { status: 500 }
    );
  }
}
