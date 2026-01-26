"use client";

import { useCallback } from "react";
import { Icons } from "@/components/icons";
import type { SaveInfo } from "@/lib/pokemon/save-detector";

interface SaveDownloadButtonProps {
  saveData: Uint8Array;
  saveInfo: SaveInfo;
  hasChanges: boolean;
}

export function SaveDownloadButton({
  saveData,
  saveInfo,
  hasChanges,
}: SaveDownloadButtonProps) {
  const handleDownload = useCallback(() => {
    // Create blob from save data
    const buffer = new ArrayBuffer(saveData.length);
    new Uint8Array(buffer).set(saveData);
    const blob = new Blob([buffer], { type: "application/octet-stream" });

    // Generate filename
    const cleanName = saveInfo.trainerName.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = hasChanges ? "_edited" : "";
    const filename = `${cleanName}_${saveInfo.gameCode}${timestamp}.sav`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [saveData, saveInfo, hasChanges]);

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Icons.Download className="h-4 w-4" />
      Download Save
    </button>
  );
}
