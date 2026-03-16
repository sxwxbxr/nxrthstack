import { startServer, stopServer } from "./process.js";
import { sendCommand } from "./rcon.js";
import { SignJWT } from "jose";

export interface ScheduledAction {
  sessionId: string;
  action: "start" | "stop" | "rcon_command" | "backup";
  scheduledAt: Date;
  payload?: { command?: string } | null;
  executed: boolean;
}

const scheduledActions: ScheduledAction[] = [];
let checkInterval: ReturnType<typeof setInterval> | null = null;

const CALLBACK_URL = process.env.VERCEL_API_URL
  ? `${process.env.VERCEL_API_URL}/api/gamehub/minecraft/server/scheduler/callback`
  : null;

/**
 * Sync scheduled actions for a session.
 * Replaces any existing actions for the same sessionId.
 */
export function syncSchedule(
  sessionId: string,
  actions: {
    action: string;
    scheduledAt: string;
    payload?: Record<string, unknown> | null;
  }[]
) {
  // Remove existing actions for this session
  removeSession(sessionId);

  // Add new actions
  for (const a of actions) {
    scheduledActions.push({
      sessionId,
      action: a.action as ScheduledAction["action"],
      scheduledAt: new Date(a.scheduledAt),
      payload: a.payload as ScheduledAction["payload"],
      executed: false,
    });
  }

  // Sort by scheduled time
  scheduledActions.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );

  console.log(
    `[scheduler] Synced ${actions.length} actions for session ${sessionId}`
  );
}

/**
 * Remove all actions for a session.
 */
export function removeSession(sessionId: string) {
  const before = scheduledActions.length;
  const remaining = scheduledActions.filter(
    (a) => a.sessionId !== sessionId
  );
  scheduledActions.length = 0;
  scheduledActions.push(...remaining);

  if (before !== remaining.length) {
    console.log(
      `[scheduler] Removed ${before - remaining.length} actions for session ${sessionId}`
    );
  }
}

/**
 * Get current schedule state.
 */
export function getScheduleState() {
  return {
    pending: scheduledActions.filter((a) => !a.executed).length,
    actions: scheduledActions.map((a) => ({
      sessionId: a.sessionId,
      action: a.action,
      scheduledAt: a.scheduledAt.toISOString(),
      executed: a.executed,
    })),
  };
}

/**
 * Check and execute due actions.
 */
async function checkDueActions() {
  const now = new Date();

  for (const action of scheduledActions) {
    if (action.executed) continue;
    if (action.scheduledAt > now) continue;

    // Action is due
    action.executed = true;
    console.log(
      `[scheduler] Executing: ${action.action} for session ${action.sessionId}`
    );

    let resultMessage = "";
    let status = "executed";

    try {
      switch (action.action) {
        case "start":
          await startServer();
          resultMessage = "Server started";
          break;

        case "stop":
          await stopServer();
          resultMessage = "Server stopped";
          break;

        case "rcon_command":
          if (action.payload?.command) {
            const result = await sendCommand(action.payload.command);
            resultMessage = `Command sent: ${result || "OK"}`;
          }
          break;

        default:
          resultMessage = `Unknown action: ${action.action}`;
          status = "failed";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[scheduler] Action failed: ${msg}`);
      resultMessage = msg;
      status = "failed";
    }

    // Report back to Vercel (fire and forget)
    reportCallback(action, status, resultMessage).catch(() => {});
  }

  // Cleanup executed actions older than 1 hour
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
  const remaining = scheduledActions.filter(
    (a) => !a.executed || a.scheduledAt > cutoff
  );
  scheduledActions.length = 0;
  scheduledActions.push(...remaining);
}

/**
 * Report action execution to Vercel callback endpoint.
 */
async function reportCallback(
  action: ScheduledAction,
  status: string,
  resultMessage: string
) {
  if (!CALLBACK_URL) return;

  const agentSecret = process.env.MC_AGENT_SECRET;
  if (!agentSecret) return;

  try {
    const secret = new TextEncoder().encode(agentSecret);
    const token = await new SignJWT({
      sub: "agent-scheduler",
      sessionId: action.sessionId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

    await fetch(CALLBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionId: action.sessionId, // simplified - in prod would use actual action ID
        serverId: process.env.MC_SERVER_ID,
        status,
        resultMessage,
        token,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("[scheduler] Failed to report callback:", err);
  }
}

/**
 * Start the scheduler check loop.
 */
export function startScheduler(intervalMs = 10_000) {
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  checkInterval = setInterval(checkDueActions, intervalMs);
  console.log(
    `[scheduler] Started checking every ${intervalMs / 1000}s`
  );
}

/**
 * Stop the scheduler.
 */
export function stopScheduler() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log("[scheduler] Stopped");
  }
}
