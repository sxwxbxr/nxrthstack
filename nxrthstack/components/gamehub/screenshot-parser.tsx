"use client";

import { useState, useCallback, useRef } from "react";
import { Icons } from "@/components/icons";
import {
  parseScreenshot,
  preprocessImage,
  type ParsedMatchData,
} from "@/lib/r6/screenshot-parser";

interface ScreenshotParserProps {
  hostName: string;
  opponentName: string;
  onParsed: (data: ParsedMatchData) => void;
  disabled?: boolean;
}

export function ScreenshotParser({
  hostName,
  opponentName,
  onParsed,
  disabled,
}: ScreenshotParserProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedMatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      setError(null);
      setIsProcessing(true);
      setProgress(0);
      setStatus("Preparing...");
      setResult(null);

      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      try {
        // Preprocess image for better OCR
        setStatus("Preprocessing image...");
        const processedFile = await preprocessImage(file);

        // Parse the screenshot
        const parsed = await parseScreenshot(processedFile, (prog, stat) => {
          setProgress(prog);
          setStatus(stat);
        });

        setResult(parsed);
        onParsed(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse screenshot");
      } finally {
        setIsProcessing(false);
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [disabled, isProcessing, processFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isProcessing) {
        setIsDragging(true);
      }
    },
    [disabled, isProcessing]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/10"
            : disabled || isProcessing
            ? "border-border bg-muted/50 cursor-not-allowed"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {isProcessing ? (
          <div className="space-y-3">
            <Icons.Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{status}</p>
            <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Screenshot preview"
              className="max-h-32 mx-auto rounded-lg object-contain"
            />
            <p className="text-sm text-muted-foreground">
              Click or drop to upload a different screenshot
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Icons.Image className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                Upload Scoreboard Screenshot
              </p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <Icons.AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Parsed Results */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Icons.CheckCircle className="h-4 w-4 text-green-500" />
              Parsed Results
            </h4>
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {/* Match Score */}
          {(result.team1Score !== null || result.team2Score !== null) && (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{hostName}</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.team1Score ?? "?"}
                </p>
              </div>
              <span className="text-xl text-muted-foreground">-</span>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{opponentName}</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.team2Score ?? "?"}
                </p>
              </div>
            </div>
          )}

          {/* Winner */}
          {result.winner && (
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-sm text-muted-foreground">Winner</p>
              <p className="font-semibold text-primary">
                {result.winner === "player1" ? hostName : opponentName}
              </p>
            </div>
          )}

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground mb-2">{hostName}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kills</span>
                  <span className="font-medium text-foreground">
                    {result.player1.kills ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deaths</span>
                  <span className="font-medium text-foreground">
                    {result.player1.deaths ?? "-"}
                  </span>
                </div>
                {result.player1.assists !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assists</span>
                    <span className="font-medium text-foreground">
                      {result.player1.assists}
                    </span>
                  </div>
                )}
                {result.player1.score !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium text-foreground">
                      {result.player1.score}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Player 2 */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground mb-2">{opponentName}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kills</span>
                  <span className="font-medium text-foreground">
                    {result.player2.kills ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deaths</span>
                  <span className="font-medium text-foreground">
                    {result.player2.deaths ?? "-"}
                  </span>
                </div>
                {result.player2.assists !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assists</span>
                    <span className="font-medium text-foreground">
                      {result.player2.assists}
                    </span>
                  </div>
                )}
                {result.player2.score !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium text-foreground">
                      {result.player2.score}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confidence & Warnings */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              OCR Confidence: {result.confidence.toFixed(1)}%
              {result.confidence < 70 && (
                <span className="text-yellow-500 ml-2">
                  (Low confidence - please verify)
                </span>
              )}
            </p>
            {result.warnings.length > 0 && (
              <div className="rounded-lg bg-yellow-500/10 p-2 mt-2">
                <p className="font-medium text-yellow-500 flex items-center gap-1">
                  <Icons.AlertCircle className="h-3 w-3" />
                  Warnings
                </p>
                <ul className="list-disc list-inside text-yellow-500/80 mt-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
