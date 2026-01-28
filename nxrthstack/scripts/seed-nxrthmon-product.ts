import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

// NxrthMon Product Data
const productData = {
  name: "NxrthMon",
  slug: "nxrthmon",
  productType: "subscription" as const,
  shortDescription:
    "Lightweight system monitor with historical tracking, smart alerts, and a clean interface that goes beyond Windows Task Manager.",
  description: `**Stop guessing what's eating your system resources.**

NxrthMon is a modern system monitoring tool that answers the question Task Manager can't: "What happened while I was away?" With historical tracking, intelligent alerts, and a clean customizable interface, you'll finally understand your PC's behavior.

**Key Features:**

- **Historical Graphs** - See CPU, RAM, disk, and network usage over hours, days, or weeks - not just right now
- **Smart Alerts** - Get notified before problems escalate with customizable threshold warnings
- **Clean Dashboard** - Modern, customizable interface that makes Resource Monitor look like Windows 95
- **Per-Process Analytics** - Track which applications consume the most resources over time
- **Temperature Monitoring** - Keep an eye on CPU and GPU temps with throttling detection
- **Startup Analysis** - Know exactly how each startup app impacts your boot time
- **Zero Telemetry** - All data stays on your machine. No accounts, no cloud, no tracking.

**Who It's For:**

NxrthMon is built for developers debugging performance issues, gamers optimizing their rigs, power users who want to understand their system, and anyone tired of Windows' built-in tools. If you've ever wished Task Manager had a "what happened yesterday" button, this is for you.

**Take control of your system's performance - download NxrthMon today.**`,
};

// Pricing Tiers with features based on the Tech Spec
const pricingTiers = [
  // Basic Monthly
  {
    name: "Basic",
    priceCents: 299, // $2.99/month
    billingPeriod: "monthly" as const,
    billingIntervalCount: 1,
    sortOrder: 1,
    features: [
      "Real-time CPU, RAM, Disk, Network monitoring",
      "Process list with sorting and filtering",
      "24-hour historical graphs",
      "System tray with quick stats",
      "Light and dark themes",
      "1 device license",
    ],
  },
  // Basic Annual
  {
    name: "Basic Annual",
    priceCents: 2499, // $24.99/year (save ~30%)
    billingPeriod: "annual" as const,
    billingIntervalCount: 1,
    sortOrder: 2,
    features: [
      "Real-time CPU, RAM, Disk, Network monitoring",
      "Process list with sorting and filtering",
      "24-hour historical graphs",
      "System tray with quick stats",
      "Light and dark themes",
      "1 device license",
      "2 months free (annual billing)",
    ],
  },
  // Pro Monthly
  {
    name: "Pro",
    priceCents: 499, // $4.99/month
    billingPeriod: "monthly" as const,
    billingIntervalCount: 1,
    sortOrder: 3,
    features: [
      "Everything in Basic",
      "30-day historical data",
      "CPU & GPU temperature monitoring",
      "Threshold alerts (CPU, RAM, Temperature)",
      "Per-process network bandwidth tracking",
      "Startup impact analysis",
      "Export to CSV/JSON",
      "3 device licenses",
    ],
  },
  // Pro Annual
  {
    name: "Pro Annual",
    priceCents: 4499, // $44.99/year (save ~25%)
    billingPeriod: "annual" as const,
    billingIntervalCount: 1,
    sortOrder: 4,
    features: [
      "Everything in Basic",
      "30-day historical data",
      "CPU & GPU temperature monitoring",
      "Threshold alerts (CPU, RAM, Temperature)",
      "Per-process network bandwidth tracking",
      "Startup impact analysis",
      "Export to CSV/JSON",
      "3 device licenses",
      "2 months free (annual billing)",
    ],
  },
  // Power User Monthly
  {
    name: "Power User",
    priceCents: 799, // $7.99/month
    billingPeriod: "monthly" as const,
    billingIntervalCount: 1,
    sortOrder: 5,
    features: [
      "Everything in Pro",
      "90-day historical data",
      "Advanced compound alerts",
      "Process-specific alerts",
      "Customizable widget dashboard",
      "Weekly/monthly PDF reports",
      "Latency monitoring",
      "Performance recommendations",
      "Unlimited device licenses",
      "Priority support",
    ],
  },
  // Power User Annual
  {
    name: "Power User Annual",
    priceCents: 6999, // $69.99/year (save ~27%)
    billingPeriod: "annual" as const,
    billingIntervalCount: 1,
    sortOrder: 6,
    features: [
      "Everything in Pro",
      "90-day historical data",
      "Advanced compound alerts",
      "Process-specific alerts",
      "Customizable widget dashboard",
      "Weekly/monthly PDF reports",
      "Latency monitoring",
      "Performance recommendations",
      "Unlimited device licenses",
      "Priority support",
      "2 months free (annual billing)",
    ],
  },
];

