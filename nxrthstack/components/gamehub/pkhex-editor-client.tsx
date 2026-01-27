"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

export function PKHeXEditorClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.Info className="h-4 w-4" />
          <span>
            PKHeX runs entirely in your browser - your save files never leave your device
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            {isFullscreen ? (
              <>
                <Icons.Minimize className="h-4 w-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Icons.Maximize className="h-4 w-4" />
                Fullscreen
              </>
            )}
          </button>
          <a
            href="/pkhex/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Icons.ExternalLink className="h-4 w-4" />
            Open in New Tab
          </a>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin">
              <Icons.Loader2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Loading PKHeX...</p>
              <p className="text-sm text-muted-foreground">
                First load may take a moment to download WASM files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PKHeX iframe */}
      <div
        className={`relative rounded-xl overflow-hidden border border-border bg-background transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-4 z-50"
            : "w-full"
        }`}
        style={{ height: isFullscreen ? "calc(100vh - 32px)" : "800px" }}
      >
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
          >
            <Icons.Close className="h-5 w-5" />
          </button>
        )}
        <iframe
          src="/pkhex/index.html"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write"
          title="PKHeX Save Editor"
        />
      </div>

      {/* Info card */}
      <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Icons.Sparkles className="h-4 w-4 text-primary" />
          About PKHeX
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          PKHeX is a powerful save editor for all main series Pokemon games. It supports:
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <li className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Gen 1-3 (GB/GBA)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Gen 4-5 (DS)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Gen 6-7 (3DS)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Gen 8-9 (Switch)
          </li>
        </ul>
      </div>
    </div>
  );
}
