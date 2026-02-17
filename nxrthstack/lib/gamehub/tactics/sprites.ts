// ============================================================================
// Pixel Art Sprite Data - 16x16 sprites defined as color arrays
// Each sprite is a 16x16 grid of hex color strings (or "" for transparent)
// These are rendered into Canvas at runtime for PixiJS textures
// ============================================================================

export type SpriteData = (string | "")[][];

// Color palettes per class
const TANK_COLORS = { primary: "#4A7BB7", secondary: "#2D5F8A", accent: "#8BBCE0", skin: "#F4C89A", dark: "#1A3A5C" };
const RANGER_COLORS = { primary: "#4A8C5E", secondary: "#2D6B3F", accent: "#8CD4A2", skin: "#F4C89A", dark: "#1A4A28" };
const HEALER_COLORS = { primary: "#C4A84A", secondary: "#A08B30", accent: "#F0E08A", skin: "#F4C89A", dark: "#6B5A1A" };
const ASSASSIN_COLORS = { primary: "#7B4A8C", secondary: "#5C2D6B", accent: "#B88CD4", skin: "#F4C89A", dark: "#3A1A4A" };

// Shared colors
const C = {
  T: "", // transparent
  BLK: "#1A1A2E",
  WHT: "#F0F0F0",
  GREY: "#888888",
  RED: "#E05050",
  GREEN: "#50C878",
  GOLD: "#FFD700",
};

// Helper: fill a 16x16 array
function sprite16(fn: (x: number, y: number) => string): SpriteData {
  const rows: SpriteData = [];
  for (let y = 0; y < 16; y++) {
    const row: string[] = [];
    for (let x = 0; x < 16; x++) {
      row.push(fn(x, y));
    }
    rows.push(row);
  }
  return rows;
}

// ============================================================================
// Unit Sprites
// ============================================================================

export const SPRITE_KNIGHT: SpriteData = sprite16((x, y) => {
  const p = TANK_COLORS;
  // Helmet (rows 1-4)
  if (y === 1 && x >= 5 && x <= 10) return p.secondary;
  if (y === 2 && x >= 4 && x <= 11) return p.primary;
  if (y === 3 && x >= 4 && x <= 11) return p.primary;
  if (y === 3 && (x === 5 || x === 10)) return p.accent; // visor
  // Face (row 4-5)
  if (y === 4 && x >= 5 && x <= 10) return p.skin;
  if (y === 4 && (x === 6 || x === 9)) return C.BLK; // eyes
  if (y === 5 && x >= 6 && x <= 9) return p.skin;
  // Shoulders + armor (rows 6-8)
  if (y === 6 && x >= 3 && x <= 12) return p.primary;
  if (y === 7 && x >= 3 && x <= 12) return p.secondary;
  if (y === 7 && x >= 6 && x <= 9) return p.accent; // chest emblem
  if (y === 8 && x >= 4 && x <= 11) return p.secondary;
  // Shield (left arm rows 6-10)
  if (y >= 6 && y <= 10 && x >= 1 && x <= 3) return p.accent;
  if (y >= 7 && y <= 9 && x === 2) return p.primary;
  // Sword (right arm)
  if (y >= 4 && y <= 6 && x === 13) return C.GREY; // blade
  if (y >= 7 && y <= 8 && x === 13) return "#8B6914"; // hilt
  // Body (rows 9-11)
  if (y === 9 && x >= 5 && x <= 10) return p.secondary;
  if (y === 10 && x >= 5 && x <= 10) return p.primary;
  if (y === 11 && x >= 5 && x <= 10) return p.dark;
  // Legs (rows 12-14)
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 14 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  return C.T;
});

