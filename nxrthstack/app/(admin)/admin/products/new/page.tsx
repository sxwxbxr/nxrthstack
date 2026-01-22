import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "Create Product | Admin - NxrthStack",
};

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create Product</h1>
        <p className="mt-1 text-muted-foreground">
          Add a new product to your shop
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
