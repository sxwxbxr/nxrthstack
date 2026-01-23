import { NextRequest, NextResponse } from "next/server";
import { db, licenses, deviceActivations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/nxrthguard/auth-middleware";
import { formatLicenseResponse, TRIAL_FEATURES } from "@/lib/nxrthguard/features";
import { generateLicense } from "@/lib/license";

const TRIAL_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    // Check if user already has a license (including expired trials)
    const existingLicense = await db.query.licenses.findFirst({
      where: eq(licenses.userId, auth.user.id),
    });

    if (existingLicense) {
      if (existingLicense.isTrial) {
        return NextResponse.json(
          { error: "trial_already_used", message: "You have already used your free trial" },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "license_exists", message: "This account already has an active license" },
          { status: 400 }
        );
      }
    }

    // Generate trial license key
    const licenseKey = await generateLicense({
      productId: "trial",
      userId: auth.user.id,
      userEmail: auth.user.email,
      tier: "trial",
      productName: "NxrthGuard Trial",
    });

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

    // Create the trial license
    const [newLicense] = await db
      .insert(licenses)
      .values({
        userId: auth.user.id,
        licenseKey,
        tier: "trial",
        features: TRIAL_FEATURES,
        maxDevices: 5,
        expiresAt,
        isTrial: true,
        trialStartedAt: new Date(),
      })
      .returning();

    // Create initial device activation
    await db.insert(deviceActivations).values({
      licenseId: newLicense.id,
      userId: auth.user.id,
      deviceName: "Trial activation",
    });

    return NextResponse.json({
      license: formatLicenseResponse(newLicense, 1),
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
