import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "invalid_token", message: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: "invalid_token", message: "Access token is invalid or expired" },
        { status: 401 }
      ),
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  });

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "invalid_token", message: "User not found" },
        { status: 401 }
      ),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}
