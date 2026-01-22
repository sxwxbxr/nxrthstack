import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productPrices, products } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const createPriceSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().min(0),
  billingPeriod: z.enum(["monthly", "annual", "custom"]).nullable().optional(),
  billingIntervalCount: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const prices = await db.query.productPrices.findMany({
      where: eq(productPrices.productId, id),
      orderBy: [productPrices.sortOrder],
    });

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const parsed = createPriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, priceCents, billingPeriod, billingIntervalCount, features } =
      parsed.data;

    // Get the product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create Stripe price if product is paid/subscription
    let stripePriceId: string | null = null;

    if (product.productType !== "free" && priceCents > 0) {
      try {
        // First, get or create a Stripe product
        let stripeProductId = (product.metadata as { stripeProductId?: string })?.stripeProductId;

        if (!stripeProductId) {
          const stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.shortDescription || undefined,
          });
          stripeProductId = stripeProduct.id;

          // Update product with Stripe product ID
          await db
            .update(products)
            .set({
              metadata: { ...((product.metadata as object) || {}), stripeProductId },
            })
            .where(eq(products.id, productId));
        }

        // Create Stripe price
        const priceParams: Stripe.PriceCreateParams = {
          product: stripeProductId,
          unit_amount: priceCents,
          currency: "usd",
          nickname: name,
        };

        if (product.productType === "subscription" && billingPeriod) {
          let interval: "month" | "year" = "month";
          let intervalCount = billingIntervalCount || 1;

          if (billingPeriod === "annual") {
            interval = "year";
            intervalCount = 1;
          } else if (billingPeriod === "custom") {
            interval = "month";
          }

          priceParams.recurring = {
            interval,
            interval_count: intervalCount,
          };
        }

        const stripePrice = await stripe.prices.create(priceParams);
        stripePriceId = stripePrice.id;
      } catch (stripeError) {
        console.error("Failed to create Stripe price:", stripeError);
        // Continue without Stripe price - can be created later
      }
    }

    // Get current max sort order
    const existingPrices = await db.query.productPrices.findMany({
      where: eq(productPrices.productId, productId),
    });
    const maxSortOrder = Math.max(0, ...existingPrices.map((p) => p.sortOrder));

    const [newPrice] = await db
      .insert(productPrices)
      .values({
        productId,
        name,
        priceCents,
        billingPeriod: billingPeriod || null,
        billingIntervalCount: billingIntervalCount || 1,
        features: features || [],
        stripePriceId,
        sortOrder: maxSortOrder + 1,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ price: newPrice }, { status: 201 });
  } catch (error) {
    console.error("Failed to create price:", error);
    return NextResponse.json(
      { error: "Failed to create price" },
      { status: 500 }
    );
  }
}
