import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcServers, mcServerStats, mcPlayerEvents } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { jwtVerify } from "jose";

/**
 * POST /api/cron/mc-stats
 * Receives stats data pushed from the agent every 5 minutes.
 * Authenticated via JWT signed with the server's agentSecret.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serverId, token, snapshots, events } = body;

    if (!serverId || !token) {
      return NextResponse.json(
        { error: "serverId and token are required" },
        { status: 400 }
      );
    }

    // Verify token against server's secret
    const [server] = await db
      .select({
        id: mcServers.id,
        agentSecret: mcServers.agentSecret,
      })
      .from(mcServers)
      .where(eq(mcServers.id, serverId))
      .limit(1);

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    const secret = new TextEncoder().encode(server.agentSecret);
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Guard against oversized payloads
    const MAX_SNAPSHOTS = 500;
    const MAX_EVENTS = 2000;
    if (snapshots?.length > MAX_SNAPSHOTS || events?.length > MAX_EVENTS) {
      return NextResponse.json(
        { error: `Payload too large. Max ${MAX_SNAPSHOTS} snapshots, ${MAX_EVENTS} events` },
        { status: 413 }
      );
    }

    let statsInserted = 0;
    let eventsInserted = 0;

    // Insert stats snapshots
    if (snapshots?.length > 0) {
      await db.insert(mcServerStats).values(
        snapshots.map(
          (s: {
            timestamp: string;
            playersOnline: number;
            playersMax: number;
            tps: number | null;
            memoryUsedMb: number | null;
            memoryMaxMb: number | null;
            cpuPercent: number | null;
            diskUsedMb: number | null;
            isOnline: boolean;
          }) => ({
            serverId,
            timestamp: new Date(s.timestamp),
            playersOnline: s.playersOnline ?? 0,
            playersMax: s.playersMax ?? 0,
            tps: s.tps,
            memoryUsedMb: s.memoryUsedMb,
            memoryMaxMb: s.memoryMaxMb,
            cpuPercent: s.cpuPercent,
            diskUsedMb: s.diskUsedMb,
            isOnline: s.isOnline ?? false,
          })
        )
      );
      statsInserted = snapshots.length;
    }

    // Insert player events
    if (events?.length > 0) {
      await db.insert(mcPlayerEvents).values(
        events.map(
          (e: {
            playerName: string;
            playerUuid: string | null;
            eventType: string;
            details: Record<string, unknown> | null;
            timestamp: string;
          }) => ({
            serverId,
            playerName: e.playerName,
            playerUuid: e.playerUuid,
            eventType: e.eventType,
            details: e.details,
            timestamp: new Date(e.timestamp),
          })
        )
      );
      eventsInserted = events.length;
    }

    // Periodic cleanup (run on every push, cheap check)
    const statsRetention = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const eventsRetention = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await db
      .delete(mcServerStats)
      .where(lt(mcServerStats.timestamp, statsRetention));
    await db
      .delete(mcPlayerEvents)
      .where(lt(mcPlayerEvents.timestamp, eventsRetention));

    return NextResponse.json({
      success: true,
      statsInserted,
      eventsInserted,
    });
  } catch (error) {
    console.error("Error processing stats push:", error);
    return NextResponse.json(
      { error: "Failed to process stats" },
      { status: 500 }
    );
  }
}
