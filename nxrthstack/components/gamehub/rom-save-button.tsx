"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import type { ROMInfo } from "@/lib/pokemon/rom-detector";
import type { RomConfig } from "@/lib/db";

interface ROMSaveButtonProps {
  romData: Uint8Array;
  romInfo: ROMInfo;
  romConfigs: RomConfig[];
}

export function ROMSaveButton({
  romData,
  romInfo,
  romConfigs,
}: ROMSaveButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Create a blob from the ROM data
      const extension =
        romInfo.platform === "GBA"
          ? ".gba"
          : romInfo.platform === "GBC"
          ? ".gbc"
          : ".gb";
      // Copy to new ArrayBuffer to satisfy TypeScript
      const buffer = new ArrayBuffer(romData.length);
      new Uint8Array(buffer).set(romData);
      const blob = new Blob([buffer], {
        type: "application/octet-stream",
      });
      const file = new File([blob], `${romInfo.gameName}${extension}`, {
        type: "application/octet-stream",
      });

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("displayName", displayName.trim());
      formData.append("gameCode", romInfo.gameCode);

      // Upload
      const response = await fetch("/api/gamehub/pokemon/roms", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save ROM");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setDisplayName("");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ROM");
    } finally {
      setIsSaving(false);
    }
  }, [romData, romInfo, displayName, router]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <Icons.Upload className="h-4 w-4" />
        Save ROM
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isSaving && setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            {success ? (
              <div className="text-center py-8">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-500/10">
                  <Icons.CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  ROM Saved!
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Your ROM has been saved and can now be accessed from the Saved ROMs tab.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Save ROM
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Icons.Close className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* ROM Info */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Game</p>
                    <p className="font-medium text-foreground">
                      {romInfo.gameName}
                    </p>
                  </div>

                  {/* Display Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., My FireRed ROM"
                      disabled={isSaving}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Give your ROM a memorable name for easy identification
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsOpen(false)}
                      disabled={isSaving}
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !displayName.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Icons.Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Icons.Upload className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
