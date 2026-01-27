"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

interface SaveUploaderProps {
  onSaveLoaded: (data: Uint8Array, fileName: string) => void;
  isProcessing: boolean;
}

// All common Pokemon save file extensions
const ACCEPTED_EXTENSIONS = [".sav", ".sa1", ".sa2", ".sgm", ".srm", ".dsv", ".sps", ".fla", ".eep"];
const MAX_FILE_SIZE = 512 * 1024; // 512KB max for save files (some saves include extra data)

export function SaveUploader({ onSaveLoaded, isProcessing }: SaveUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Please upload a save file (${ACCEPTED_EXTENSIONS.join(", ")})`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`;
    }

    if (file.size < 1024) {
      return "File too small to be a valid save file";
    }

    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        onSaveLoaded(data, file.name);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to read file"
        );
      }
    },
    [validateFile, onSaveLoaded]
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
          accept={`${ACCEPTED_EXTENSIONS.join(",")},application/octet-stream,*/*`}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {isProcessing ? (
            <>
              <Icons.Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Processing save file...
              </p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Icons.FileUp className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">
                Drop your save file here
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                or click to browse
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[".sav", ".srm", ".sa1", ".sgm"].map((ext) => (
                  <span
                    key={ext}
                    className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {ext}
                  </span>
                ))}
                <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  + more
                </span>
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
        <h3 className="font-medium text-foreground mb-2">Supported Saves</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <strong>Gen 1</strong> - Pokemon Red, Blue, Yellow (32KB .sav)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <strong>Gen 2</strong> - Pokemon Gold, Silver, Crystal (32KB .sav)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <strong>Gen 3</strong> - Pokemon Ruby, Sapphire, Emerald, FireRed, LeafGreen (128KB .sav)
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Save files can be extracted from cartridges using save backup devices or from emulator save folders.
        </p>
      </div>
    </div>
  );
}
