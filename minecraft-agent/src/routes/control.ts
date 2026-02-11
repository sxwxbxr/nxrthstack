import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  startServer,
  stopServer,
  restartServer,
  killServer,
} from "../services/process.js";

const router = Router();

// All control routes require authentication and operator+ role
router.use(requireAuth);

/**
 * POST /control/start
 * Start the Minecraft server.
 */
router.post("/control/start", requireRole("operator"), async (req, res) => {
  try {
    await startServer();
    res.json({ success: true, message: "Server starting" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start server";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /control/stop
 * Gracefully stop the Minecraft server.
 */
router.post("/control/stop", requireRole("operator"), async (req, res) => {
  try {
    await stopServer();
    res.json({ success: true, message: "Server stopped" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop server";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /control/restart
 * Restart the Minecraft server.
 */
router.post("/control/restart", requireRole("operator"), async (req, res) => {
  try {
    await restartServer();
    res.json({ success: true, message: "Server restarting" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to restart server";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /control/kill
 * Force kill the Minecraft server (emergency).
 */
router.post("/control/kill", requireRole("admin"), async (req, res) => {
  try {
    killServer();
    res.json({ success: true, message: "Server killed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to kill server";
    res.status(400).json({ error: message });
  }
});

export default router;