export const SPRITE_GUARDIAN: SpriteData = sprite16((x, y) => {
  const p = TANK_COLORS;
  // Large shield body
  if (y === 1 && x >= 5 && x <= 10) return p.accent;
  if (y === 2 && x >= 4 && x <= 11) return p.primary;
  if (y === 3 && x >= 4 && x <= 11) return p.primary;
  if (y === 3 && (x === 6 || x === 9)) return C.BLK;
  if (y === 4 && x >= 5 && x <= 10) return p.skin;
  if (y === 5 && x >= 6 && x <= 9) return p.skin;
  // Heavy armor
  if (y === 6 && x >= 2 && x <= 13) return p.primary;
  if (y === 7 && x >= 2 && x <= 13) return p.secondary;
  if (y === 8 && x >= 3 && x <= 12) return p.secondary;
  if (y === 7 && x >= 6 && x <= 9) return C.GOLD; // emblem
  if (y === 9 && x >= 4 && x <= 11) return p.primary;
  if (y === 10 && x >= 5 && x <= 10) return p.secondary;
  if (y === 11 && x >= 5 && x <= 10) return p.dark;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 14 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  return C.T;
});

export const SPRITE_ARCHER: SpriteData = sprite16((x, y) => {
  const p = RANGER_COLORS;
  // Hood
  if (y === 1 && x >= 5 && x <= 10) return p.primary;
  if (y === 2 && x >= 4 && x <= 11) return p.primary;
  if (y === 2 && x >= 6 && x <= 9) return p.secondary;
  if (y === 3 && x >= 5 && x <= 10) return p.skin;
  if (y === 3 && (x === 6 || x === 9)) return C.BLK;
  if (y === 4 && x >= 6 && x <= 9) return p.skin;
  // Cape
  if (y >= 5 && y <= 9 && (x === 3 || x === 12)) return p.accent;
  // Tunic
  if (y === 5 && x >= 5 && x <= 10) return p.primary;
  if (y === 6 && x >= 4 && x <= 11) return p.primary;
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 8 && x >= 5 && x <= 10) return p.secondary;
  // Bow (right side)
  if (y >= 3 && y <= 11 && x === 14) return "#8B6914";
  if ((y === 3 || y === 11) && x === 13) return "#8B6914";
  if (y >= 4 && y <= 10 && x === 13) return C.GREY; // bowstring
  // Quiver (left)
  if (y >= 5 && y <= 8 && x === 2) return "#8B6914";
  // Legs
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#6B4A2E";
  return C.T;
});

export const SPRITE_SNIPER: SpriteData = sprite16((x, y) => {
  const p = RANGER_COLORS;
  // Hat
  if (y === 0 && x >= 5 && x <= 10) return p.dark;
  if (y === 1 && x >= 4 && x <= 11) return p.secondary;
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK;
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  // Cloak
  if (y >= 4 && y <= 6 && x >= 3 && x <= 12) return p.primary;
  if (y === 5 && x >= 6 && x <= 9) return p.accent;
  // Long rifle
  if (y >= 2 && y <= 10 && x === 14) return C.GREY;
  if (y === 2 && x === 13) return "#555";
  // Body
  if (y === 7 && x >= 5 && x <= 10) return p.secondary;
  if (y === 8 && x >= 5 && x <= 10) return p.secondary;
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  return C.T;
});

