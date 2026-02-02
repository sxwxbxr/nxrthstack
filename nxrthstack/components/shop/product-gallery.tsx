"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { ProductImage } from "@/lib/db/schema";

interface ProductGalleryProps {
  images: ProductImage[];
  fallbackImageUrl?: string | null;
  productName: string;
}

export function ProductGallery({
  images,
  fallbackImageUrl,
  productName,
}: ProductGalleryProps) {
  // Find primary image or use first image or fallback
  const primaryImage = images.find((img) => img.isPrimary);
  const initialIndex = primaryImage
    ? images.indexOf(primaryImage)
    : 0;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // If no images but fallback URL exists
  if (images.length === 0 && fallbackImageUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
        <img
          src={fallbackImageUrl}
          alt={productName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // No images at all
  if (images.length === 0) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
        <div className="flex h-full items-center justify-center">
          <Icons.Package className="h-24 w-24 text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage.id}
            src={currentImage.url}
            alt={currentImage.altText || productName}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Navigation Arrows (if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 sm:opacity-100"
              aria-label="Previous image"
            >
              <Icons.ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 sm:opacity-100"
              aria-label="Next image"
            >
              <Icons.ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg bg-muted ring-2 ring-offset-2 ring-offset-background transition-all",
                selectedIndex === index
                  ? "ring-primary"
                  : "ring-transparent hover:ring-muted-foreground/50"
              )}
            >
              <img
                src={image.url}
                alt={image.altText || `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
