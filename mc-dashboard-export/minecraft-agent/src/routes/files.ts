import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as sandbox from "../services/file-sandbox.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /files?path=...
 * List directory contents.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || ".";
    const entries = await sandbox.listDirectory(dirPath);
    res.json({ entries, path: dirPath });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list directory";
    res.status(400).json({ error: message });
  }
});

/**
 * GET /files/read?path=...
 * Read file contents.
 */
router.get("/read", async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: "path is required" });
      return;
    }

    const content = await sandbox.readFile(filePath);
    res.json({ content, path: filePath });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read file";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /files/write
 * Write file contents (requires operator).
 */
router.post(
  "/write",
  requireRole("operator"),
  async (req: Request, res: Response) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        res.status(400).json({ error: "path and content are required" });
        return;
      }

      await sandbox.writeFile(filePath, content);
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to write file";
      res.status(400).json({ error: message });
    }
  }
);

/**
 * DELETE /files?path=...
 * Delete a file or directory (requires manager).
 */
router.delete(
  "/",
  requireRole("manager"),
  async (req: Request, res: Response) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        res.status(400).json({ error: "path is required" });
        return;
      }

      await sandbox.deleteFile(filePath);
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete";
      res.status(400).json({ error: message });
    }
  }
);

export default router;