export const SPRITE_CLERIC: SpriteData = sprite16((x, y) => {
  const p = HEALER_COLORS;
  // Halo
  if (y === 0 && (x === 6 || x === 9)) return C.GOLD;
  if (y === 0 && x >= 7 && x <= 8) return C.GOLD;
  // Head
  if (y === 1 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK;
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  // Robes
  if (y === 4 && x >= 4 && x <= 11) return p.primary;
  if (y === 5 && x >= 3 && x <= 12) return p.primary;
  if (y === 6 && x >= 3 && x <= 12) return p.secondary;
  if (y === 6 && (x === 7 || x === 8)) return C.WHT; // cross
  if (y === 7 && x >= 4 && x <= 11) return p.primary;
  if (y === 7 && (x === 7 || x === 8)) return C.WHT; // cross
  if (y === 8 && x >= 4 && x <= 11) return p.secondary;
  // Staff (right hand)
  if (y >= 1 && y <= 12 && x === 13) return "#8B6914";
  if (y === 0 && x === 13) return p.accent; // crystal
  // Lower robes
  if (y === 9 && x >= 4 && x <= 11) return p.primary;
  if (y === 10 && x >= 4 && x <= 11) return p.primary;
  if (y === 11 && x >= 5 && x <= 10) return p.secondary;
  if (y === 12 && x >= 5 && x <= 10) return p.dark;
  if (y === 13 && x >= 6 && x <= 9) return p.dark;
  return C.T;
});

export const SPRITE_DRUID: SpriteData = sprite16((x, y) => {
  const p = HEALER_COLORS;
  // Leaf crown
  if (y === 0 && (x === 5 || x === 7 || x === 9 || x === 10)) return "#4A8C5E";
  if (y === 1 && x >= 5 && x <= 10) return "#4A8C5E";
  // Face
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK;
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  // Nature robes
  if (y === 4 && x >= 4 && x <= 11) return "#4A8C5E";
  if (y === 5 && x >= 3 && x <= 12) return "#4A8C5E";
  if (y === 6 && x >= 3 && x <= 12) return p.primary;
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 8 && x >= 4 && x <= 11) return p.primary;
  // Staff with vines
  if (y >= 1 && y <= 11 && x === 2) return "#6B4A2E";
  if (y === 0 && x === 2) return "#50C878"; // leaf top
  if ((y === 3 || y === 6 || y === 9) && x === 1) return "#4A8C5E"; // vines
  // Lower robes
  if (y === 9 && x >= 4 && x <= 11) return p.secondary;
  if (y === 10 && x >= 5 && x <= 10) return "#4A8C5E";
  if (y === 11 && x >= 5 && x <= 10) return "#2D6B3F";
  if (y === 12 && x >= 6 && x <= 9) return p.dark;
  return C.T;
});

export const SPRITE_SHADOW: SpriteData = sprite16((x, y) => {
  const p = ASSASSIN_COLORS;
  // Hood (deep)
  if (y === 1 && x >= 5 && x <= 10) return p.dark;
  if (y === 2 && x >= 4 && x <= 11) return p.dark;
  if (y === 3 && x >= 5 && x <= 10) return p.secondary;
  if (y === 3 && (x === 6 || x === 9)) return C.RED; // glowing eyes
  if (y === 4 && x >= 6 && x <= 9) return p.dark;
  // Cloak
  if (y === 5 && x >= 3 && x <= 12) return p.secondary;
  if (y === 6 && x >= 2 && x <= 13) return p.primary;
  if (y === 7 && x >= 2 && x <= 13) return p.secondary;
  if (y === 8 && x >= 3 && x <= 12) return p.dark;
  // Daggers (both hands)
  if (y >= 5 && y <= 8 && x === 1) return C.GREY;
  if (y === 4 && x === 1) return C.WHT; // dagger tip
  if (y >= 5 && y <= 8 && x === 14) return C.GREY;
  if (y === 4 && x === 14) return C.WHT;
  // Body fade into shadow
  if (y === 9 && x >= 4 && x <= 11) return p.dark;
  if (y === 10 && x >= 5 && x <= 10) return p.secondary;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 13 && ((x >= 6 && x <= 7) || (x >= 8 && x <= 9))) return p.dark;
  return C.T;
});

export const SPRITE_ROGUE: SpriteData = sprite16((x, y) => {
  const p = ASSASSIN_COLORS;
  // Bandana
  if (y === 1 && x >= 5 && x <= 10) return p.primary;
  if (y === 2 && x >= 4 && x <= 11) return p.primary;
  if (y === 2 && x === 12) return p.accent; // bandana tail
  // Face (masked)
  if (y === 3 && x >= 5 && x <= 10) return p.skin;
  if (y === 3 && (x === 6 || x === 9)) return C.BLK;
  if (y === 4 && x >= 5 && x <= 10) return p.dark; // mask
  // Leather armor
  if (y === 5 && x >= 4 && x <= 11) return p.secondary;
  if (y === 6 && x >= 4 && x <= 11) return p.primary;
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 8 && x >= 5 && x <= 10) return p.primary;
  // Dagger + vial
  if (y >= 5 && y <= 8 && x === 14) return C.GREY;
  if (y === 4 && x === 14) return C.WHT;
  if (y >= 5 && y <= 7 && x === 1) return "#50C878"; // poison vial
  // Legs
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#4A3A2E";
  return C.T;
});

