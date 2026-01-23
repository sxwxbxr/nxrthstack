import { NextResponse } from "next/server";
import { db, users, licenses, deviceActivations, refreshTokens } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "@/lib/nxrthguard/jwt";
import { formatLicenseResponse } from "@/lib/nxrthguard/features";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, device_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      deviceName: device_name || null,
      expiresAt: getRefreshTokenExpiry(),
    });

    // Get user's license
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.userId, user.id),
    });

    let licenseResponse = null;

    if (license) {
      // Check if license is expired
      const isExpired = license.expiresAt && new Date() > license.expiresAt;

      if (!isExpired) {
        // Count device activations
        const activations = await db.query.deviceActivations.findMany({
          where: eq(deviceActivations.licenseId, license.id),
        });

        licenseResponse = formatLicenseResponse(license, activations.length);
      }
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      license: licenseResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
