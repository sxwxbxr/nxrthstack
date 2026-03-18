import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  "GET:/status": { windowMs: 5_000, max: 10 },
  "GET:/console/stream": { windowMs: 60_000, max: 5 },
  "POST:/console/command": { windowMs: 1_000, max: 5 },
  "POST:/control/start": { windowMs: 60_000, max: 2 },
  "POST:/control/stop": { windowMs: 60_000, max: 2 },
  "POST:/control/restart": { windowMs: 300_000, max: 3 },
  "POST:/backups": { windowMs: 600_000, max: 3 },
};

const GLOBAL_LIMIT: RateLimitConfig = { windowMs: 1_000, max: 30 };

export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const routeKey = `${req.method}:${req.path}`;
  const config = DEFAULT_LIMITS[routeKey] || GLOBAL_LIMIT;

  const key = `${ip}:${routeKey}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    next();
    return;
  }

  entry.count++;

  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Too many requests",
      retryAfter,
    });
    return;
  }

  next();
}
