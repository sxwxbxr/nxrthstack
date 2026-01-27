"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

// Use official PKHeX.Web hosted version - much faster than self-hosting WASM
const PKHEX_URL = "https://pkhex-web.github.io";

export function PKHeXEditorClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

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
            href={PKHEX_URL}
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
      {isLoading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin">
              <Icons.Loader2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Loading PKHeX...</p>
              <p className="text-sm text-muted-foreground">
                First load may take a moment to download WASM files (~20MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <Icons.AlertCircle className="h-12 w-12 text-yellow-500" />
            <div>
              <p className="font-medium text-lg">Unable to load embedded PKHeX</p>
              <p className="text-sm text-muted-foreground mt-1">
                This may be due to browser restrictions on cross-origin iframes.
              </p>
            </div>
            <a
              href={PKHEX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Icons.ExternalLink className="h-4 w-4" />
              Open PKHeX in New Tab
            </a>
          </div>
        </div>
      )}

      {/* PKHeX iframe - loads from official PKHeX.Web */}
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
          src={PKHEX_URL}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => setLoadError(true)}
          allow="clipboard-read; clipboard-write"
          title="PKHeX Save Editor"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups"
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
        <p className="text-xs text-muted-foreground mt-3">
          Powered by <a href="https://github.com/kwsch/PKHeX" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PKHeX</a> by kwsch
        </p>
      </div>
    </div>
  );
}
