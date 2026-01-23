import { NextRequest, NextResponse } from "next/server";
import { db, licenses, deviceActivations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/nxrthguard/auth-middleware";
import { formatLicenseResponse, getFeaturesForTier } from "@/lib/nxrthguard/features";
import { validateLicense } from "@/lib/license";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const { license_key } = body;

    if (!license_key) {
      return NextResponse.json(
        { error: "invalid_license_key", message: "License key is required" },
        { status: 400 }
      );
    }

    // Check if user already has a license
    const existingLicense = await db.query.licenses.findFirst({
      where: eq(licenses.userId, auth.user.id),
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: "license_exists", message: "This account already has an active license" },
        { status: 400 }
      );
    }

    // Validate the license key format
    const validation = validateLicense(license_key);
    if (!validation.valid || !validation.tier) {
      return NextResponse.json(
        { error: "invalid_license_key", message: validation.error || "The license key is invalid" },
        { status: 400 }
      );
    }

    // Check if license key is already used
    const usedLicense = await db.query.licenses.findFirst({
      where: eq(licenses.licenseKey, license_key.toUpperCase()),
    });

    if (usedLicense) {
      return NextResponse.json(
        { error: "invalid_license_key", message: "The license key has already been used" },
        { status: 400 }
      );
    }

    // Create the license
    const features = getFeaturesForTier(validation.tier);
    const [newLicense] = await db
      .insert(licenses)
      .values({
        userId: auth.user.id,
        licenseKey: license_key.toUpperCase(),
        tier: validation.tier,
        features,
        maxDevices: 5,
        expiresAt: null, // Lifetime for purchased licenses
        isTrial: false,
      })
      .returning();

    // Create initial device activation
    await db.insert(deviceActivations).values({
      licenseId: newLicense.id,
      userId: auth.user.id,
      deviceName: "Initial activation",
    });

    return NextResponse.json({
      success: true,
      license: formatLicenseResponse(newLicense, 1),
    });
  } catch (error) {
    console.error("License activation error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
