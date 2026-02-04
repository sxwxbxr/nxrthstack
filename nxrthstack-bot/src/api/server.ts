import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  broadcastAchievementUnlock,
  broadcastSessionCreated,
  broadcastRivalryEvent,
  broadcastAnnouncement,
} from "../services/notifications.js";

const BOT_SECRET = process.env.DISCORD_CLIENT_SECRET;

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  secret?: string;
}

/**
 * Verify the webhook secret
 */
function verifySecret(payload: WebhookPayload): boolean {
  if (!BOT_SECRET) {
    console.warn("[API] BOT_SECRET not set, skipping verification");
    return true;
  }
  return payload.secret === BOT_SECRET;
}

/**
 * Parse JSON body from request
 */
async function parseBody(req: IncomingMessage): Promise<WebhookPayload | null> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

/**
 * Handle incoming webhook
 */
async function handleWebhook(payload: WebhookPayload): Promise<{ success: boolean; message: string }> {
  const { event, data } = payload;

  console.log(`[API] Received event: ${event}`);

  switch (event) {
    case "achievement.unlocked":
      await broadcastAchievementUnlock({
        userId: data.userId as string,
        achievementId: data.achievementId as string,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Achievement notification sent" };

    case "session.created":
      await broadcastSessionCreated({
        sessionId: data.sessionId as string,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Session notification sent" };

    case "rivalry.challenge":
      await broadcastRivalryEvent({
        type: "challenge",
        challengerName: data.challengerName as string,
        opponentName: data.opponentName as string,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Rivalry challenge notification sent" };

    case "rivalry.accepted":
      await broadcastRivalryEvent({
        type: "accepted",
        challengerName: data.challengerName as string,
        opponentName: data.opponentName as string,
        season: data.season as number,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Rivalry accepted notification sent" };

    case "rivalry.match":
      await broadcastRivalryEvent({
        type: "match",
        challengerName: data.winnerName as string,
        opponentName: data.loserName as string,
        result: "win",
        game: data.game as string,
        season: data.season as number,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Rivalry match notification sent" };

    case "announcement.created":
      await broadcastAnnouncement({
        announcementId: data.announcementId as string,
        guildId: data.guildId as string | undefined,
      });
      return { success: true, message: "Announcement notification sent" };

    default:
      return { success: false, message: `Unknown event: ${event}` };
  }
}

/**
 * HTTP request handler
 */
async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  // Webhook endpoint
  if (req.method === "POST" && req.url === "/webhook") {
    const payload = await parseBody(req);

    if (!payload) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    if (!verifySecret(payload)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid secret" }));
      return;
    }

    try {
      const result = await handleWebhook(payload);
      res.writeHead(result.success ? 200 : 400, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error("[API] Webhook error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

/**
 * Start the API server
 */
export function startApiServer(port: number = 3001) {
  const server = createServer(requestHandler);

  server.listen(port, () => {
    console.log(`[API] Server listening on port ${port}`);
  });

  return server;
}
