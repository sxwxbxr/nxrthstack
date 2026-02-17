import type { BattleMap, TileType } from "./types";

// ============================================================================
// Map Templates - 8x8 grids
// ============================================================================
// Legend: G = ground, O = obstacle, C = cover
// Rows 0-1 = defender deploy zone (top)
// Rows 6-7 = attacker deploy zone (bottom)

function parseMap(rows: string[]): TileType[][] {
  return rows.map((row) =>
    row.split("").map((ch): TileType => {
      switch (ch) {
        case "O": return "obstacle";
        case "C": return "cover";
        default: return "ground";
      }
    })
  );
}

export const MAP_OPEN_FIELD: BattleMap = {
  id: "open_field",
  name: "Open Field",
  width: 8,
  height: 8,
  tiles: parseMap([
    "GGGGGGGG",
    "GGGGGGGG",
    "GGCGGCGG",
    "GGGGGGGG",
    "GGGGGGGG",
    "GGCGGCGG",
    "GGGGGGGG",
    "GGGGGGGG",
  ]),
  attackerDeployRows: [6, 7],
  defenderDeployRows: [0, 1],
};

export const MAP_FORTRESS: BattleMap = {
  id: "fortress",
  name: "Fortress",
  width: 8,
  height: 8,
  tiles: parseMap([
    "GGGGGGGG",
    "GCGCCGCG",
    "GGOGGOGG",
    "GGGGGGGG",
    "GGGGGGGG",
    "GGOGGOGG",
    "GCGCCGCG",
    "GGGGGGGG",
  ]),
  attackerDeployRows: [6, 7],
  defenderDeployRows: [0, 1],
};

export const MAP_CORRIDOR: BattleMap = {
  id: "corridor",
  name: "The Corridor",
  width: 8,
  height: 8,
  tiles: parseMap([
    "GGGGGGGG",
    "GGGGGGGG",
    "OGGGGGGO",
    "OGGCGGGO",
    "OGGGCGGO",
    "OGGGGGGO",
    "GGGGGGGG",
    "GGGGGGGG",
  ]),
  attackerDeployRows: [6, 7],
  defenderDeployRows: [0, 1],
};

export const MAP_RUINS: BattleMap = {
  id: "ruins",
  name: "Ancient Ruins",
  width: 8,
  height: 8,
  tiles: parseMap([
    "GGGGGGGG",
    "GGCGGCGG",
    "GCOGGOGG",
    "GGGGOGGG",
    "GGGOGGGG",
    "GGOGGOGG",
    "GGCGGCGG",
    "GGGGGGGG",
  ]),
  attackerDeployRows: [6, 7],
  defenderDeployRows: [0, 1],
};

export const ALL_MAPS: Record<string, BattleMap> = {
  open_field: MAP_OPEN_FIELD,
  fortress: MAP_FORTRESS,
  corridor: MAP_CORRIDOR,
  ruins: MAP_RUINS,
};

export const MAP_LIST = Object.values(ALL_MAPS);

/** Pick a map deterministically from a seed */
export function selectMap(seed: number): BattleMap {
  const index = Math.abs(seed) % MAP_LIST.length;
  return MAP_LIST[index];
}
