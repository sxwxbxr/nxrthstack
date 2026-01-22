import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db, products, productPrices, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  priceId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, priceId } = parsed.data;

    // Get product and price
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const price = await db.query.productPrices.findFirst({
      where: eq(productPrices.id, priceId),
    });

    if (!price || !price.isActive || price.productId !== productId) {
      return NextResponse.json({ error: "Price not found" }, { status: 404 });
    }

    // Free products don't need checkout
    if (price.priceCents === 0) {
      // TODO: Handle free product "purchase"
      return NextResponse.json({
        url: `/dashboard/downloads?product=${productId}`,
      });
    }

    // Get or create Stripe customer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, session.user.id));
    }

    // Ensure Stripe price exists
    if (!price.stripePriceId) {
      return NextResponse.json(
        { error: "Payment not configured for this product" },
        { status: 400 }
      );
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: product.productType === "subscription" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/shop/${product.slug}`,
      metadata: {
        userId: session.user.id,
        productId,
        priceId,
      },
      customer_update: {
        address: "auto",
      },
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
