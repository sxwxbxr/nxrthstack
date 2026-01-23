import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db, purchases, products, productPrices, users, licenses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateLicense } from "@/lib/license";
import { getFeaturesForTier } from "@/lib/nxrthguard/features";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Check if we already processed this session
    const existingPurchase = await db.query.purchases.findFirst({
      where: eq(purchases.stripeCheckoutSessionId, sessionId),
    });

    if (existingPurchase) {
      // Already processed, return the existing license
      return NextResponse.json({
        success: true,
        licenseKey: existingPurchase.licenseKey,
        alreadyProcessed: true,
      });
    }

    // Get metadata from the session
    const { userId, productId, priceId } = checkoutSession.metadata || {};

    if (!userId || !productId || !priceId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Verify the user matches
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    // Get product and price details
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    const price = await db.query.productPrices.findFirst({
      where: eq(productPrices.id, priceId),
    });

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!product || !price || !user) {
      return NextResponse.json({ error: "Product, price, or user not found" }, { status: 404 });
    }

    // Generate license key for paid products
    let licenseKey: string | null = null;

    if (product.productType === "paid") {
      licenseKey = await generateLicense({
        productId,
        userId,
        userEmail: user.email,
        tier: price.name,
        productName: product.name,
      });
    }

    // Create purchase record
    const [purchase] = await db.insert(purchases).values({
      userId,
      productId,
      priceId,
      stripePaymentIntentId: checkoutSession.payment_intent as string,
      stripeCheckoutSessionId: sessionId,
      amountCents: checkoutSession.amount_total || price.priceCents,
      currency: checkoutSession.currency || "usd",
      status: "completed",
      licenseKey,
      completedAt: new Date(),
    }).returning();

    // Create license record for NxrthGuard API
    if (licenseKey && product.productType === "paid") {
      // Determine tier from price name
      const tier = price.name.toLowerCase().includes("plus") ? "plus" : "plus";
      const features = getFeaturesForTier(tier);

      // Check if user already has a license
      const existingLicense = await db.query.licenses.findFirst({
        where: eq(licenses.userId, userId),
      });

      if (!existingLicense) {
        await db.insert(licenses).values({
          userId,
          licenseKey,
          tier,
          features,
          maxDevices: 5,
          expiresAt: null, // Lifetime license
          isTrial: false,
          purchaseId: purchase.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      licenseKey,
      alreadyProcessed: false,
    });
  } catch (error) {
    console.error("Verify checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to verify checkout: ${errorMessage}` },
      { status: 500 }
    );
  }
}