async function seed() {
  console.log("=".repeat(60));
  console.log("  NxrthMon Product Seeder");
  console.log("=".repeat(60));
  console.log();

  // Step 1: Check if product already exists
  console.log("Step 1: Checking for existing product...");
  const existingProduct = await db.query.products.findFirst({
    where: eq(schema.products.slug, productData.slug),
  });

  let productId: string;
  let stripeProductId: string;

  if (existingProduct) {
    console.log(`  Product "${productData.name}" already exists.`);
    productId = existingProduct.id;
    stripeProductId = (existingProduct.metadata as { stripeProductId?: string })
      ?.stripeProductId as string;

    if (!stripeProductId) {
      console.log("  Creating Stripe product...");
      const stripeProduct = await stripe.products.create({
        name: productData.name,
        description: productData.shortDescription,
      });
      stripeProductId = stripeProduct.id;

      await db
        .update(schema.products)
        .set({
          metadata: {
            ...((existingProduct.metadata as object) || {}),
            stripeProductId,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, productId));
      console.log(`  Stripe Product ID: ${stripeProductId}`);
    } else {
      console.log(`  Stripe Product already exists: ${stripeProductId}`);
    }
  } else {
    // Step 2: Create Stripe Product
    console.log("\nStep 2: Creating Stripe product...");
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.shortDescription,
    });
    stripeProductId = stripeProduct.id;
    console.log(`  Stripe Product ID: ${stripeProductId}`);

    // Step 3: Create product in database
    console.log("\nStep 3: Creating product in database...");
    const [newProduct] = await db
      .insert(schema.products)
      .values({
        name: productData.name,
        slug: productData.slug,
        productType: productData.productType,
        shortDescription: productData.shortDescription,
        description: productData.description,
        isActive: true,
        metadata: { stripeProductId },
      })
      .returning();

    productId = newProduct.id;
    console.log(`  Product ID: ${productId}`);
    console.log(`  Product created successfully!`);
  }

  // Step 4: Create pricing tiers
  console.log("\nStep 4: Creating pricing tiers...");
  console.log("-".repeat(60));

  for (const tier of pricingTiers) {
    try {
      // Check if tier already exists
      const existingPrices = await db.query.productPrices.findMany({
        where: eq(schema.productPrices.productId, productId),
      });

      const existingTier = existingPrices.find((p) => p.name === tier.name);

      if (existingTier) {
        console.log(`  [SKIP] ${tier.name} - already exists`);
        continue;
      }

      // Create Stripe price
      const interval: "month" | "year" =
        tier.billingPeriod === "annual" ? "year" : "month";

      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: tier.priceCents,
        currency: "usd",
        nickname: tier.name,
        recurring: {
          interval,
          interval_count: tier.billingIntervalCount,
        },
      });

      // Create price in database
      await db.insert(schema.productPrices).values({
        productId,
        name: tier.name,
        priceCents: tier.priceCents,
        billingPeriod: tier.billingPeriod,
        billingIntervalCount: tier.billingIntervalCount,
        features: tier.features,
        stripePriceId: stripePrice.id,
        sortOrder: tier.sortOrder,
        isActive: true,
      });

      const priceDisplay =
        tier.billingPeriod === "annual"
          ? `$${(tier.priceCents / 100).toFixed(2)}/year`
          : `$${(tier.priceCents / 100).toFixed(2)}/month`;

      console.log(`  [OK] ${tier.name} - ${priceDisplay}`);
      console.log(`       Stripe Price ID: ${stripePrice.id}`);
    } catch (error) {
      console.error(`  [ERROR] ${tier.name}:`, error);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));
  console.log();
  console.log(`  Product: ${productData.name}`);
  console.log(`  Slug: ${productData.slug}`);
  console.log(`  Type: ${productData.productType}`);
  console.log(`  Database ID: ${productId}`);
  console.log(`  Stripe Product ID: ${stripeProductId}`);
  console.log();
  console.log("  Pricing Tiers Created:");
  console.log("  -----------------------");
  console.log("  Basic:      $2.99/mo  |  $24.99/yr");
  console.log("  Pro:        $4.99/mo  |  $44.99/yr");
  console.log("  Power User: $7.99/mo  |  $69.99/yr");
  console.log();
  console.log("  Next Steps:");
  console.log("  1. Check your Stripe Dashboard to verify the product/prices");
  console.log("  2. Visit /shop/nxrthmon to see the product page");
  console.log("  3. Test the checkout flow with a Stripe test card");
  console.log();
  console.log("=".repeat(60));
}

seed()
  .then(() => {
    console.log("\nSeeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });
