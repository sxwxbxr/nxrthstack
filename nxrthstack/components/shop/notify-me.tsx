"use client";

import { useState } from "react";
import { useExtendedSession } from "@/lib/auth/hooks";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

interface NotifyMeProps {
  productId: string;
}

export function NotifyMe({ productId }: NotifyMeProps) {
  const { user } = useExtendedSession();
  const [email, setEmail] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/product-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setIsSubscribed(true);
    } catch {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Icons.Check className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            You&apos;re on the list!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll notify you at <span className="font-medium text-foreground">{email}</span> when
            this product becomes available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Icons.Clock className="h-6 w-6 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">Coming Soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This product is not yet available for purchase. Enter your email to get
          notified when it launches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        {error && (
          <p className="mb-3 text-center text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Icons.Bell className="h-4 w-4" />
                Notify Me
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
