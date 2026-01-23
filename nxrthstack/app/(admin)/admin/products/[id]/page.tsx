import { notFound } from "next/navigation";
import { db, products, productPrices, productFiles, productImages } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/product-form";
import { PricingManager } from "@/components/admin/pricing-manager";
import { FilesManager } from "@/components/admin/files-manager";

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      prices: {
        orderBy: [productPrices.sortOrder],
      },
      files: true,
      images: {
        orderBy: [productImages.sortOrder],
      },
    },
  });

  return product;
}

export async function generateMetadata({ params }: ProductEditPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `Edit ${product.name} | Admin - NxrthStack`,
  };
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
        <p className="mt-1 text-muted-foreground">
          Update product details, pricing, and files
        </p>
      </div>

      <div className="space-y-8">
        <ProductForm product={product} mode="edit" />

        <PricingManager productId={product.id} prices={product.prices} productType={product.productType} />

        <FilesManager productId={product.id} files={product.files} prices={product.prices} />
      </div>
    </div>
  );
}
