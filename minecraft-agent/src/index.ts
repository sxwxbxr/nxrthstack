import "dotenv/config";
import express from "express";
import cors from "cors";
import { rateLimit } from "./middleware/rate-limit.js";
import statusRouter from "./routes/status.js";
import controlRouter from "./routes/control.js";
import consoleRouter from "./routes/console.js";
import playersRouter from "./routes/players.js";
import filesRouter from "./routes/files.js";
import configRouter from "./routes/config.js";
import backupsRouter from "./routes/backups.js";

const PORT = parseInt(process.env.PORT || "3003");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

const app = express();

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));

// Rate limiting
app.use(rateLimit);

// Health check (unauthenticated)
app.get("/", (_req, res) => {
  res.json({
    name: "minecraft-agent",
    version: "1.0.0",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use(statusRouter);
app.use(controlRouter);
app.use("/console", consoleRouter);
app.use("/players", playersRouter);
app.use("/files", filesRouter);
app.use("/config", configRouter);
app.use("/backups", backupsRouter);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Agent] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`[Agent] Minecraft agent listening on port ${PORT}`);
  console.log(`[Agent] Server directory: ${process.env.MC_SERVER_DIR || "/opt/minecraft"}`);
  console.log(`[Agent] Allowed origins: ${ALLOWED_ORIGINS.join(", ") || "none"}`);
});
