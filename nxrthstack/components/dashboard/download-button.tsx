"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface DownloadButtonProps {
  fileId: string;
  fileName: string;
}

export function DownloadButton({ fileId, fileName }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/downloads/${fileId}`);
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        // Open download in new tab
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to start download");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {isLoading ? (
        <Icons.Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icons.Download className="h-4 w-4" />
      )}
      Download
    </button>
  );
}
