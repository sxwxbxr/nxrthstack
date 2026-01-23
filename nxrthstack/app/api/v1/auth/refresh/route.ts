import { NextResponse } from "next/server";
import { db, users, refreshTokens } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import {
  generateAccessToken,
  hashRefreshToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "@/lib/nxrthguard/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: "invalid_refresh_token", message: "Refresh token is required" },
        { status: 400 }
      );
    }

    const tokenHash = hashRefreshToken(refresh_token);

    // Find the refresh token
    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, new Date())
      ),
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: "invalid_refresh_token", message: "Refresh token is invalid or expired" },
        { status: 401 }
      );
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, storedToken.userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "invalid_refresh_token", message: "User not found" },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = await generateAccessToken(user.id, user.email);

    return NextResponse.json({
      access_token: accessToken,
      expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
