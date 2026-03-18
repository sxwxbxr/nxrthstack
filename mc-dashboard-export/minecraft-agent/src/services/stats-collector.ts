import { getServerStatus } from "./stats.js";
import { SignJWT } from "jose";

export interface StatsSnapshot {
  timestamp: string;
  playersOnline: number;
  playersMax: number;
  tps: number | null;
  memoryUsedMb: number | null;
  memoryMaxMb: number | null;
  cpuPercent: number | null;
  diskUsedMb: number | null;
  isOnline: boolean;
}

export interface PlayerEvent {
  playerName: string;
  playerUuid: string | null;
  eventType: "join" | "leave" | "death";
  details: Record<string, unknown> | null;
  timestamp: string;
}

// Circular buffer for stats snapshots (24h at 1/min = 1440 entries)
const MAX_SNAPSHOTS = 1440;
const snapshots: StatsSnapshot[] = [];

// Player events buffer (flushed on push)
const MAX_EVENTS = 5000;
const playerEvents: PlayerEvent[] = [];

let collectorInterval: ReturnType<typeof setInterval> | null = null;
let pushInterval: ReturnType<typeof setInterval> | null = null;
let lastPushedSnapshotIndex = 0;
let lastPushedEventIndex = 0;

/**
 * Capture a stats snapshot from the current server status.
 */
async function captureSnapshot() {
  try {
    const status = await getServerStatus();

    const snapshot: StatsSnapshot = {
      timestamp: new Date().toISOString(),
      playersOnline: status.players.online,
      playersMax: status.players.max,
      tps: status.tps,
      memoryUsedMb: status.memory.used > 0 ? status.memory.used : null,
      memoryMaxMb: status.memory.max > 0 ? status.memory.max : null,
      cpuPercent: status.cpu,
      diskUsedMb: status.disk.used > 0 ? status.disk.used : null,
      isOnline: status.running,
    };

    snapshots.push(snapshot);

    // Trim to max size
    if (snapshots.length > MAX_SNAPSHOTS) {
      const removed = snapshots.length - MAX_SNAPSHOTS;
      snapshots.splice(0, removed);
      lastPushedSnapshotIndex = Math.max(0, lastPushedSnapshotIndex - removed);
    }
  } catch (err) {
    console.error("[stats-collector] Error capturing snapshot:", err);
  }
}

/**
 * Record a player event (called from console log parser).
 */
export function recordPlayerEvent(event: Omit<PlayerEvent, "timestamp">) {
  const entry: PlayerEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  playerEvents.push(entry);

  if (playerEvents.length > MAX_EVENTS) {
    const removed = playerEvents.length - MAX_EVENTS;
    playerEvents.splice(0, removed);
    lastPushedEventIndex = Math.max(0, lastPushedEventIndex - removed);
  }
}

/**
 * Get snapshots (for the /stats/history API endpoint).
 */
export function getSnapshots(opts?: {
  since?: string;
  limit?: number;
}): StatsSnapshot[] {
  // Return unsent snapshots
  const unsent = snapshots.slice(lastPushedSnapshotIndex);
  lastPushedSnapshotIndex = snapshots.length;

  if (opts?.limit && unsent.length > opts.limit) {
    return unsent.slice(-opts.limit);
  }

  return unsent;
}

/**
 * Get player events (for the /stats/player-events API endpoint).
 */
export function getPlayerEvents(opts?: {
  since?: string;
  limit?: number;
}): PlayerEvent[] {
  const unsent = playerEvents.slice(lastPushedEventIndex);
  lastPushedEventIndex = playerEvents.length;

  if (opts?.limit && unsent.length > opts.limit) {
    return unsent.slice(-opts.limit);
  }

  return unsent;
}

/**
 * Push collected stats to the Vercel API.
 * Called every 5 minutes by the push interval.
 */
async function pushToVercel() {
  const apiUrl = process.env.VERCEL_API_URL;
  const agentSecret = process.env.MC_AGENT_SECRET;
  const serverId = process.env.MC_SERVER_ID;

  if (!apiUrl || !agentSecret || !serverId) {
    return; // Not configured for push
  }

  const unsentSnapshots = snapshots.slice(lastPushedSnapshotIndex);
  const unsentEvents = playerEvents.slice(lastPushedEventIndex);

  if (unsentSnapshots.length === 0 && unsentEvents.length === 0) {
    return; // Nothing to push
  }

  try {
    const secret = new TextEncoder().encode(agentSecret);
    const token = await new SignJWT({
      sub: "agent-stats",
      serverId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

    const res = await fetch(`${apiUrl}/api/cron/mc-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serverId,
        token,
        snapshots: unsentSnapshots,
        events: unsentEvents,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      // Mark as pushed
      lastPushedSnapshotIndex = snapshots.length;
      lastPushedEventIndex = playerEvents.length;

      const data = await res.json();
      console.log(
        `[stats-collector] Pushed ${data.statsInserted} snapshots, ${data.eventsInserted} events`
      );
    } else {
      console.error(
        `[stats-collector] Push failed: ${res.status} ${res.statusText}`
      );
    }
  } catch (err) {
    console.error("[stats-collector] Push error:", err);
  }
}

/**
 * Start periodic stats collection (every 60s) and pushing (every 5min).
 */
export function startCollecting(
  collectIntervalMs = 60_000,
  pushIntervalMs = 5 * 60_000
) {
  if (collectorInterval) clearInterval(collectorInterval);
  if (pushInterval) clearInterval(pushInterval);

  // Capture immediately
  captureSnapshot();

  // Collect every minute
  collectorInterval = setInterval(captureSnapshot, collectIntervalMs);

  // Push every 5 minutes
  pushInterval = setInterval(pushToVercel, pushIntervalMs);

  console.log(
    `[stats-collector] Started: collect every ${collectIntervalMs / 1000}s, push every ${pushIntervalMs / 1000}s`
  );
}

/**
 * Stop stats collection.
 */
export function stopCollecting() {
  if (collectorInterval) {
    clearInterval(collectorInterval);
    collectorInterval = null;
  }
  if (pushInterval) {
    clearInterval(pushInterval);
    pushInterval = null;
  }
  console.log("[stats-collector] Stopped");
}
