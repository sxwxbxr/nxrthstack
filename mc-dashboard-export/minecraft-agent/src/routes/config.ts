import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as sandbox from "../services/file-sandbox.js";
import {
  parseProperties,
  serializeProperties,
} from "../utils/properties-parser.js";
import {
  parseStartScript,
  buildStartScript,
} from "../utils/start-script-parser.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /config/properties
 * Read and parse server.properties.
 */
router.get("/properties", async (_req: Request, res: Response) => {
  try {
    const content = await sandbox.readFile("server.properties");
    const parsed = parseProperties(content);
    res.json({
      properties: parsed.properties,
      raw: content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read properties";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /config/properties
 * Update server.properties (requires manager).
 */
router.post(
  "/properties",
  requireRole("manager"),
  async (req: Request, res: Response) => {
    try {
      const { updates } = req.body;
      if (!updates || typeof updates !== "object") {
        res.status(400).json({ error: "updates object is required" });
        return;
      }

      const content = await sandbox.readFile("server.properties");
      const parsed = parseProperties(content);
      const newContent = serializeProperties(parsed.entries, updates);
      await sandbox.writeFile("server.properties", newContent);

      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update properties";
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /config/java
 * Read and parse JVM args from start script.
 */
router.get("/java", async (_req: Request, res: Response) => {
  try {
    // Try common start script names
    const scriptNames = ["start.sh", "run.sh", "start.bat"];
    let content = "";
    let scriptName = "";

    for (const name of scriptNames) {
      try {
        content = await sandbox.readFile(name);
        scriptName = name;
        break;
      } catch {
        continue;
      }
    }

    if (!scriptName) {
      res.json({
        found: false,
        args: null,
        scriptName: null,
      });
      return;
    }

    const args = parseStartScript(content);
    res.json({
      found: true,
      args,
      scriptName,
      raw: content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read start script";
    res.status(400).json({ error: message });
  }
});

/**
 * POST /config/java
 * Update JVM args in start script (requires manager).
 */
router.post(
  "/java",
  requireRole("manager"),
  async (req: Request, res: Response) => {
    try {
      const { scriptName, args } = req.body;
      if (!scriptName || !args) {
        res.status(400).json({
          error: "scriptName and args are required",
        });
        return;
      }

      const content = await sandbox.readFile(scriptName);
      const newContent = buildStartScript(content, args);
      await sandbox.writeFile(scriptName, newContent);

      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update start script";
      res.status(400).json({ error: message });
    }
  }
);

export default router;
