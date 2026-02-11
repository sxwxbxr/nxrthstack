import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as rcon from "../services/rcon.js";
import * as mcProcess from "../services/process.js";
import { parseLogLine } from "../utils/log-parser.js";
import { verifyToken } from "../utils/jwt.js";

const router = Router();

/**
 * GET /console/stream?token=JWT
 * SSE stream of console output. Token is passed as query param
 * because EventSource doesn't support Authorization headers.
 */
router.get("/stream", async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ error: "Token required" });
    return;
  }

  let user;
  try {
    user = await verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({ type: "connected", userId: user.sub })}\n\n`
  );

  // Listen to console output
  const listener = (line: string) => {
    const entry = parseLogLine(line);
    res.write(`data: ${JSON.stringify({ type: "log", ...entry })}\n\n`);
  };

  mcProcess.addConsoleListener(listener);

  // Heartbeat every 15s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    mcProcess.removeConsoleListener(listener);
  });
});

/**
 * GET /console/history
 * Returns recent console log lines.
 */
router.get("/history", requireAuth, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const history = mcProcess.getConsoleHistory(limit);
  const entries = history.map(parseLogLine);
  res.json({ entries });
});

/**
 * POST /console/command
 * Sends a command via RCON. Requires operator role or higher.
 */
router.post(
  "/command",
  requireAuth,
  requireRole("operator"),
  async (req: Request, res: Response) => {
    const { command } = req.body;

    if (!command || typeof command !== "string") {
      res.status(400).json({ error: "command is required" });
      return;
    }

    const trimmed = command.trim();
    if (!trimmed) {
      res.status(400).json({ error: "command cannot be empty" });
      return;
    }

    // Validate command isn't blocked
    const validation = rcon.validateCommand(trimmed, req.user!.role);
    if (!validation.allowed) {
      res.status(403).json({ error: validation.reason });
      return;
    }

    try {
      const response = await rcon.sendCommand(trimmed);
      res.json({ response });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Command failed";
      res.status(500).json({ error: message });
    }
  }
);

export default router;
