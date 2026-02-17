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
const MAGE_COLORS = { primary: "#5A3A8C", secondary: "#3D2266", accent: "#9B6FD4", skin: "#F4C89A", dark: "#2A1450" };
const PALADIN_COLORS = { primary: "#C4A84A", secondary: "#8B7A30", accent: "#FFE680", skin: "#F4C89A", dark: "#5A4A10" };
const BERSERKER_COLORS = { primary: "#B74A4A", secondary: "#8C2D2D", accent: "#E08080", skin: "#D4A87B", dark: "#5C1A1A" };

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

// --- Warden (Tank) - Massive tower shield, full plate, visored helm ---
export const SPRITE_WARDEN: SpriteData = sprite16((x, y) => {
  const p = TANK_COLORS;
  // Helmet with visor
  if (y === 0 && x >= 6 && x <= 9) return p.secondary;
  if (y === 1 && x >= 4 && x <= 11) return p.primary;
  if (y === 1 && (x === 5 || x === 10)) return p.accent;
  if (y === 2 && x >= 4 && x <= 11) return p.secondary;
  if (y === 2 && x >= 6 && x <= 9) return p.dark; // visor slit
  if (y === 3 && x >= 5 && x <= 10) return p.primary;
  if (y === 3 && (x === 6 || x === 9)) return p.accent; // visor glow
  // Massive pauldrons
  if (y === 4 && x >= 2 && x <= 13) return p.primary;
  if (y === 5 && x >= 2 && x <= 13) return p.secondary;
  if (y === 5 && (x === 3 || x === 12)) return p.accent;
  // Torso (heavy plate)
  if (y === 6 && x >= 4 && x <= 11) return p.primary;
  if (y === 6 && (x === 7 || x === 8)) return C.GOLD; // emblem
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 7 && (x === 7 || x === 8)) return C.GOLD;
  if (y === 8 && x >= 4 && x <= 11) return p.primary;
  // Tower shield (left side, huge)
  if (y >= 3 && y <= 12 && x >= 0 && x <= 3) return p.accent;
  if (y >= 4 && y <= 11 && x === 1) return p.primary;
  if (y >= 4 && y <= 11 && x === 2) return p.secondary;
  if (y === 7 && x >= 0 && x <= 3) return C.GOLD; // shield cross
  // Belt
  if (y === 9 && x >= 5 && x <= 10) return "#8B6914";
  // Legs (armored)
  if (y === 10 && x >= 5 && x <= 10) return p.secondary;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  if (y === 14 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary; // boots
  return C.T;
});

// --- Crossbowman (Ranger) - Crossbow, bolts, medium leather armor ---
export const SPRITE_CROSSBOWMAN: SpriteData = sprite16((x, y) => {
  const p = RANGER_COLORS;
  // Leather cap
  if (y === 1 && x >= 5 && x <= 10) return p.secondary;
  if (y === 2 && x >= 4 && x <= 11) return p.primary;
  if (y === 2 && x >= 6 && x <= 9) return "#6B4A2E";
  // Face
  if (y === 3 && x >= 5 && x <= 10) return p.skin;
  if (y === 3 && (x === 6 || x === 9)) return C.BLK;
  if (y === 4 && x >= 6 && x <= 9) return p.skin;
  // Padded armor
  if (y === 5 && x >= 4 && x <= 11) return "#6B4A2E";
  if (y === 6 && x >= 4 && x <= 11) return p.secondary;
  if (y === 6 && (x === 7 || x === 8)) return p.accent; // buckle
  if (y === 7 && x >= 4 && x <= 11) return "#6B4A2E";
  if (y === 8 && x >= 5 && x <= 10) return p.secondary;
  // Crossbow (right side, horizontal)
  if (y === 6 && x >= 12 && x <= 15) return "#5A4020"; // stock
  if (y === 5 && x >= 13 && x <= 15) return C.GREY; // bow arm top
  if (y === 7 && x >= 13 && x <= 15) return C.GREY; // bow arm bottom
  if (y === 5 && x === 14) return "#8B6914"; // string
  if (y === 7 && x === 14) return "#8B6914";
  // Bolt quiver (back/left)
  if (y >= 4 && y <= 8 && x === 2) return "#5A4020";
  if (y === 3 && x === 2) return C.GREY; // bolt tips
  if (y === 3 && x === 3) return C.GREY;
  // Legs
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#6B4A2E";
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.dark;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#5A4020"; // boots
  return C.T;
});

