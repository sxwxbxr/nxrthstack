import { jwtVerify } from "jose";
import type { AgentUser } from "../types/events.js";

const MC_AGENT_SECRET = process.env.MC_AGENT_SECRET || "";

let secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (!secretKey) {
    secretKey = new TextEncoder().encode(MC_AGENT_SECRET);
  }
  return secretKey;
}

/**
 * Verify a JWT token and return the decoded user payload.
 * Throws if invalid or expired.
 */
export async function verifyToken(token: string): Promise<AgentUser> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });

  if (!payload.sub || !payload.role || !payload.serverId) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub as string,
    role: payload.role as string,
    serverId: payload.serverId as string,
  };
}
