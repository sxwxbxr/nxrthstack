import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db, purchases, subscriptions, products, productPrices, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateLicense } from "@/lib/license";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, productId, priceId } = session.metadata || {};

  if (!userId || !productId || !priceId) {
    console.error("Missing metadata in checkout session");
    return;
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
    console.error("Product, price, or user not found");
    return;
  }

  if (session.mode === "subscription") {
    // Create subscription record
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db.insert(subscriptions).values({
      userId,
      productId,
      priceId,
      stripeSubscriptionId: stripeSubscription.id,
      status: "active",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });
  } else {
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
    await db.insert(purchases).values({
      userId,
      productId,
      priceId,
      stripePaymentIntentId: session.payment_intent as string,
      stripeCheckoutSessionId: session.id,
      amountCents: session.amount_total || price.priceCents,
      currency: session.currency || "usd",
      status: "completed",
      licenseKey,
      completedAt: new Date(),
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, invoice.subscription as string),
  });

  if (!subscription) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
  });

  if (!subscription) return;

  let status = "active";
  if (stripeSubscription.status === "past_due") status = "past_due";
  if (stripeSubscription.status === "canceled") status = "canceled";
  if (stripeSubscription.status === "paused") status = "paused";

  await db
    .update(subscriptions)
    .set({
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
  });

  if (!subscription) return;

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.payment_intent) return;

  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, charge.payment_intent as string),
  });

  if (!purchase) return;

  await db
    .update(purchases)
    .set({ status: "refunded" })
    .where(eq(purchases.id, purchase.id));
}