// --- Shaman (Healer) - Tribal robes, feathered headdress, totem staff ---
export const SPRITE_SHAMAN: SpriteData = sprite16((x, y) => {
  const p = HEALER_COLORS;
  // Feathered headdress
  if (y === 0 && (x === 4 || x === 7 || x === 10)) return "#E05050"; // red feathers
  if (y === 0 && (x === 5 || x === 9)) return "#4A8C5E"; // green feathers
  if (y === 0 && (x === 6 || x === 8)) return "#4A7BB7"; // blue feathers
  if (y === 1 && x >= 4 && x <= 11) return p.secondary;
  // Face with war paint
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK;
  if (y === 2 && (x === 5 || x === 10)) return "#4A7BB7"; // paint stripes
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  if (y === 3 && x === 7) return "#E05050"; // nose paint
  // Tribal robes with patterns
  if (y === 4 && x >= 4 && x <= 11) return p.primary;
  if (y === 5 && x >= 3 && x <= 12) return p.secondary;
  if (y === 5 && (x === 5 || x === 7 || x === 9 || x === 11)) return "#E05050"; // zigzag
  if (y === 6 && x >= 3 && x <= 12) return p.primary;
  if (y === 6 && (x === 4 || x === 6 || x === 8 || x === 10)) return "#4A7BB7"; // zigzag
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 8 && x >= 4 && x <= 11) return p.primary;
  // Totem staff (left hand)
  if (y >= 0 && y <= 12 && x === 1) return "#6B4A2E";
  if (y === 0 && x === 0) return C.GOLD; // totem head
  if (y === 1 && x === 0) return "#E05050"; // totem face
  if (y === 2 && x === 0) return "#4A8C5E"; // totem glow
  // Lower robes
  if (y === 9 && x >= 4 && x <= 11) return p.secondary;
  if (y === 10 && x >= 4 && x <= 11) return p.primary;
  if (y === 11 && x >= 5 && x <= 10) return p.secondary;
  if (y === 12 && x >= 5 && x <= 10) return p.dark;
  if (y === 13 && x >= 6 && x <= 9) return p.dark;
  return C.T;
});

// --- Ninja (Assassin) - Black bodysuit, mask, shuriken, nimble pose ---
export const SPRITE_NINJA: SpriteData = sprite16((x, y) => {
  const p = ASSASSIN_COLORS;
  // Head wrap / mask
  if (y === 1 && x >= 5 && x <= 10) return p.dark;
  if (y === 2 && x >= 4 && x <= 11) return p.dark;
  if (y === 2 && (x === 6 || x === 9)) return C.WHT; // narrow eyes
  if (y === 3 && x >= 5 && x <= 10) return p.dark;
  if (y === 3 && x === 12) return p.dark; // mask tail
  if (y === 4 && x === 13) return p.dark; // mask tail end
  // Slim bodysuit
  if (y === 4 && x >= 5 && x <= 10) return p.secondary;
  if (y === 5 && x >= 4 && x <= 11) return p.dark;
  if (y === 5 && (x === 7 || x === 8)) return p.primary; // chest sash
  if (y === 6 && x >= 4 && x <= 11) return p.secondary;
  if (y === 7 && x >= 5 && x <= 10) return p.dark;
  // Arm sash
  if (y === 5 && x === 3) return p.primary;
  if (y === 5 && x === 12) return p.primary;
  // Shuriken (right hand, star shape)
  if (y === 6 && x === 14) return C.GREY;
  if (y === 5 && x === 14) return C.GREY;
  if (y === 7 && x === 14) return C.GREY;
  if (y === 6 && x === 13) return C.GREY;
  if (y === 6 && x === 15) return C.GREY;
  // Kunai (left hand)
  if (y >= 4 && y <= 7 && x === 1) return C.GREY;
  if (y === 3 && x === 1) return C.WHT; // blade tip
  // Belt with tools
  if (y === 8 && x >= 5 && x <= 10) return p.primary;
  if (y === 8 && (x === 6 || x === 9)) return C.GREY; // tools
  // Legs (split stance)
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 4 && x <= 6) || (x >= 9 && x <= 11))) return p.secondary;
  if (y === 11 && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))) return p.dark;
  if (y === 12 && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))) return p.secondary;
  if (y === 13 && (x === 3 || x === 12)) return p.dark; // tabi boots
  return C.T;
});