// ============================================================================
// Tile Sprites
// ============================================================================

export const SPRITE_TILE_GROUND: SpriteData = sprite16((x, y) => {
  // Simple grass/ground tile with subtle variation
  const base = (x + y) % 3 === 0 ? "#3A4A3A" : (x + y) % 5 === 0 ? "#2E3E2E" : "#334433";
  return base;
});

export const SPRITE_TILE_OBSTACLE: SpriteData = sprite16((x, y) => {
  // Rock/wall tile
  if (y <= 1 || y >= 14 || x <= 1 || x >= 14) return "#555566";
  if ((x + y) % 4 === 0) return "#666677";
  return "#4A4A5A";
});

export const SPRITE_TILE_COVER: SpriteData = sprite16((x, y) => {
  // Wooden crate / cover
  if (y === 0 || y === 15 || x === 0 || x === 15) return "#5A4020";
  if (y === 1 || y === 14) return "#7A5A30";
  if (x === 1 || x === 14) return "#7A5A30";
  if (y === 7 || y === 8) return "#5A4020"; // cross plank
  if (x === 7 || x === 8) return "#5A4020";
  return "#8B6914";
});

// ============================================================================
// Effect Sprites (smaller visual indicators)
// ============================================================================

export const SPRITE_EFFECT_HIT: SpriteData = sprite16((x, y) => {
  const cx = 7.5, cy = 7.5;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist < 2) return "#FFFFFF";
  if (dist < 4) return "#FFE040";
  if (dist < 6) return "#FF8020";
  return C.T;
});

export const SPRITE_EFFECT_HEAL: SpriteData = sprite16((x, y) => {
  const cx = 7.5, cy = 7.5;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist < 2) return "#FFFFFF";
  if (dist < 4) return "#80FF80";
  if (dist < 6) return "#40C840";
  return C.T;
});

export const SPRITE_EFFECT_BUFF: SpriteData = sprite16((x, y) => {
  const cx = 7.5, cy = 7.5;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist < 2) return "#FFFFFF";
  if (dist < 4) return "#80CCFF";
  if (dist < 6) return "#4088FF";
  return C.T;
});

// ============================================================================
// Sprite Registry
// ============================================================================

export const UNIT_SPRITES: Record<string, SpriteData> = {
  knight: SPRITE_KNIGHT,
  guardian: SPRITE_GUARDIAN,
  archer: SPRITE_ARCHER,
  sniper: SPRITE_SNIPER,
  cleric: SPRITE_CLERIC,
  druid: SPRITE_DRUID,
  shadow: SPRITE_SHADOW,
  rogue: SPRITE_ROGUE,
};

export const TILE_SPRITES: Record<string, SpriteData> = {
  ground: SPRITE_TILE_GROUND,
  obstacle: SPRITE_TILE_OBSTACLE,
  cover: SPRITE_TILE_COVER,
};

export const EFFECT_SPRITES: Record<string, SpriteData> = {
  hit: SPRITE_EFFECT_HIT,
  heal: SPRITE_EFFECT_HEAL,
  buff: SPRITE_EFFECT_BUFF,
};

/**
 * Render a SpriteData into a canvas and return the canvas.
 * This can be used to create PixiJS textures from sprite data.
 */
export function renderSpriteToCanvas(
  spriteData: SpriteData,
  scale: number = 1
): HTMLCanvasElement {
  const size = spriteData.length;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d")!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < spriteData[y].length; x++) {
      const color = spriteData[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas;
}
