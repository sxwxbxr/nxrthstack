import type { Position, TileType } from "./types";

// ============================================================================
// A* Pathfinding on 8x8 Grid
// ============================================================================

interface AStarNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic (Manhattan distance to goal)
  f: number; // g + h
  parent: AStarNode | null;
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

const DIRECTIONS: Position[] = [
  { x: 0, y: -1 }, // up
  { x: 0, y: 1 },  // down
  { x: -1, y: 0 }, // left
  { x: 1, y: 0 },  // right
];

/**
 * Find a path from `from` to `to` on the grid, avoiding obstacles and occupied tiles.
 * Returns the path as an array of positions (excluding `from`, including `to`),
 * or an empty array if no path exists.
 */
export function findPath(
  grid: TileType[][],
  from: Position,
  to: Position,
  occupiedTiles: Set<string>
): Position[] {
  const height = grid.length;
  const width = grid[0].length;

  // Target is an obstacle or out of bounds
  if (
    to.x < 0 || to.x >= width || to.y < 0 || to.y >= height ||
    grid[to.y][to.x] === "obstacle"
  ) {
    return [];
  }

  // Already at target
  if (from.x === to.x && from.y === to.y) {
    return [];
  }

  const open: AStarNode[] = [];
  const closed = new Set<string>();

  const startNode: AStarNode = {
    x: from.x,
    y: from.y,
    g: 0,
    h: manhattanDistance(from, to),
    f: manhattanDistance(from, to),
    parent: null,
  };
  open.push(startNode);

  while (open.length > 0) {
    // Find node with lowest f
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open.splice(bestIdx, 1)[0];
    const key = posKey(current.x, current.y);

    if (closed.has(key)) continue;
    closed.add(key);

    // Reached target
    if (current.x === to.x && current.y === to.y) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node && node.parent) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    // Explore neighbors
    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nKey = posKey(nx, ny);

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (grid[ny][nx] === "obstacle") continue;
      if (closed.has(nKey)) continue;

      // Can't move through occupied tiles (unless it's the target)
      if (occupiedTiles.has(nKey) && !(nx === to.x && ny === to.y)) continue;

      const g = current.g + 1;
      const h = manhattanDistance({ x: nx, y: ny }, to);
      const f = g + h;

      // Check if a better path already exists in open
      const existing = open.find((n) => n.x === nx && n.y === ny);
      if (existing && existing.g <= g) continue;

      open.push({ x: nx, y: ny, g, h, f, parent: current });
    }
  }

  // No path found
  return [];
}

/**
 * Find the next step towards a target (just the first tile in the path).
 * Returns null if no path exists or already at target.
 */
export function findNextStep(
  grid: TileType[][],
  from: Position,
  to: Position,
  occupiedTiles: Set<string>
): Position | null {
  const path = findPath(grid, from, to, occupiedTiles);
  return path.length > 0 ? path[0] : null;
}

/**
 * Get the distance between two positions (Chebyshev / tiles).
 * Used for range checking.
 */
export function tileDistance(a: Position, b: Position): number {
  return manhattanDistance(a, b);
}