// --- Wizard (Mage) - Pointed hat, long robes, crystal-topped staff ---
export const SPRITE_WIZARD: SpriteData = sprite16((x, y) => {
  const p = MAGE_COLORS;
  // Pointed hat
  if (y === 0 && x === 7) return p.accent; // hat tip
  if (y === 1 && x >= 6 && x <= 8) return p.primary;
  if (y === 2 && x >= 5 && x <= 9) return p.primary;
  if (y === 2 && x === 7) return p.accent; // hat star
  if (y === 3 && x >= 4 && x <= 10) return p.secondary; // hat brim
  // Face with beard
  if (y === 4 && x >= 5 && x <= 10) return p.skin;
  if (y === 4 && (x === 6 || x === 9)) return C.BLK;
  if (y === 5 && x >= 5 && x <= 10) return p.skin;
  if (y === 5 && x >= 6 && x <= 9) return C.GREY; // beard
  if (y === 6 && x >= 6 && x <= 9) return C.GREY; // beard
  // Robes
  if (y === 7 && x >= 3 && x <= 12) return p.primary;
  if (y === 7 && (x === 7 || x === 8)) return p.accent; // rune
  if (y === 8 && x >= 3 && x <= 12) return p.secondary;
  if (y === 8 && (x === 5 || x === 10)) return p.accent; // stars
  if (y === 9 && x >= 3 && x <= 12) return p.primary;
  if (y === 10 && x >= 3 && x <= 12) return p.secondary;
  if (y === 11 && x >= 4 && x <= 11) return p.primary;
  if (y === 12 && x >= 4 && x <= 11) return p.secondary;
  if (y === 13 && x >= 5 && x <= 10) return p.dark;
  if (y === 14 && x >= 5 && x <= 10) return p.dark;
  // Crystal staff (right side)
  if (y >= 2 && y <= 13 && x === 14) return "#6B4A2E";
  if (y === 0 && x === 14) return "#80CCFF"; // crystal glow
  if (y === 1 && x === 14) return p.accent; // crystal
  if (y === 1 && (x === 13 || x === 15)) return "#80CCFF"; // crystal glow
  return C.T;
});

// --- Sorcerer (Mage) - No hat, swirling energy, dark robes with runes ---
export const SPRITE_SORCERER: SpriteData = sprite16((x, y) => {
  const p = MAGE_COLORS;
  // Wild hair (energy-infused)
  if (y === 0 && (x === 4 || x === 6 || x === 9 || x === 11)) return p.accent;
  if (y === 1 && x >= 4 && x <= 11) return p.dark;
  if (y === 1 && (x === 5 || x === 10)) return p.accent; // energy streaks
  // Face (intense)
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return p.accent; // glowing eyes
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  // Dark robes with rune markings
  if (y === 4 && x >= 4 && x <= 11) return p.dark;
  if (y === 5 && x >= 3 && x <= 12) return p.dark;
  if (y === 5 && (x === 6 || x === 9)) return p.accent; // runes
  if (y === 6 && x >= 3 && x <= 12) return p.secondary;
  if (y === 6 && x === 7) return p.accent; // center rune
  if (y === 7 && x >= 3 && x <= 12) return p.dark;
  if (y === 7 && (x === 5 || x === 10)) return p.accent;
  if (y === 8 && x >= 4 && x <= 11) return p.secondary;
  // Energy hands (both sides glowing)
  if (y === 5 && x === 1) return "#80CCFF";
  if (y === 6 && (x === 0 || x === 2)) return p.accent;
  if (y === 5 && x === 14) return "#FF80CC";
  if (y === 6 && (x === 13 || x === 15)) return "#E050A0";
  if (y === 4 && x === 1) return p.accent; // energy trail
  if (y === 4 && x === 14) return "#E050A0";
  // Lower robes
  if (y === 9 && x >= 4 && x <= 11) return p.dark;
  if (y === 9 && (x === 6 || x === 9)) return p.accent;
  if (y === 10 && x >= 4 && x <= 11) return p.secondary;
  if (y === 11 && x >= 4 && x <= 11) return p.dark;
  if (y === 12 && x >= 5 && x <= 10) return p.secondary;
  if (y === 13 && x >= 5 && x <= 10) return p.dark;
  return C.T;
});

