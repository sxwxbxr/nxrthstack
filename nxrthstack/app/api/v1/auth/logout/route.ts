import { NextRequest, NextResponse } from "next/server";
import { db, refreshTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/nxrthguard/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    // Delete all refresh tokens for this user (logout from all devices)
    // Alternatively, you could only delete the current device's token
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, auth.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
