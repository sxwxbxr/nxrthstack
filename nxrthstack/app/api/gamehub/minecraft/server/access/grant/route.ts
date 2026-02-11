import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcAccessGrants, mcServers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/gamehub/minecraft/server/access/grant
 * Returns the current user's granted servers with role info.
 * Used by the MC dashboard shell to resolve context.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grants = await db
      .select({
        serverId: mcAccessGrants.serverId,
        serverName: mcServers.name,
        role: mcAccessGrants.role,
      })
      .from(mcAccessGrants)
      .innerJoin(mcServers, eq(mcAccessGrants.serverId, mcServers.id))
      .where(
        and(
          eq(mcAccessGrants.userId, session.user.id),
          eq(mcServers.isActive, true)
        )
      );

    return NextResponse.json({ servers: grants });
  } catch (error) {
    console.error("Error fetching MC grants:", error);
    return NextResponse.json(
      { error: "Failed to fetch grants" },
      { status: 500 }
    );
  }
}
