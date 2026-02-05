"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExtendedSession } from "@/lib/auth/hooks";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { ProductPrice } from "@/lib/db/schema";

interface PricingTableProps {
  productId: string;
  productType: string;
  prices: ProductPrice[];
  isOwned?: boolean;
}

export function PricingTable({ productId, productType, prices, isOwned = false }: PricingTableProps) {
  const router = useRouter();
  const { isAuthenticated } = useExtendedSession();
  const [selectedPrice, setSelectedPrice] = useState(prices[0]?.id);
  const [isLoading, setIsLoading] = useState(false);

  // If user already owns this product, show "Go to Downloads" button
  if (isOwned) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <Icons.Check className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">You own this product</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your downloads in the dashboard
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/dashboard/downloads")}
          className="mt-6 w-full rounded-lg bg-green-500 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
        >
          Go to Downloads
        </motion.button>
      </div>
    );
  }

  const handleCheckout = async (priceId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/shop`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          priceId,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimFree = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/shop`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/claim-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard/downloads");
      } else if (data.alreadyClaimed) {
        router.push("/dashboard/downloads");
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Claim error:", error);
      alert("Failed to claim product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (priceCents: number, billingPeriod: string | null) => {
    const price = (priceCents / 100).toFixed(2);
    if (!billingPeriod) return `$${price}`;

    switch (billingPeriod) {
      case "monthly":
        return `$${price}/mo`;
      case "annual":
        return `$${price}/yr`;
      default:
        return `$${price}`;
    }
  };

  // Handle free products without price tiers
  if (productType === "free" && prices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">Free</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No payment required
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClaimFree}
          disabled={isLoading}
          className="mt-8 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <Icons.Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            "Get your hands on it"
          )}
        </motion.button>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Pricing not available. Please contact us.
        </p>
      </div>
    );
  }

  if (prices.length === 1) {
    const price = prices[0];
    const isFree = productType === "free" || price.priceCents === 0;

    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {isFree ? "Free" : formatPrice(price.priceCents, price.billingPeriod)}
          </p>
          {productType === "paid" && price.priceCents > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">One-time purchase</p>
          )}
          {isFree && (
            <p className="mt-1 text-sm text-muted-foreground">No payment required</p>
          )}
        </div>

        {((price.features as string[]) || []).length > 0 && (
          <ul className="mt-6 space-y-3">
            {((price.features as string[]) || []).map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                <Icons.Check className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => isFree ? handleClaimFree() : handleCheckout(price.id)}
          disabled={isLoading}
          className="mt-8 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <Icons.Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : isFree ? (
            "Get your hands on it"
          ) : (
            "Buy Now"
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prices.map((price) => (
        <motion.div
          key={price.id}
          whileHover={{ scale: 1.01 }}
          onClick={() => setSelectedPrice(price.id)}
          className={cn(
            "cursor-pointer rounded-xl border-2 p-6 transition-colors",
            selectedPrice === price.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{price.name}</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {price.priceCents === 0 ? "Free" : formatPrice(price.priceCents, price.billingPeriod)}
              </p>
            </div>
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2",
                selectedPrice === price.id
                  ? "border-primary bg-primary"
                  : "border-border"
              )}
            >
              {selectedPrice === price.id && (
                <Icons.Check className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
          </div>

          {((price.features as string[]) || []).length > 0 && (
            <ul className="mt-4 space-y-2">
              {((price.features as string[]) || []).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icons.Check className="h-4 w-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      ))}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => selectedPrice && handleCheckout(selectedPrice)}
        disabled={isLoading || !selectedPrice}
        className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <Icons.Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          "Continue to Checkout"
        )}
      </motion.button>
    </div>
  );
}
