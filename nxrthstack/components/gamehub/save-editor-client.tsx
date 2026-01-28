"use client";

import { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/icons";

// Use official PKHeX.Web - faster and always up-to-date
const PKHEX_URL = "https://pkhex-web.github.io";

interface GameInfo {
  game: string;
  generation: number;
  trainerName: string;
}

export function SaveEditorClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from the PKHeX app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case "PKHEX_READY":
            setIsLoading(false);
            break;
          case "PKHEX_SAVE_LOADED":
            setGameInfo(event.data.payload);
            break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleIframeLoad = () => {
    // Give the app a moment to initialize
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleIframeError = () => {
    setLoadError(true);
  };

  return (
    <div className="relative">
      {/* Game Info Banner */}
      {gameInfo && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <Icons.Gamepad className="h-5 w-5 text-primary" />
            <div>
              <span className="font-medium">{gameInfo.game}</span>
              <span className="text-muted-foreground">
                {" "}
                - {gameInfo.trainerName}
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                Gen {gameInfo.generation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.Info className="h-4 w-4" />
          <span>All processing happens locally in your browser</span>
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
              <p className="font-medium">Loading Save Editor...</p>
              <p className="text-sm text-muted-foreground">
                First load may take a moment to download WASM files
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
              <p className="font-medium text-lg">Unable to load Save Editor</p>
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
              Open Save Editor in New Tab
            </a>
          </div>
        </div>
      )}

      {/* Save Editor iframe */}
      <div
        className={`relative rounded-xl overflow-hidden border border-border bg-background transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50" : "w-full"
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
          ref={iframeRef}
          src={PKHEX_URL}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="clipboard-read; clipboard-write"
          title="Pokemon Save Editor"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups"
        />
      </div>

      {/* Info card */}
      <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Icons.Sparkles className="h-4 w-4 text-primary" />
          Supported Games
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          This save editor supports all main series Pokemon games:
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
          Powered by{" "}
          <a
            href="https://github.com/kwsch/PKHeX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PKHeX
          </a>{" "}
          by kwsch
        </p>
      </div>
    </div>
  );
}
