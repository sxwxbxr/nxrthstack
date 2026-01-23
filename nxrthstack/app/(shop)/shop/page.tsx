import { db, products, productPrices } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { ProductCard } from "@/components/shop/product-card";
import { FadeIn } from "@/components/ui/fade-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop | NxrthStack",
  description: "Browse and download professional software tools and applications",
};

async function getProducts() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [desc(products.createdAt)],
    with: {
      prices: {
        where: eq(productPrices.isActive, true),
        orderBy: [productPrices.sortOrder],
      },
    },
  });

  return allProducts;
}

export default async function ShopPage() {
  const allProducts = await getProducts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <FadeIn>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Software Shop
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Professional tools and applications to power your workflow
          </p>
        </div>
      </FadeIn>

      {allProducts.length === 0 ? (
        <FadeIn delay={0.2}>
          <div className="mt-16 rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="text-lg text-muted-foreground">
              No products available yet. Check back soon!
            </p>
          </div>
        </FadeIn>
      ) : (
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
