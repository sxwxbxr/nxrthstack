"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import type { RomConfig } from "@/lib/db";

interface ROMUploaderProps {
  onROMLoaded: (data: Uint8Array, fileName: string) => void;
  isProcessing: boolean;
  romConfigs?: RomConfig[];
}

const ACCEPTED_EXTENSIONS = [".gb", ".gbc", ".gba"];
const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB max

export function ROMUploader({ onROMLoaded, isProcessing, romConfigs }: ROMUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Please upload a ROM file (${ACCEPTED_EXTENSIONS.join(", ")})`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    if (file.size < 1024) {
      return "File too small to be a valid ROM";
    }

    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploadProgress(0);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        // Use chunked reading for larger files
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const fileSize = file.size;
        const chunks: Uint8Array[] = [];

        for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const buffer = await chunk.arrayBuffer();
          chunks.push(new Uint8Array(buffer));
          setUploadProgress(Math.round((offset / fileSize) * 100));
        }

        // Combine chunks
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
          combinedArray.set(chunk, position);
          position += chunk.length;
        }

        setUploadProgress(100);
        onROMLoaded(combinedArray, file.name);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to read file"
        );
      }
    },
    [validateFile, onROMLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {isProcessing ? (
            <>
              <Icons.Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Processing ROM...
              </p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Icons.FileUp className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">
                Drop your ROM file here
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                or click to browse
              </p>
              <div className="mt-4 flex gap-2">
                {ACCEPTED_EXTENSIONS.map((ext) => (
                  <span
                    key={ext}
                    className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <Icons.AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Supported formats info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-medium text-foreground mb-2">Supported Formats</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <strong>.gb</strong> - Game Boy (Gen 1)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <strong>.gbc</strong> - Game Boy Color (Gen 1-2)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <strong>.gba</strong> - Game Boy Advance (Gen 3)
          </li>
        </ul>
      </div>
    </div>
  );
}
