import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { AgentUser } from "../types/events.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AgentUser;
    }
  }
}

const MC_ROLES = ["viewer", "operator", "manager", "admin"] as const;

function roleIndex(role: string): number {
  return MC_ROLES.indexOf(role as (typeof MC_ROLES)[number]);
}

/**
 * Middleware: Verify JWT from Authorization header or query param.
 * Attaches decoded user to req.user.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : queryToken;

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  verifyToken(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Invalid or expired token" });
    });
}

/**
 * Middleware factory: Require minimum role level.
 * Must be used after requireAuth.
 */
export function requireRole(minRole: (typeof MC_ROLES)[number]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userRoleIdx = roleIndex(req.user.role);
    const minRoleIdx = roleIndex(minRole);

    if (userRoleIdx < minRoleIdx) {
      res.status(403).json({
        error: `Requires ${minRole} role or higher`,
      });
      return;
    }

    next();
  };
}
