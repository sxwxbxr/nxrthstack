"use client";

import { useEffect, useRef } from "react";
import type { SpriteData } from "@/lib/gamehub/tactics/sprites";

interface PixelArtPreviewProps {
  spriteData: SpriteData;
  scale?: number;
  className?: string;
}

export function PixelArtPreview({ spriteData, scale = 4, className }: PixelArtPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = spriteData.length;
    canvas.width = size * scale;
    canvas.height = size * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < spriteData[y].length; x++) {
        const color = spriteData[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }, [spriteData, scale]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