// --- Templar (Paladin) - Holy armor, cross emblem, golden shield, healing light ---
export const SPRITE_TEMPLAR: SpriteData = sprite16((x, y) => {
  const p = PALADIN_COLORS;
  // Helm with golden crest
  if (y === 0 && x >= 6 && x <= 9) return p.accent;
  if (y === 1 && x >= 5 && x <= 10) return C.GREY;
  if (y === 2 && x >= 4 && x <= 11) return C.GREY;
  if (y === 2 && (x === 6 || x === 9)) return p.accent; // visor
  // Face
  if (y === 3 && x >= 5 && x <= 10) return p.skin;
  if (y === 3 && (x === 6 || x === 9)) return C.BLK;
  if (y === 4 && x >= 6 && x <= 9) return p.skin;
  // Holy armor with cross
  if (y === 5 && x >= 3 && x <= 12) return C.GREY;
  if (y === 5 && (x === 4 || x === 11)) return p.accent;
  if (y === 6 && x >= 3 && x <= 12) return C.GREY;
  if (y === 6 && x >= 6 && x <= 9) return p.accent; // horizontal cross
  if (y === 7 && x >= 4 && x <= 11) return C.GREY;
  if (y === 7 && (x === 7 || x === 8)) return p.accent; // vertical cross
  if (y === 8 && x >= 4 && x <= 11) return C.GREY;
  if (y === 8 && (x === 7 || x === 8)) return p.accent;
  // Golden shield (left)
  if (y >= 5 && y <= 10 && x >= 0 && x <= 2) return p.primary;
  if (y >= 6 && y <= 9 && x === 1) return p.accent;
  // Sword (right)
  if (y >= 2 && y <= 5 && x === 14) return C.GREY;
  if (y === 6 && x === 14) return p.accent; // cross guard
  if (y >= 7 && y <= 8 && x === 14) return "#8B6914"; // hilt
  // Belt
  if (y === 9 && x >= 5 && x <= 10) return p.primary;
  // Legs
  if (y === 10 && x >= 5 && x <= 10) return C.GREY;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return C.GREY;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  return C.T;
});

// --- Crusader (Paladin) - Heavy plate, glowing aura, two-handed mace ---
export const SPRITE_CRUSADER: SpriteData = sprite16((x, y) => {
  const p = PALADIN_COLORS;
  // Holy aura glow (subtle top)
  if (y === 0 && (x === 6 || x === 9)) return p.accent;
  if (y === 0 && (x === 7 || x === 8)) return "#FFFFC0";
  // Helm (crusader bucket helm)
  if (y === 1 && x >= 5 && x <= 10) return C.GREY;
  if (y === 2 && x >= 4 && x <= 11) return C.GREY;
  if (y === 2 && x >= 6 && x <= 9) return p.dark; // visor slit
  if (y === 3 && x >= 4 && x <= 11) return C.GREY;
  if (y === 3 && (x === 7 || x === 8)) return p.accent; // cross on helm
  if (y === 4 && x >= 5 && x <= 10) return C.GREY;
  // Tabard over plate
  if (y === 5 && x >= 3 && x <= 12) return p.primary;
  if (y === 6 && x >= 3 && x <= 12) return p.primary;
  if (y === 6 && x >= 6 && x <= 9) return p.accent; // cross emblem
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  if (y === 7 && (x === 7 || x === 8)) return p.accent;
  if (y === 8 && x >= 4 && x <= 11) return p.primary;
  // Heavy mace (right side)
  if (y >= 1 && y <= 5 && x === 14) return "#8B6914"; // handle
  if (y === 0 && x >= 13 && x <= 15) return C.GREY; // mace head
  if (y === 1 && x === 13) return C.GREY;
  if (y === 1 && x === 15) return C.GREY;
  // Belt
  if (y === 9 && x >= 5 && x <= 10) return p.secondary;
  if (y === 9 && (x === 7 || x === 8)) return p.accent;
  // Legs
  if (y === 10 && x >= 5 && x <= 10) return C.GREY;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.primary;
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return C.GREY;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.secondary;
  return C.T;
});

// --- Barbarian (Berserker) - Bare chest, war paint, huge axe, wild hair ---
export const SPRITE_BARBARIAN: SpriteData = sprite16((x, y) => {
  const p = BERSERKER_COLORS;
  // Wild spiked hair
  if (y === 0 && (x === 4 || x === 6 || x === 8 || x === 10 || x === 12)) return p.dark;
  if (y === 0 && (x === 5 || x === 7 || x === 9 || x === 11)) return p.secondary;
  if (y === 1 && x >= 4 && x <= 11) return p.dark;
  // Face with war paint
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK; // eyes
  if (y === 2 && x === 5) return p.primary; // paint
  if (y === 2 && x === 10) return p.primary;
  if (y === 3 && x >= 5 && x <= 10) return p.skin;
  if (y === 3 && (x === 7 || x === 8)) return p.primary; // chin paint
  // Bare muscular chest
  if (y === 4 && x >= 4 && x <= 11) return p.skin;
  if (y === 5 && x >= 3 && x <= 12) return p.skin;
  if (y === 5 && (x === 5 || x === 10)) return p.primary; // war paint stripes
  if (y === 6 && x >= 3 && x <= 12) return p.skin;
  if (y === 6 && (x === 6 || x === 9)) return p.primary; // paint X
  if (y === 7 && x >= 4 && x <= 11) return p.skin;
  // Fur loincloth / belt
  if (y === 8 && x >= 4 && x <= 11) return "#6B4A2E";
  if (y === 8 && (x === 6 || x === 9)) return "#8B6914";
  if (y === 9 && x >= 5 && x <= 10) return "#6B4A2E";
  // Giant axe (right side)
  if (y >= 3 && y <= 9 && x === 14) return "#6B4A2E"; // handle
  if (y === 1 && x >= 13 && x <= 15) return C.GREY; // axe head top
  if (y === 2 && x >= 13 && x <= 15) return C.GREY;
  if (y === 3 && x === 15) return C.GREY;
  if (y === 2 && x === 15) return C.WHT; // edge gleam
  // Fur bracers
  if (y === 5 && x === 2) return "#6B4A2E";
  if (y === 5 && x === 13) return "#6B4A2E";
  // Legs (fur wrapped)
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.skin;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#6B4A2E";
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.skin;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#6B4A2E"; // fur boots
  return C.T;
});

