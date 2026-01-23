import { NextRequest, NextResponse } from "next/server";
import { db, licenses, deviceActivations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/nxrthguard/auth-middleware";
import { formatLicenseResponse } from "@/lib/nxrthguard/features";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    // Get user's license
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.userId, auth.user.id),
    });

    if (!license) {
      return NextResponse.json({
        valid: false,
        license: null,
      });
    }

    // Check if license is expired
    if (license.expiresAt && new Date() > license.expiresAt) {
      return NextResponse.json({
        valid: false,
        license: null,
      });
    }

    // Count device activations
    const activations = await db.query.deviceActivations.findMany({
      where: eq(deviceActivations.licenseId, license.id),
    });

    return NextResponse.json({
      valid: true,
      license: formatLicenseResponse(license, activations.length),
    });
  } catch (error) {
    console.error("License status error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
