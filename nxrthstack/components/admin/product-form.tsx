"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/db/schema";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    productType: product?.productType ?? "paid",
    imageUrl: product?.imageUrl ?? "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: mode === "create" ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (mode === "create") {
        router.push(`/admin/products/${data.product.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Core product details visible to customers
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              required
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="My Awesome Software"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              URL Slug
            </label>
            <div className="mt-2 flex items-center">
              <span className="rounded-l-lg border border-r-0 border-input bg-muted px-4 py-3 text-muted-foreground">
                /shop/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: generateSlug(e.target.value),
                  }))
                }
                required
                className="w-full rounded-r-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="my-awesome-software"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              maxLength={500}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="A brief description for product cards"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Full Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={5}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Detailed product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://example.com/image.png"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Direct URL to product image (upload feature coming soon)
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Product Type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How this product is sold to customers
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              value: "free",
              label: "Free Download",
              description: "Available for free download",
              icon: Icons.Download,
            },
            {
              value: "paid",
              label: "Paid License",
              description: "One-time purchase with license key",
              icon: Icons.CreditCard,
            },
            {
              value: "subscription",
              label: "Subscription",
              description: "Recurring payment for access",
              icon: Icons.Calendar,
            },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, productType: type.value }))
              }
              className={cn(
                "flex flex-col items-start rounded-lg border p-4 text-left transition-colors",
                formData.productType === type.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <type.icon
                className={cn(
                  "h-5 w-5",
                  formData.productType === type.value
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <p className="mt-3 font-medium text-foreground">{type.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </motion.form>
  );
}
