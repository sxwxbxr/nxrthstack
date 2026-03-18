import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcScheduledActions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { jwtVerify } from "jose";
import { getServerAgent } from "@/lib/gamehub/minecraft";

const VALID_CALLBACK_STATUSES = ["executed", "failed"] as const;

/**
 * POST /api/gamehub/minecraft/server/scheduler/callback
 * Callback from agent after executing a scheduled action.
 * Authenticated via service JWT signed with the server's agentSecret.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionId, serverId, status, resultMessage, token } = body;

    if (!actionId || !serverId || !status || !token) {
      return NextResponse.json(
        { error: "actionId, serverId, status, and token are required" },
        { status: 400 }
      );
    }

    if (!VALID_CALLBACK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: executed, failed" },
        { status: 400 }
      );
    }

    // Verify the token against the server's agentSecret
    const server = await getServerAgent(serverId);
    const secret = new TextEncoder().encode(server.agentSecret);

    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Update the action status — scoped to serverId to prevent cross-server writes
    await db
      .update(mcScheduledActions)
      .set({
        status,
        executedAt: new Date(),
        resultMessage: resultMessage
          ? String(resultMessage).slice(0, 500)
          : null,
      })
      .where(
        and(
          eq(mcScheduledActions.id, actionId),
          eq(mcScheduledActions.serverId, serverId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing scheduler callback:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}
