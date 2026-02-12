"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Product, ProductImage } from "@/lib/db/schema";

interface ProductFormProps {
  product?: Product & { images?: ProductImage[] };
  mode: "create" | "edit";
}

interface ImageItem {
  id?: string;
  url: string;
  isPrimary: boolean;
  isNew?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    productType: product?.productType ?? "paid",
    availability: product?.availability ?? "available",
  });

  // Image gallery state
  const [images, setImages] = useState<ImageItem[]>([]);

  // Initialize images from product
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setImages(
        product.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
          }))
      );
    } else if (product?.imageUrl) {
      // Legacy: single imageUrl field
      setImages([{ url: product.imageUrl, isPrimary: true }]);
    }
  }, [product]);

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    const maxSize = 10 * 1024 * 1024;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Use PNG, JPEG, GIF, or WebP`);
        continue;
      }
      if (file.size > maxSize) {
        setError(`${file.name}: File too large. Max 10MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setError("");

    // Add placeholder items for uploading files
    const placeholders: ImageItem[] = validFiles.map((file, idx) => ({
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0,
      isNew: true,
      isUploading: true,
      uploadProgress: 0,
    }));

    setImages((prev) => [...prev, ...placeholders]);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const placeholderIndex = images.length + i;

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        // Use XMLHttpRequest for progress tracking
        const uploadedUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setImages((prev) =>
                prev.map((img, idx) =>
                  idx === placeholderIndex
                    ? { ...img, uploadProgress: progress }
                    : img
                )
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.url) {
                  resolve(response.url);
                } else {
                  reject(new Error(response.error || "Upload failed"));
                }
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              try {
                const response = JSON.parse(xhr.responseText);
                reject(new Error(response.error || "Upload failed"));
              } catch {
                reject(new Error("Upload failed"));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", "/api/admin/upload");
          xhr.send(formData);
        });

        // Update with real URL
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === placeholderIndex
              ? { ...img, url: uploadedUrl, isUploading: false }
              : img
          )
        );

        // If editing and product exists, save to server immediately
        if (mode === "edit" && product?.id) {
          const isPrimary = placeholderIndex === 0 && images.length === 0;
          await fetch(`/api/admin/products/${product.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: uploadedUrl, isPrimary }),
          });
          // Refresh to get the image ID
          const res = await fetch(`/api/admin/products/${product.id}/images`);
          const data = await res.json();
          if (data.images) {
            setImages(
              data.images.map((img: ProductImage) => ({
                id: img.id,
                url: img.url,
                isPrimary: img.isPrimary,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
        // Remove failed upload
        setImages((prev) => prev.filter((_, idx) => idx !== placeholderIndex));
        setError("Failed to upload image. Please try again.");
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSetCover = async (index: number) => {
    const image = images[index];

    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );

    // If editing and has image ID, update on server
    if (mode === "edit" && product?.id && image.id) {
      await fetch(`/api/admin/products/${product.id}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: image.id, isPrimary: true }),
      });
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];

    // If editing and has image ID, delete on server
    if (mode === "edit" && product?.id && image.id) {
      await fetch(`/api/admin/products/${product.id}/images/${image.id}`, {
        method: "DELETE",
      });
    }

    const newImages = images.filter((_, idx) => idx !== index);

    // If we removed the primary, make the first one primary
    if (image.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setImages(newImages);
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

      // For backward compatibility, include the primary image URL in imageUrl
      const primaryImage = images.find((img) => img.isPrimary);

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl: primaryImage?.url || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // If creating, save images to the new product
      if (mode === "create" && data.product?.id) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img.isUploading) {
            await fetch(`/api/admin/products/${data.product.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: img.url,
                isPrimary: img.isPrimary,
              }),
            });
          }
        }
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
        </div>
      </div>

      {/* Image Gallery Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Product Images</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload multiple images. The cover image is shown in the shop listing.
        </p>

        <div className="mt-6 space-y-4">
          {/* Image Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={image.id || image.url}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border-2",
                    image.isPrimary
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  {image.isUploading ? (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <div className="text-center">
                        <Icons.Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {image.uploadProgress}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {image.isPrimary && (
                        <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Cover
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(index)}
                            className="rounded-lg bg-white/90 px-2 py-1.5 text-xs font-medium text-gray-900 transition-colors hover:bg-white"
                            title="Set as cover"
                          >
                            <Icons.Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="rounded-lg bg-destructive/90 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-destructive"
                          title="Remove"
                        >
                          <Icons.Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add Image Button */}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-muted/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                />
                <Icons.Plus className="h-8 w-8 text-muted-foreground" />
                <span className="mt-1 text-xs text-muted-foreground">Add</span>
              </label>
            </div>
          )}

          {/* Empty State Upload Area */}
          {images.length === 0 && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                multiple
              />
              <Icons.ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 font-medium text-foreground">
                Click to upload images
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPEG, GIF, or WebP (max 10MB each)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                First image will be the cover
              </p>
            </label>
          )}
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

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Availability
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls how this product is displayed and whether customers can purchase it
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              value: "available",
              label: "Available",
              description: "Can be downloaded or purchased normally",
              icon: Icons.Check,
              color: "text-green-500",
            },
            {
              value: "coming_soon",
              label: "Coming Soon",
              description: "Visible but not yet purchasable. Customers can sign up for notifications",
              icon: Icons.Clock,
              color: "text-amber-500",
            },
            {
              value: "discontinued",
              label: "No Longer Available",
              description: "Can't be bought anymore. Customers are directed to contact you",
              icon: Icons.XCircle,
              color: "text-red-500",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, availability: option.value }))
              }
              className={cn(
                "flex flex-col items-start rounded-lg border p-4 text-left transition-colors",
                formData.availability === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <option.icon
                className={cn(
                  "h-5 w-5",
                  formData.availability === option.value
                    ? option.color
                    : "text-muted-foreground"
                )}
              />
              <p className="mt-3 font-medium text-foreground">{option.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
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
