import { Router } from "express";
import { getServerStatus } from "../services/stats.js";

const router = Router();

/**
 * GET /status
 * Returns comprehensive server status.
 * This endpoint is unauthenticated (rate-limited) for health checks.
 */
router.get("/status", async (_req, res) => {
  try {
    const status = await getServerStatus();
    res.json(status);
  } catch (err) {
    console.error("[Status] Error:", err);
    res.status(500).json({ error: "Failed to get server status" });
  }
});

export default router;
