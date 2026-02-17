import type { Position, TileType } from "./types";

// ============================================================================
// Line of Sight - Bresenham's Line Algorithm
// ============================================================================

/**
 * Check if there's a clear line of sight between two positions.
 * Obstacles block LOS; cover tiles do NOT block LOS.
 */
export function hasLineOfSight(
  grid: TileType[][],
  from: Position,
  to: Position
): boolean {
  // Same tile = always visible
  if (from.x === to.x && from.y === to.y) return true;

  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // Check if current tile is an obstacle (skip start and end positions)
    if (!(x0 === from.x && y0 === from.y) && !(x0 === x1 && y0 === y1)) {
      if (
        y0 >= 0 && y0 < grid.length &&
        x0 >= 0 && x0 < grid[0].length &&
        grid[y0][x0] === "obstacle"
      ) {
        return false;
      }
    }

    // Reached target
    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return true;
}

/**
 * Check if target is on a cover tile (for ranged damage reduction).
 */
export function isOnCover(grid: TileType[][], pos: Position): boolean {
  if (pos.y < 0 || pos.y >= grid.length || pos.x < 0 || pos.x >= grid[0].length) {
    return false;
  }
  return grid[pos.y][pos.x] === "cover";
}
