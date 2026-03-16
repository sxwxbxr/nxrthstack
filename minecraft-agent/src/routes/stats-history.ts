import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getSnapshots, getPlayerEvents } from "../services/stats-collector.js";

const router = Router();

router.use(requireAuth);

/**
 * GET /stats/history?since=<ISO>&limit=<N>
 * Returns stats snapshots from the in-memory buffer.
 */
router.get("/stats/history", (req, res) => {
  const since = req.query.since as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  const snapshots = getSnapshots({ since, limit });

  res.json({ snapshots, count: snapshots.length });
});

/**
 * GET /stats/player-events?since=<ISO>&limit=<N>
 * Returns player events from the in-memory buffer.
 */
router.get("/stats/player-events", (req, res) => {
  const since = req.query.since as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  const events = getPlayerEvents({ since, limit });

  res.json({ events, count: events.length });
});

export default router;
