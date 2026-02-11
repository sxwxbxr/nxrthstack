import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as rcon from "../services/rcon.js";
import * as mcProcess from "../services/process.js";
import { getServerStatus } from "../services/stats.js";

const router = Router();

// All player routes require auth
router.use(requireAuth);

/**
 * GET /players
 * Returns online players, whitelist, ops, and banned players.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const status = await getServerStatus();
    const players = status.players;

    // Get whitelist, ops, banned via RCON
    let whitelist: string[] = [];
    let ops: string[] = [];
    let banned: string[] = [];

    if (status.running && rcon.isConnected()) {
      try {
        const wlResponse = await rcon.sendCommand("whitelist list");
        whitelist = parsePlayerList(wlResponse);
      } catch { /* ignore */ }

      try {
        const opsResponse = await rcon.sendCommand("op list");
        ops = parsePlayerList(opsResponse);
      } catch { /* ignore */ }

      try {
        const banResponse = await rcon.sendCommand("banlist");
        banned = parsePlayerList(banResponse);
      } catch { /* ignore */ }
    }

    res.json({
      online: players,
      whitelist,
      ops,
      banned,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get players";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /players/kick
 * Kick a player (requires operator).
 */
router.post("/kick", requireRole("operator"), async (req: Request, res: Response) => {
  const { player, reason } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const cmd = reason ? `kick ${player} ${reason}` : `kick ${player}`;
    const response = await rcon.sendCommand(cmd);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to kick player";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /players/ban
 * Ban a player (requires manager).
 */
router.post("/ban", requireRole("manager"), async (req: Request, res: Response) => {
  const { player, reason } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const cmd = reason ? `ban ${player} ${reason}` : `ban ${player}`;
    const response = await rcon.sendCommand(cmd);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ban player";
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /players/ban
 * Unban (pardon) a player (requires manager).
 */
router.delete("/ban", requireRole("manager"), async (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const response = await rcon.sendCommand(`pardon ${player}`);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unban player";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /players/whitelist
 * Add a player to the whitelist (requires operator).
 */
router.post("/whitelist", requireRole("operator"), async (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const response = await rcon.sendCommand(`whitelist add ${player}`);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to whitelist";
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /players/whitelist
 * Remove a player from the whitelist (requires operator).
 */
router.delete("/whitelist", requireRole("operator"), async (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const response = await rcon.sendCommand(`whitelist remove ${player}`);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove from whitelist";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /players/ops
 * Op a player (requires manager).
 */
router.post("/ops", requireRole("manager"), async (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const response = await rcon.sendCommand(`op ${player}`);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to op player";
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /players/ops
 * Deop a player (requires manager).
 */
router.delete("/ops", requireRole("manager"), async (req: Request, res: Response) => {
  const { player } = req.body;
  if (!player) {
    res.status(400).json({ error: "player is required" });
    return;
  }

  try {
    const response = await rcon.sendCommand(`deop ${player}`);
    res.json({ success: true, response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deop player";
    res.status(500).json({ error: message });
  }
});

/**
 * Parse RCON player list responses.
 * Common formats:
 *   "There are 0/20 players online: player1, player2"
 *   "There are 3 whitelisted players: player1, player2, player3"
 *   "There are no banned players"
 */
function parsePlayerList(response: string): string[] {
  if (!response || response.includes("no ")) return [];

  const colonIndex = response.lastIndexOf(":");
  if (colonIndex === -1) return [];

  const listPart = response.slice(colonIndex + 1).trim();
  if (!listPart) return [];

  return listPart
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default router;
