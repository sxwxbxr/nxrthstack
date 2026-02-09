import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productFiles, purchases, subscriptions } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    // Get the file
    const file = await db.query.productFiles.findFirst({
      where: eq(productFiles.id, fileId),
      with: {
        product: true,
        price: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has access to this file
    // For free products, always allow
    if (file.product?.productType === "free") {
      return NextResponse.json({ url: file.fileKey });
    }

    // Check for purchases or active subscriptions
    const userPurchase = await db.query.purchases.findFirst({
      where: and(
        eq(purchases.userId, session.user.id),
        eq(purchases.productId, file.productId),
        eq(purchases.status, "completed"),
        // If file is tier-specific, check price matches
        file.priceId
          ? eq(purchases.priceId, file.priceId)
          : undefined
      ),
    });

    const userSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.productId, file.productId),
        eq(subscriptions.status, "active"),
        // If file is tier-specific, check price matches
        file.priceId
          ? eq(subscriptions.priceId, file.priceId)
          : undefined
      ),
    });

    if (!userPurchase && !userSubscription) {
      // Admin bypass
      if (session.user.role === "admin") {
        return NextResponse.json({ url: file.fileKey });
      }
      return NextResponse.json(
        { error: "You don't have access to this file" },
        { status: 403 }
      );
    }

    // Return the file URL
    return NextResponse.json({
      url: file.fileKey,
      filename: file.name,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to get download link" },
      { status: 500 }
    );
  }
}