// --- Gladiator (Berserker) - Arena armor (one shoulder pad), trident, net ---
export const SPRITE_GLADIATOR: SpriteData = sprite16((x, y) => {
  const p = BERSERKER_COLORS;
  // Short-cropped hair / leather headband
  if (y === 1 && x >= 5 && x <= 10) return "#6B4A2E";
  if (y === 1 && x >= 6 && x <= 9) return p.primary; // headband
  // Face (scarred)
  if (y === 2 && x >= 5 && x <= 10) return p.skin;
  if (y === 2 && (x === 6 || x === 9)) return C.BLK;
  if (y === 2 && x === 10) return p.accent; // scar
  if (y === 3 && x >= 6 && x <= 9) return p.skin;
  // Single pauldron (left shoulder only) + bare arm right
  if (y === 4 && x >= 3 && x <= 5) return C.GREY; // pauldron
  if (y === 4 && x >= 6 && x <= 11) return p.skin;
  if (y === 5 && x >= 2 && x <= 4) return C.GREY;
  if (y === 5 && x >= 5 && x <= 12) return p.skin;
  // Chest armor (partial)
  if (y === 6 && x >= 4 && x <= 11) return p.secondary;
  if (y === 6 && (x === 7 || x === 8)) return C.GREY; // chest plate center
  if (y === 7 && x >= 4 && x <= 11) return p.secondary;
  // Arena belt with buckle
  if (y === 8 && x >= 4 && x <= 11) return "#8B6914";
  if (y === 8 && (x === 7 || x === 8)) return C.GOLD;
  // Trident (right hand)
  if (y >= 3 && y <= 10 && x === 14) return "#8B6914"; // shaft
  if (y === 1 && x === 13) return C.GREY; // left prong
  if (y === 1 && x === 14) return C.GREY; // center prong
  if (y === 1 && x === 15) return C.GREY; // right prong
  if (y === 0 && x === 13) return C.GREY;
  if (y === 0 && x === 14) return C.GREY;
  if (y === 0 && x === 15) return C.GREY;
  if (y === 2 && x === 14) return C.GREY;
  // Net (left hand, draped)
  if (y === 6 && x === 1) return "#C4A84A";
  if (y === 7 && (x === 0 || x === 2)) return "#C4A84A";
  if (y === 8 && (x === 0 || x === 1 || x === 2)) return "#C4A84A";
  if (y === 9 && (x === 0 || x === 2)) return "#C4A84A";
  // Legs (gladiator sandals + greaves)
  if (y === 9 && x >= 5 && x <= 10) return p.dark;
  if (y === 10 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.skin;
  if (y === 11 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return C.GREY; // greaves
  if (y === 12 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return p.skin;
  if (y === 13 && ((x >= 5 && x <= 7) || (x >= 8 && x <= 10))) return "#8B6914"; // sandals
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
  warden: SPRITE_WARDEN,
  archer: SPRITE_ARCHER,
  sniper: SPRITE_SNIPER,
  crossbowman: SPRITE_CROSSBOWMAN,
  cleric: SPRITE_CLERIC,
  druid: SPRITE_DRUID,
  shaman: SPRITE_SHAMAN,
  shadow: SPRITE_SHADOW,
  rogue: SPRITE_ROGUE,
  ninja: SPRITE_NINJA,
  wizard: SPRITE_WIZARD,
  sorcerer: SPRITE_SORCERER,
  templar: SPRITE_TEMPLAR,
  crusader: SPRITE_CRUSADER,
  barbarian: SPRITE_BARBARIAN,
  gladiator: SPRITE_GLADIATOR,
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
