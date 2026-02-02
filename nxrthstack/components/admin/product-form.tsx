"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { upload } from "@vercel/blob/client";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image file (PNG, JPEG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const timestamp = Date.now();
      const filename = `products/${timestamp}-${file.name}`;

      const blob = await upload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/token",
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      setFormData((prev) => ({ ...prev, imageUrl: blob.url }));
    } catch (err) {
      console.error("Failed to upload image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              Product Image
            </label>
            <div className="mt-2 space-y-3">
              {/* Image Preview / Upload Area */}
              {formData.imageUrl ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img
                    src={formData.imageUrl}
                    alt="Product preview"
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <label className="cursor-pointer rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-white">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      Replace
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg bg-destructive/90 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="text-center">
                      <Icons.Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                      <p className="mt-2 font-medium text-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Icons.ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 font-medium text-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPEG, GIF, or WebP (max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="absolute left-0 top-0 h-full bg-primary"
                  />
                </div>
              )}

              {/* URL Fallback Input */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or enter URL</span>
                </div>
              </div>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="https://example.com/image.png"
              />
            </div>
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
