"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { Product, ProductPrice } from "@/lib/db/schema";

type ProductWithPrices = Product & {
  prices: ProductPrice[];
};

interface ProductCardProps {
  product: ProductWithPrices;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const getLowestPrice = () => {
    if (product.productType === "free") return "Free";
    const activePrices = product.prices.filter((p) => p.priceCents > 0);
    if (activePrices.length === 0) return "Free";
    const min = Math.min(...activePrices.map((p) => p.priceCents));
    return `$${(min / 100).toFixed(2)}`;
  };

  const getProductTypeBadge = () => {
    switch (product.productType) {
      case "free":
        return { label: "Free", className: "bg-green-500/10 text-green-500" };
      case "paid":
        return { label: "License", className: "bg-blue-500/10 text-blue-500" };
      case "subscription":
        return { label: "Subscription", className: "bg-purple-500/10 text-purple-500" };
      default:
        return null;
    }
  };

  const getAvailabilityBadge = () => {
    switch (product.availability) {
      case "coming_soon":
        return { label: "Coming Soon", className: "bg-amber-500/10 text-amber-500" };
      case "discontinued":
        return { label: "No Longer Available", className: "bg-red-500/10 text-red-500" };
      default:
        return null;
    }
  };

  const badge = getProductTypeBadge();
  const availabilityBadge = getAvailabilityBadge();
  const isComingSoon = product.availability === "coming_soon";
  const isDiscontinued = product.availability === "discontinued";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/shop/${product.slug}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-card transition-colors",
            isDiscontinued
              ? "border-border/50 opacity-75 hover:opacity-100 hover:border-border"
              : "border-border hover:border-primary/50"
          )}
        >
          {/* Image */}
          <div className={cn(
            "aspect-[16/10] overflow-hidden bg-muted",
            isDiscontinued && "grayscale-[50%]"
          )}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Icons.Package className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            {availabilityBadge && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  availabilityBadge.className
                )}
              >
                {availabilityBadge.label}
              </span>
            )}
            {badge && !isDiscontinued && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  badge.className
                )}
              >
                {badge.label}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.shortDescription && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              {isComingSoon ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
                  <Icons.Bell className="h-4 w-4" />
                  Get Notified
                </span>
              ) : isDiscontinued ? (
                <span className="text-sm font-medium text-muted-foreground">
                  Discontinued
                </span>
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {getLowestPrice()}
                  {product.productType === "subscription" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  )}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium text-primary">
                {isComingSoon ? "Learn More" : isDiscontinued ? "Details" : "View Details"}
                <Icons.ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
