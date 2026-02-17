"use client";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { SquadUnit, TileType } from "@/lib/gamehub/tactics/types";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { MAP_OPEN_FIELD } from "@/lib/gamehub/tactics/maps";

interface FormationEditorProps {
  units: SquadUnit[];
  squadType: "attack" | "defense";
  selectedUnitIndex: number | null;
  onPlaceUnit: (unitIndex: number, x: number, y: number) => void;
  onSelectUnit: (unitIndex: number | null) => void;
}

const GRID_SIZE = 8;
const ATTACKER_ROWS = [6, 7];
const DEFENDER_ROWS = [0, 1];

const TILE_STYLES: Record<TileType, string> = {
  ground: "bg-[#334433]",
  obstacle: "bg-[#4A4A5A]",
  cover: "bg-[#8B6914]/40 border-[#8B6914]/60",
};

const CLASS_COLORS: Record<string, string> = {
  Tank: "bg-blue-500 text-white",
  Ranger: "bg-green-500 text-white",
  Healer: "bg-yellow-500 text-black",
  Assassin: "bg-purple-500 text-white",
};

export function FormationEditor({
  units,
  squadType,
  selectedUnitIndex,
  onPlaceUnit,
  onSelectUnit,
}: FormationEditorProps) {
  const deployRows = squadType === "attack" ? ATTACKER_ROWS : DEFENDER_ROWS;
  const map = MAP_OPEN_FIELD; // Use default map for formation editing

  // Build unit position lookup
  const unitPositions = new Map<string, number>();
  units.forEach((u, i) => {
    unitPositions.set(`${u.position.x},${u.position.y}`, i);
  });

  function handleCellClick(x: number, y: number) {
    const posKey = `${x},${y}`;
    const existingUnitIndex = unitPositions.get(posKey);

    if (existingUnitIndex !== undefined) {
      // Clicked on an existing unit → select it
      onSelectUnit(existingUnitIndex);
      return;
    }

    // Clicked on empty cell → place selected unit here
    if (selectedUnitIndex !== null && deployRows.includes(y) && map.tiles[y][x] !== "obstacle") {
      onPlaceUnit(selectedUnitIndex, x, y);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Formation ({squadType === "attack" ? "Bottom 2 rows" : "Top 2 rows"})
        </p>
        {selectedUnitIndex !== null && (
          <p className="text-xs text-primary">
            Click a highlighted cell to place {ALL_UNITS[units[selectedUnitIndex]?.templateId]?.name}
          </p>
        )}
      </div>

      <div className="inline-block rounded-lg border border-border bg-background p-1">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {Array.from({ length: GRID_SIZE }, (_, y) =>
            Array.from({ length: GRID_SIZE }, (_, x) => {
              const tileType = map.tiles[y]?.[x] ?? "ground";
              const posKey = `${x},${y}`;
              const unitIndex = unitPositions.get(posKey);
              const isDeployZone = deployRows.includes(y);
              const isObstacle = tileType === "obstacle";
              const isSelectable = isDeployZone && !isObstacle && selectedUnitIndex !== null;
              const hasUnit = unitIndex !== undefined;
              const isSelected = unitIndex !== undefined && unitIndex === selectedUnitIndex;

              return (
                <button
                  key={posKey}
                  type="button"
                  onClick={() => handleCellClick(x, y)}
                  disabled={isObstacle && !hasUnit}
                  className={cn(
                    "relative h-10 w-10 md:h-12 md:w-12 rounded-sm border border-border/30 flex items-center justify-center text-xs font-bold transition-all",
                    TILE_STYLES[tileType],
                    isDeployZone && !isObstacle && "border-primary/30",
                    isSelectable && "cursor-pointer hover:border-primary hover:brightness-125",
                    !isDeployZone && !hasUnit && "opacity-60",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  {hasUnit && units[unitIndex] && (
                    <div
                      className={cn(
                        "h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md",
                        CLASS_COLORS[ALL_UNITS[units[unitIndex].templateId]?.class ?? ""]
                      )}
                      title={ALL_UNITS[units[unitIndex].templateId]?.name}
                    >
                      {ALL_UNITS[units[unitIndex].templateId]?.name.charAt(0)}
                    </div>
                  )}
                  {isDeployZone && !hasUnit && !isObstacle && selectedUnitIndex !== null && (
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-dashed border-primary/40" />
                  )}
                  {tileType === "cover" && !hasUnit && (
                    <Icons.Shield className="h-3 w-3 text-yellow-600/50 absolute bottom-0.5 right-0.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#334433] border border-border/30" /> Ground
        </span>
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#4A4A5A] border border-border/30" /> Obstacle
        </span>
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#8B6914]/40 border border-[#8B6914]/60" /> Cover (-25% ranged dmg)
        </span>
      </div>
    </div>
  );
}
