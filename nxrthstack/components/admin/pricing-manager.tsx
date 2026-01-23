"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { ProductPrice } from "@/lib/db/schema";

interface PricingManagerProps {
  productId: string;
  prices: ProductPrice[];
  productType: string;
}

export function PricingManager({
  productId,
  prices,
  productType,
}: PricingManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    priceCents: 0,
    billingPeriod: productType === "subscription" ? "monthly" : null,
    billingIntervalCount: 1,
    features: [] as string[],
  });

  const [newFeature, setNewFeature] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      priceCents: 0,
      billingPeriod: productType === "subscription" ? "monthly" : null,
      billingIntervalCount: 1,
      features: [],
    });
    setNewFeature("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId
        ? `/api/admin/products/${productId}/prices/${editingId}`
        : `/api/admin/products/${productId}/prices`;

      await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      router.refresh();
      resetForm();
    } catch (error) {
      console.error("Failed to save pricing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (price: ProductPrice) => {
    setFormData({
      name: price.name,
      priceCents: price.priceCents,
      billingPeriod: price.billingPeriod,
      billingIntervalCount: price.billingIntervalCount ?? 1,
      features: (price.features as string[]) || [],
    });
    setEditingId(price.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing tier?")) return;

    try {
      await fetch(`/api/admin/products/${productId}/prices/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete pricing:", error);
    }
  };

  const isFreeProduct = productType === "free";
  const hasFreeTier = isFreeProduct && prices.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {isFreeProduct ? "Features" : "Pricing Tiers"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFreeProduct
              ? "Add features to display on the product page"
              : productType === "subscription"
              ? "Set up subscription pricing tiers"
              : "Configure one-time purchase pricing"}
          </p>
        </div>
        {!isAdding && !hasFreeTier && (
          <button
            onClick={() => {
              if (isFreeProduct) {
                setFormData((prev) => ({ ...prev, name: "Free", priceCents: 0 }));
              }
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Icons.Plus className="h-4 w-4" />
            {isFreeProduct ? "Add Features" : "Add Tier"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 border-t border-border pt-6"
          >
            {!isFreeProduct && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    placeholder="e.g., Basic, Pro, Enterprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Price (USD)
                  </label>
                  <div className="mt-2 flex items-center">
                    <span className="rounded-l-lg border border-r-0 border-input bg-muted px-3 py-2.5 text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(formData.priceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priceCents: Math.round(parseFloat(e.target.value || "0") * 100),
                        }))
                      }
                      required
                      className="w-full rounded-r-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {productType === "subscription" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Billing Period
                  </label>
                  <select
                    value={formData.billingPeriod || "monthly"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        billingPeriod: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.billingPeriod === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Interval (months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.billingIntervalCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          billingIntervalCount: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground">
                Features
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="rounded-lg bg-muted px-4 py-2.5 text-foreground hover:bg-muted/80"
                >
                  Add
                </button>
              </div>
              {formData.features.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {formData.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <Icons.Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Icons.Close className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {isLoading && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? (isFreeProduct ? "Update Features" : "Update Tier") : (isFreeProduct ? "Save Features" : "Add Tier")}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {prices.length > 0 && (
        <div className="mt-6 space-y-3">
          {prices.map((price) => (
            <div
              key={price.id}
              className={cn(
                "rounded-lg border p-4",
                price.isActive ? "border-border" : "border-border/50 opacity-60"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  {!isFreeProduct && (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{price.name}</p>
                        {!price.isActive && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${(price.priceCents / 100).toFixed(2)}
                        {price.billingPeriod && ` / ${price.billingPeriod}`}
                      </p>
                    </>
                  )}
                  {!isFreeProduct && ((price.features as string[]) || []).length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {((price.features as string[]) || []).length} features
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(price)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Icons.Pencil className="h-4 w-4" />
                  </button>
                  {!isFreeProduct && (
                    <button
                      onClick={() => handleDelete(price.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {isFreeProduct && ((price.features as string[]) || []).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {((price.features as string[]) || []).map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Icons.Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
