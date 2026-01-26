"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Icons } from "@/components/icons";
import type { SaveInfo } from "@/lib/pokemon/save-detector";

interface SaveDownloadButtonProps {
  saveData: Uint8Array;
  saveInfo: SaveInfo;
  hasChanges: boolean;
}

type SaveFormat = "sav" | "srm" | "ss" | "state" | "raw";

const SAVE_FORMATS: { id: SaveFormat; label: string; description: string }[] = [
  { id: "sav", label: ".sav", description: "Standard save file (most emulators)" },
  { id: "srm", label: ".srm", description: "RetroArch / SNES9x format" },
  { id: "ss", label: ".ss#", description: "Save state format" },
  { id: "state", label: ".state", description: "BizHawk / Mednafen format" },
  { id: "raw", label: ".bin", description: "Raw binary data" },
];

export function SaveDownloadButton({
  saveData,
  saveInfo,
  hasChanges,
}: SaveDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = useCallback((format: SaveFormat) => {
    // Create blob from save data
    const buffer = new ArrayBuffer(saveData.length);
    new Uint8Array(buffer).set(saveData);
    const blob = new Blob([buffer], { type: "application/octet-stream" });

    // Generate filename
    const cleanName = saveInfo.trainerName.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = hasChanges ? "_edited" : "";

    // Get extension based on format
    let extension: string;
    switch (format) {
      case "sav":
        extension = "sav";
        break;
      case "srm":
        extension = "srm";
        break;
      case "ss":
        extension = "ss1";
        break;
      case "state":
        extension = "state";
        break;
      case "raw":
        extension = "bin";
        break;
      default:
        extension = "sav";
    }

    const filename = `${cleanName}_${saveInfo.gameCode}${timestamp}.${extension}`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsOpen(false);
  }, [saveData, saveInfo, hasChanges]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Main download button */}
        <button
          onClick={() => handleDownload("sav")}
          className="inline-flex items-center gap-2 rounded-l-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icons.Download className="h-4 w-4" />
          Download
        </button>

        {/* Dropdown toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center rounded-r-lg border-l border-primary-foreground/20 bg-primary px-2 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icons.ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Download Format
            </p>
            {SAVE_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => handleDownload(format.id)}
                className="w-full flex items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-mono text-primary shrink-0">
                  {format.label}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">{format.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{format.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <p className="text-xs text-muted-foreground">
              <Icons.Info className="inline h-3 w-3 mr-1" />
              All formats contain the same save data, only the extension changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
