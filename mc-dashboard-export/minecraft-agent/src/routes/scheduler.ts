import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  syncSchedule,
  removeSession,
  getScheduleState,
} from "../services/scheduler.js";

const router = Router();

router.use(requireAuth);

/**
 * GET /scheduler
 * Get current schedule state.
 */
router.get("/scheduler", (req, res) => {
  res.json(getScheduleState());
});

/**
 * POST /scheduler/sync
 * Receive scheduled actions for a session from Vercel.
 */
router.post(
  "/scheduler/sync",
  requireRole("operator"),
  (req, res) => {
    const { sessionId, actions } = req.body;

    if (!sessionId || !Array.isArray(actions)) {
      return res
        .status(400)
        .json({ error: "sessionId and actions array required" });
    }

    syncSchedule(sessionId, actions);

    res.json({
      success: true,
      message: `Synced ${actions.length} actions for session ${sessionId}`,
    });
  }
);

/**
 * DELETE /scheduler/:sessionId
 * Cancel all actions for a session.
 */
router.delete(
  "/scheduler/:sessionId",
  requireRole("operator"),
  (req, res) => {
    removeSession(req.params.sessionId as string);
    res.json({ success: true, message: "Session schedule cancelled" });
  }
);

export default router;
