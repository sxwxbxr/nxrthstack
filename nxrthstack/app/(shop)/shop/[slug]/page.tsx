import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db, products, productPrices, productImages, purchases, subscriptions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { FadeIn } from "@/components/ui/fade-in";
import { PricingTable } from "@/components/shop/pricing-table";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Icons } from "@/components/icons";
import { Markdown } from "@/components/ui/markdown";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      prices: {
        where: eq(productPrices.isActive, true),
        orderBy: [productPrices.sortOrder],
      },
      images: {
        orderBy: [productImages.sortOrder],
      },
    },
  });

  return product;
}

async function checkOwnership(userId: string, productId: string): Promise<boolean> {
  // Check for completed purchase
  const purchase = await db.query.purchases.findFirst({
    where: and(
      eq(purchases.userId, userId),
      eq(purchases.productId, productId),
      eq(purchases.status, "completed")
    ),
  });

  if (purchase) return true;

  // Check for active subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.productId, productId),
      eq(subscriptions.status, "active")
    ),
  });

  return !!subscription;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} | NxrthStack Shop`,
    description: product.shortDescription || product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, session] = await Promise.all([getProduct(slug), auth()]);

  if (!product || !product.isActive) {
    notFound();
  }

  // Check if user already owns this product
  const isOwned = session?.user?.id
    ? await checkOwnership(session.user.id, product.id)
    : false;

  const allFeatures = product.prices
    .flatMap((price) => (price.features as string[]) || [])
    .filter((value, index, self) => self.indexOf(value) === index);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <FadeIn>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icons.ArrowRight className="h-4 w-4 rotate-180" />
          Back to Shop
        </Link>
      </FadeIn>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        {/* Product Info */}
        <FadeIn>
          <div>
            {/* Product Gallery */}
            <ProductGallery
              images={product.images}
              fallbackImageUrl={product.imageUrl}
              productName={product.name}
            />

            {/* Details */}
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {product.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    product.productType === "free"
                      ? "bg-green-500/10 text-green-500"
                      : product.productType === "subscription"
                      ? "bg-purple-500/10 text-purple-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {product.productType === "free"
                    ? "Free"
                    : product.productType === "subscription"
                    ? "Subscription"
                    : "License"}
                </span>
              </div>

              {product.shortDescription && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {product.shortDescription}
                </p>
              )}

              {product.description && (
                <div className="mt-6">
                  <Markdown>{product.description}</Markdown>
                </div>
              )}

              {/* Features */}
              {allFeatures.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-foreground">
                    Features
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {allFeatures.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <Icons.Check className="h-5 w-5 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Pricing */}
        <FadeIn delay={0.2}>
          <div className="lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              {product.productType === "free" ? "Get Started" : "Select a Plan"}
            </h2>
            <PricingTable
              productId={product.id}
              productType={product.productType}
              prices={product.prices}
              isOwned={isOwned}
            />
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
