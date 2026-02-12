"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { Product, ProductPrice } from "@/lib/db/schema";

type ProductWithPrices = Product & {
  prices: ProductPrice[];
};

interface ProductsTableProps {
  products: ProductWithPrices[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle product status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeletingId(id);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "free":
        return "Free";
      case "paid":
        return "Paid";
      case "subscription":
        return "Subscription";
      default:
        return type;
    }
  };

  const getPriceRange = (prices: ProductPrice[]) => {
    if (prices.length === 0) return "No pricing";
    const activePrices = prices.filter((p) => p.priceCents > 0);
    if (activePrices.length === 0) return "Free";

    const min = Math.min(...activePrices.map((p) => p.priceCents));
    const max = Math.max(...activePrices.map((p) => p.priceCents));

    if (min === max) return `$${(min / 100).toFixed(2)}`;
    return `$${(min / 100).toFixed(2)} - $${(max / 100).toFixed(2)}`;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Icons.Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">
          No products yet
        </h3>
        <p className="mt-2 text-muted-foreground">
          Get started by creating your first product.
        </p>
        <Link
          href="/admin/products/new"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Icons.Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Product
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Price
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Availability
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {products.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-b border-border last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Icons.Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      product.productType === "free" &&
                        "bg-green-500/10 text-green-500",
                      product.productType === "paid" &&
                        "bg-blue-500/10 text-blue-500",
                      product.productType === "subscription" &&
                        "bg-purple-500/10 text-purple-500"
                    )}
                  >
                    {getProductTypeLabel(product.productType)}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground">
                  {getPriceRange(product.prices)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      product.availability === "coming_soon" &&
                        "bg-amber-500/10 text-amber-500",
                      product.availability === "discontinued" &&
                        "bg-red-500/10 text-red-500",
                      (!product.availability || product.availability === "available") &&
                        "bg-green-500/10 text-green-500"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        product.availability === "coming_soon" && "bg-amber-500",
                        product.availability === "discontinued" && "bg-red-500",
                        (!product.availability || product.availability === "available") && "bg-green-500"
                      )}
                    />
                    {product.availability === "coming_soon"
                      ? "Coming Soon"
                      : product.availability === "discontinued"
                      ? "Discontinued"
                      : "Available"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() =>
                      handleToggleActive(product.id, product.isActive)
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                      product.isActive
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        product.isActive ? "bg-green-500" : "bg-muted-foreground"
                      )}
                    />
                    {product.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Icons.Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === product.id ? (
                        <Icons.Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icons.Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
