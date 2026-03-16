import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getMcServerAccess } from "@/lib/gamehub/minecraft";
import { db } from "@/lib/db";
import { mcServerStats, mcPlayerEvents } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

const RANGE_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

// Bucket sizes for aggregation (in minutes)
const RANGE_BUCKET: Record<string, string> = {
  "1h": "1 minute",
  "6h": "1 minute",
  "24h": "5 minutes",
  "7d": "15 minutes",
  "30d": "1 hour",
};

/**
 * GET /api/gamehub/minecraft/server/stats?serverId=xxx&range=24h
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const range = searchParams.get("range") || "24h";

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId is required" },
        { status: 400 }
      );
    }

    if (!RANGE_MS[range]) {
      return NextResponse.json(
        { error: "Invalid range. Use: 1h, 6h, 24h, 7d, 30d" },
        { status: 400 }
      );
    }

    const access = await getMcServerAccess(session.user.id, serverId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "No server access" },
        { status: 403 }
      );
    }

    const since = new Date(Date.now() - RANGE_MS[range]);
    const bucket = RANGE_BUCKET[range];

    // For short ranges, return raw data; for longer ranges, aggregate
    const needsAggregation = range === "24h" || range === "7d" || range === "30d";

    let data;
    if (needsAggregation) {
      // Aggregate by time bucket using SQL
      const rows = await db.execute(sql`
        SELECT
          date_trunc(${bucket}, timestamp) AS bucket_time,
          ROUND(AVG(players_online))::int AS players_online,
          MAX(players_max) AS players_max,
          ROUND(AVG(tps)::numeric, 1)::float AS tps,
          ROUND(AVG(memory_used_mb))::int AS memory_used_mb,
          MAX(memory_max_mb) AS memory_max_mb,
          ROUND(AVG(cpu_percent)::numeric, 1)::float AS cpu_percent,
          ROUND(AVG(disk_used_mb))::int AS disk_used_mb,
          BOOL_OR(is_online) AS is_online
        FROM mc_server_stats
        WHERE server_id = ${serverId}
          AND timestamp >= ${since}
        GROUP BY bucket_time
        ORDER BY bucket_time ASC
      `);

      data = rows.rows.map((row: Record<string, unknown>) => ({
        timestamp: row.bucket_time,
        playersOnline: row.players_online ?? 0,
        playersMax: row.players_max ?? 0,
        tps: row.tps,
        memoryUsedMb: row.memory_used_mb,
        memoryMaxMb: row.memory_max_mb,
        cpuPercent: row.cpu_percent,
        diskUsedMb: row.disk_used_mb,
        isOnline: row.is_online ?? false,
      }));
    } else {
      // Raw data for 1h, 6h
      const rows = await db
        .select()
        .from(mcServerStats)
        .where(
          and(
            eq(mcServerStats.serverId, serverId),
            gte(mcServerStats.timestamp, since)
          )
        )
        .orderBy(mcServerStats.timestamp);

      data = rows.map((row) => ({
        timestamp: row.timestamp.toISOString(),
        playersOnline: row.playersOnline,
        playersMax: row.playersMax,
        tps: row.tps,
        memoryUsedMb: row.memoryUsedMb,
        memoryMaxMb: row.memoryMaxMb,
        cpuPercent: row.cpuPercent,
        diskUsedMb: row.diskUsedMb,
        isOnline: row.isOnline,
      }));
    }

    // Player activity (joins/leaves per bucket)
    const activityRows = await db.execute(sql`
      SELECT
        date_trunc(${bucket}, timestamp) AS bucket_time,
        COUNT(*) FILTER (WHERE event_type = 'join') AS joins,
        COUNT(*) FILTER (WHERE event_type = 'leave') AS leaves,
        COUNT(*) FILTER (WHERE event_type = 'death') AS deaths
      FROM mc_player_events
      WHERE server_id = ${serverId}
        AND timestamp >= ${since}
      GROUP BY bucket_time
      ORDER BY bucket_time ASC
    `);

    const playerActivity = activityRows.rows.map(
      (row: Record<string, unknown>) => ({
        bucket: row.bucket_time,
        joins: Number(row.joins) || 0,
        leaves: Number(row.leaves) || 0,
        deaths: Number(row.deaths) || 0,
      })
    );

    // Summary stats
    const summaryRows = await db.execute(sql`
      SELECT
        MAX(players_online) AS peak_players,
        ROUND(AVG(tps)::numeric, 1)::float AS avg_tps,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE is_online = true) / NULLIF(COUNT(*), 0),
          1
        )::float AS uptime_percent
      FROM mc_server_stats
      WHERE server_id = ${serverId}
        AND timestamp >= ${since}
    `);

    const playerSummary = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'join') AS total_joins,
        COUNT(DISTINCT player_name) AS unique_players
      FROM mc_player_events
      WHERE server_id = ${serverId}
        AND timestamp >= ${since}
    `);

    const s = summaryRows.rows[0] as Record<string, unknown>;
    const p = playerSummary.rows[0] as Record<string, unknown>;

    const summary = {
      peakPlayers: Number(s?.peak_players) || 0,
      avgTps: s?.avg_tps != null ? Number(s.avg_tps) : null,
      uptimePercent: Number(s?.uptime_percent) || 0,
      totalJoins: Number(p?.total_joins) || 0,
      uniquePlayers: Number(p?.unique_players) || 0,
    };

    return NextResponse.json({ data, playerActivity, summary });
  } catch (error) {
    console.error("Error fetching MC stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
