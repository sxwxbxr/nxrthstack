import Link from "next/link";
import { db, products, productPrices } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata = {
  title: "Products | Admin - NxrthStack",
};

async function getProducts() {
  const allProducts = await db.query.products.findMany({
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

export default async function ProductsPage() {
  const allProducts = await getProducts();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your software products and pricing
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Icons.Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <ProductsTable products={allProducts} />
    </div>
  );
}
