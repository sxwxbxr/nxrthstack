import { db } from "@/lib/db";
import {
  mcServers,
  mcAccessGrants,
  mcServerEvents,
  type McAccessGrant,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { SignJWT } from "jose";

// Re-export role utilities (safe for client + server)
export { MC_ROLES, type McRole, roleIndex, hasMinRole } from "./minecraft-roles";
import { type McRole, roleIndex, hasMinRole } from "./minecraft-roles";

/**
 * Check if a user has access to a specific MC server and return their role.
 */
export async function getMcServerAccess(
  userId: string,
  serverId: string
): Promise<{ hasAccess: boolean; role: McRole | null; grant: McAccessGrant | null }> {
  const [grant] = await db
    .select()
    .from(mcAccessGrants)
    .where(
      and(
        eq(mcAccessGrants.userId, userId),
        eq(mcAccessGrants.serverId, serverId)
      )
    )
    .limit(1);

  if (!grant) {
    return { hasAccess: false, role: null, grant: null };
  }

  return {
    hasAccess: true,
    role: grant.role as McRole,
    grant,
  };
}

/**
 * Require a minimum role for a MC server. Throws an error object if access denied.
 */
export async function requireMcAccess(
  userId: string,
  serverId: string,
  minRole: McRole = "viewer"
): Promise<{ role: McRole; grant: McAccessGrant }> {
  const access = await getMcServerAccess(userId, serverId);

  if (!access.hasAccess || !access.role || !access.grant) {
    throw { error: "No server access", status: 403 };
  }

  if (!hasMinRole(access.role, minRole)) {
    throw { error: "Insufficient permissions", status: 403 };
  }

  return { role: access.role, grant: access.grant };
}

/**
 * Get a server's agent URL and secret from the database.
 */
export async function getServerAgent(serverId: string) {
  const [server] = await db
    .select({
      id: mcServers.id,
      name: mcServers.name,
      agentUrl: mcServers.agentUrl,
      agentSecret: mcServers.agentSecret,
    })
    .from(mcServers)
    .where(eq(mcServers.id, serverId))
    .limit(1);

  if (!server) {
    throw { error: "Server not found", status: 404 };
  }

  return server;
}

/**
 * Authenticated fetch to a server's agent.
 * Signs a JWT with the server's agent secret for the given user.
 */
export async function agentFetch(
  serverId: string,
  path: string,
  userId: string,
  userRole: McRole,
  options?: RequestInit
): Promise<Response> {
  const server = await getServerAgent(serverId);
  const secret = new TextEncoder().encode(server.agentSecret);

  const token = await new SignJWT({
    sub: userId,
    role: userRole,
    serverId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  const url = `${server.agentUrl}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

/**
 * Issue a short-lived JWT token for direct browser-to-agent connections (SSE).
 */
export async function issueAgentToken(
  serverId: string,
  userId: string,
  userRole: McRole
): Promise<{ token: string; agentUrl: string; expiresAt: string }> {
  const server = await getServerAgent(serverId);
  const secret = new TextEncoder().encode(server.agentSecret);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const token = await new SignJWT({
    sub: userId,
    role: userRole,
    serverId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return {
    token,
    agentUrl: server.agentUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Log an event to the MC server events audit log.
 */
export async function logMcEvent(
  serverId: string,
  userId: string | null,
  action: string,
  category: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  await db.insert(mcServerEvents).values({
    serverId,
    userId,
    action,
    category,
    details: details ?? {},
    ipAddress: ipAddress ?? null,
  });
}
