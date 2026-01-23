"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { upload } from "@vercel/blob/client";
import { Icons } from "@/components/icons";
import type { ProductFile, ProductPrice } from "@/lib/db/schema";

interface FilesManagerProps {
  productId: string;
  files: ProductFile[];
  prices: ProductPrice[];
}

export function FilesManager({ productId, files, prices }: FilesManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    priceId: "" as string | null,
    file: null as File | null,
  });

  const resetForm = () => {
    setFormData({ name: "", priceId: null, file: null });
    setIsAdding(false);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
        name: prev.name || file.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    setIsLoading(true);
    setUploadProgress(5);

    try {
      // Upload directly to Vercel Blob (supports large files up to 500MB)
      const timestamp = Date.now();
      const filename = `${timestamp}-${formData.file.name}`;

      const blob = await upload(filename, formData.file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/token",
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage * 0.9)); // 0-90%
        },
      });

      setUploadProgress(95);

      // Then, create the file record
      await fetch(`/api/admin/products/${productId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          priceId: formData.priceId || null,
          fileKey: blob.url,
          fileSizeBytes: formData.file.size,
          fileType: formData.file.type,
        }),
      });

      setUploadProgress(100);
      router.refresh();
      resetForm();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await fetch(`/api/admin/products/${productId}/files/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getPriceTierName = (priceId: string | null) => {
    if (!priceId) return "All tiers";
    const price = prices.find((p) => p.id === priceId);
    return price?.name || "Unknown tier";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Downloadable Files
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload files that customers can download after purchase
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Icons.Upload className="h-4 w-4" />
            Upload File
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
            <div>
              <label className="block text-sm font-medium text-foreground">
                File
              </label>
              <div className="mt-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  {formData.file ? (
                    <div className="text-center">
                      <Icons.FileText className="mx-auto h-10 w-10 text-primary" />
                      <p className="mt-2 font-medium text-foreground">
                        {formData.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Icons.Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 font-medium text-foreground">
                        Click to upload a file
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Any file type supported
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                  placeholder="e.g., MyApp-v1.0.0.zip"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Available For
                </label>
                <select
                  value={formData.priceId || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priceId: e.target.value || null,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                >
                  <option value="">All pricing tiers</option>
                  {prices.map((price) => (
                    <option key={price.id} value={price.id}>
                      {price.name} only
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="absolute left-0 top-0 h-full bg-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.file}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {isLoading && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
                Upload
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {files.length > 0 ? (
        <div className="mt-6 space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2">
                  <Icons.FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.fileSizeBytes)} • {getPriceTierName(file.priceId)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <Icons.FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              No files uploaded yet
            </p>
          </div>
        )
      )}
    </div>
  );
}
