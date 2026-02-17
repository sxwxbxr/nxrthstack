"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { useTacticsReplay } from "@/hooks/use-tactics-replay";
import { UNIT_SPRITES, TILE_SPRITES, EFFECT_SPRITES, renderSpriteToCanvas } from "@/lib/gamehub/tactics/sprites";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { ALL_MAPS } from "@/lib/gamehub/tactics/maps";
import type { BattleEvent, Squad, Position } from "@/lib/gamehub/tactics/types";

interface BattleCanvasProps {
  events: BattleEvent[];
  attackerSquad: Squad;
  defenderSquad: Squad;
  mapId: string;
  maxTick: number;
}

const TILE_SIZE = 48;
const SPRITE_SCALE = 3; // 16px * 3 = 48px
const GRID_SIZE = 8;
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;

interface UnitState {
  instanceId: string;
  templateId: string;
  side: "attacker" | "defender";
  position: Position;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

export function BattleCanvas({ events, attackerSquad, defenderSquad, mapId, maxTick }: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replay = useTacticsReplay(events, maxTick);
  const [floatingTexts, setFloatingTexts] = useState<Array<{
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    tick: number;
  }>>([]);
  const floatIdRef = useRef(0);

  // Build initial unit states from squads
  const getInitialUnits = useCallback((): UnitState[] => {
    const units: UnitState[] = [];
    for (const su of attackerSquad.units) {
      const tmpl = ALL_UNITS[su.templateId];
      if (tmpl) {
        units.push({
          instanceId: su.instanceId,
          templateId: su.templateId,
          side: "attacker",
          position: { ...su.position },
          hp: tmpl.maxHp,
          maxHp: tmpl.maxHp,
          isAlive: true,
        });
      }
    }
    for (const su of defenderSquad.units) {
      const tmpl = ALL_UNITS[su.templateId];
      if (tmpl) {
        units.push({
          instanceId: su.instanceId,
          templateId: su.templateId,
          side: "defender",
          position: { ...su.position },
          hp: tmpl.maxHp,
          maxHp: tmpl.maxHp,
          isAlive: true,
        });
      }
    }
    return units;
  }, [attackerSquad, defenderSquad]);

  // Reconstruct unit states from events up to current tick
  const getUnitsAtTick = useCallback((tick: number): UnitState[] => {
    const units = getInitialUnits();
    const unitMap = new Map(units.map((u) => [u.instanceId, u]));

    for (const event of events) {
      if (event.tick > tick) break;

      const unit = event.unitId ? unitMap.get(event.unitId) : null;

      switch (event.type) {
        case "MOVE":
          if (unit && event.toPosition) {
            unit.position = { ...event.toPosition };
          }
          break;
        case "DAMAGE":
          if (unit && event.value) {
            unit.hp = Math.max(0, unit.hp - event.value);
          }
          break;
        case "HEAL":
          if (unit && event.value) {
            unit.hp = Math.min(unit.maxHp, unit.hp + event.value);
          }
          break;
        case "DEATH":
          if (unit) {
            unit.isAlive = false;
          }
          break;
      }
    }

    return units;
  }, [events, getInitialUnits]);

  // Process floating texts for current tick events
  useEffect(() => {
    for (const event of replay.tickEvents) {
      if (event.type === "DAMAGE" && event.unitId && event.value) {
        const units = getUnitsAtTick(replay.currentTick);
        const unit = units.find((u) => u.instanceId === event.unitId);
        if (unit) {
          setFloatingTexts((prev) => [
            ...prev,
            {
              id: ++floatIdRef.current,
              x: unit.position.x * TILE_SIZE + TILE_SIZE / 2,
              y: unit.position.y * TILE_SIZE,
              text: `-${event.value}`,
              color: event.isCrit ? "#FFD700" : "#FF5050",
              tick: replay.currentTick,
            },
          ]);
        }
      }
      if (event.type === "HEAL" && event.unitId && event.value) {
        const units = getUnitsAtTick(replay.currentTick);
        const unit = units.find((u) => u.instanceId === event.unitId);
        if (unit) {
          setFloatingTexts((prev) => [
            ...prev,
            {
              id: ++floatIdRef.current,
              x: unit.position.x * TILE_SIZE + TILE_SIZE / 2,
              y: unit.position.y * TILE_SIZE,
              text: `+${event.value}`,
              color: "#50C878",
              tick: replay.currentTick,
            },
          ]);
        }
      }
    }
    // Remove old floating texts (6 ticks = 1.5 seconds at 4 ticks/sec)
    setFloatingTexts((prev) => prev.filter((ft) => replay.currentTick - ft.tick < 6));
  }, [replay.currentTick, replay.tickEvents, getUnitsAtTick]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const map = ALL_MAPS[mapId] ?? ALL_MAPS.open_field;
    const units = getUnitsAtTick(replay.currentTick);

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tileType = map.tiles[y]?.[x] ?? "ground";
        const spriteData = TILE_SPRITES[tileType];
        if (spriteData) {
          const tileCanvas = renderSpriteToCanvas(spriteData, SPRITE_SCALE);
          ctx.drawImage(tileCanvas, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw units
    for (const unit of units) {
      if (!unit.isAlive) continue;

      const x = unit.position.x * TILE_SIZE;
      const y = unit.position.y * TILE_SIZE;

      // Unit sprite
      const spriteData = UNIT_SPRITES[unit.templateId];
      if (spriteData) {
        const unitCanvas = renderSpriteToCanvas(spriteData, SPRITE_SCALE);
        ctx.drawImage(unitCanvas, x, y, TILE_SIZE, TILE_SIZE);
      } else {
        // Fallback: colored circle
        ctx.fillStyle = unit.side === "attacker" ? "#4A7BB7" : "#B74A4A";
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP bar
      const hpWidth = TILE_SIZE - 8;
      const hpHeight = 4;
      const hpX = x + 4;
      const hpY = y + TILE_SIZE - 8;
      const hpPercent = unit.hp / unit.maxHp;

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(hpX, hpY, hpWidth, hpHeight);

      // Fill
      ctx.fillStyle = hpPercent > 0.5 ? "#50C878" : hpPercent > 0.25 ? "#FFD700" : "#FF5050";
      ctx.fillRect(hpX, hpY, hpWidth * hpPercent, hpHeight);

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.strokeRect(hpX, hpY, hpWidth, hpHeight);

      // Side indicator (small triangle)
      ctx.fillStyle = unit.side === "attacker" ? "#4A7BB7" : "#B74A4A";
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x + 2, y + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Draw floating texts
    for (const ft of floatingTexts) {
      const age = replay.currentTick - ft.tick;
      const alpha = Math.max(0, 1 - age / 6);
      const offsetY = -age * 5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y + offsetY);
      ctx.globalAlpha = 1;
    }
  }, [replay.currentTick, getUnitsAtTick, mapId, floatingTexts]);

  const timeSeconds = (replay.currentTick / 4).toFixed(1);
  const maxTimeSeconds = (maxTick / 4).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="flex justify-center">
        <div className="rounded-lg border border-border overflow-hidden bg-[#1A1A2E]">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        {/* Timeline */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12 text-right">{timeSeconds}s</span>
          <input
            type="range"
            min={0}
            max={maxTick}
            value={replay.currentTick}
            onChange={(e) => replay.seekToTick(parseInt(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-12">{maxTimeSeconds}s</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => replay.seekToTick(0)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Restart"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
            <Icons.ChevronLeft className="h-4 w-4 -ml-2" />
          </button>

          <button
            type="button"
            onClick={replay.togglePlay}
            className="rounded-full bg-primary p-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {replay.isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => replay.seekToTick(maxTick)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Skip to end"
          >
            <Icons.ChevronRight className="h-4 w-4" />
            <Icons.ChevronRight className="h-4 w-4 -ml-2" />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center justify-center gap-2">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => replay.changeSpeed(s)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                replay.speed === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
