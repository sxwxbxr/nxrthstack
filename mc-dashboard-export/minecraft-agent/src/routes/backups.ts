import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as backup from "../services/backup.js";
import { createReadStream } from "fs";

const router = Router();
router.use(requireAuth);

/**
 * GET /backups
 * List all backups and storage info.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [backups, storage] = await Promise.all([
      backup.listBackups(),
      backup.getStorageInfo(),
    ]);

    res.json({ backups, storage });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list backups";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /backups
 * Create a new backup (returns immediately, runs in background).
 * Requires manager role.
 */
router.post(
  "/",
  requireRole("manager"),
  async (req: Request, res: Response) => {
    try {
      const { label, type } = req.body;
      const meta = backup.createBackup(
        label || null,
        type === "world-only" ? "world-only" : "full"
      );
      res.json({ backup: meta });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create backup";
      res.status(500).json({ error: message });
    }
  }
);

/**
 * DELETE /backups/:id
 * Delete a backup (requires manager).
 */
router.delete(
  "/:id",
  requireRole("manager"),
  async (req: Request, res: Response) => {
    try {
      await backup.deleteBackup(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete backup";
      res.status(500).json({ error: message });
    }
  }
);

/**
 * POST /backups/:id/restore
 * Restore a backup (requires admin). Server must be stopped first.
 */
router.post(
  "/:id/restore",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      await backup.restoreBackup(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to restore backup";
      res.status(500).json({ error: message });
    }
  }
);

/**
 * GET /backups/:id/download
 * Download a backup archive.
 */
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const archivePath = await backup.getBackupPath(req.params.id as string);
    if (!archivePath) {
      res.status(404).json({ error: "Backup not found" });
      return;
    }

    res.setHeader("Content-Type", "application/gzip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.id as string}.tar.gz"`
    );

    const stream = createReadStream(archivePath);
    stream.pipe(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download backup";
    res.status(500).json({ error: message });
  }
});

export default router;
