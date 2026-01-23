import { NextRequest, NextResponse } from "next/server";
import { db, licenses, deviceActivations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/nxrthguard/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const { device_fingerprint } = body;

    // Get user's license
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.userId, auth.user.id),
    });

    if (!license) {
      return NextResponse.json(
        { error: "no_license", message: "No license found for this account" },
        { status: 400 }
      );
    }

    // Delete device activation
    if (device_fingerprint) {
      // Delete specific device
      await db
        .delete(deviceActivations)
        .where(
          and(
            eq(deviceActivations.licenseId, license.id),
            eq(deviceActivations.deviceFingerprint, device_fingerprint)
          )
        );
    } else {
      // Delete most recent device activation for this user
      const activations = await db.query.deviceActivations.findMany({
        where: eq(deviceActivations.licenseId, license.id),
        orderBy: (deviceActivations, { desc }) => [desc(deviceActivations.activatedAt)],
        limit: 1,
      });

      if (activations.length > 0) {
        await db
          .delete(deviceActivations)
          .where(eq(deviceActivations.id, activations[0].id));
      }
    }

    // Get remaining device count
    const remainingActivations = await db.query.deviceActivations.findMany({
      where: eq(deviceActivations.licenseId, license.id),
    });

    return NextResponse.json({
      success: true,
      device_count: remainingActivations.length,
    });
  } catch (error) {
    console.error("License deactivation error:", error);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
