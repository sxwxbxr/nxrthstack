"use client";

import { useCallback } from "react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import type { ROMInfo } from "@/lib/pokemon/rom-detector";

interface ROMDownloadButtonProps {
  romData: Uint8Array;
  romInfo: ROMInfo;
}

export function ROMDownloadButton({
  romData,
  romInfo,
}: ROMDownloadButtonProps) {
  const handleDownload = useCallback(() => {
    // Determine file extension based on platform
    const extensionMap: Record<string, string> = {
      GB: ".gb",
      GBC: ".gbc",
      GBA: ".gba",
    };
    const extension = extensionMap[romInfo.platform] || ".rom";

    // Create filename
    const safeName = romInfo.gameName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_Modified${extension}`;

    // Create blob and download - copy to new ArrayBuffer to satisfy TypeScript
    const buffer = new ArrayBuffer(romData.length);
    new Uint8Array(buffer).set(romData);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  }, [romData, romInfo]);

  return (
    <ShimmerButton onClick={handleDownload} className="px-4 py-2">
      <Icons.Download className="h-4 w-4 mr-2" />
      Download ROM
    </ShimmerButton>
  );
}
