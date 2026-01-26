import type { RomConfig } from "@/lib/db";

export interface ROMInfo {
  gameCode: string;
  gameName: string;
  generation: number;
  platform: "GB" | "GBC" | "GBA";
  region: string;
  pokemonCount: number;
  offsets: Record<string, unknown>;
  structureSizes: Record<string, number>;
  fileSize: number;
  fileName: string;
}

// Game Boy header offsets
const GB_HEADER = {
  TITLE_START: 0x134,
  TITLE_LENGTH: 16,
  CGB_FLAG: 0x143,
  NEW_LICENSEE_CODE: 0x144,
  SGB_FLAG: 0x146,
  CARTRIDGE_TYPE: 0x147,
  ROM_SIZE: 0x148,
  RAM_SIZE: 0x149,
  DESTINATION_CODE: 0x14a,
  OLD_LICENSEE_CODE: 0x14b,
};

// GBA header offsets
const GBA_HEADER = {
  GAME_TITLE_START: 0xa0,
  GAME_TITLE_LENGTH: 12,
  GAME_CODE_START: 0xac,
  GAME_CODE_LENGTH: 4,
  MAKER_CODE_START: 0xb0,
  MAKER_CODE_LENGTH: 2,
};

/**
 * Read a string from ROM data at a given offset
 */
function readString(data: Uint8Array, offset: number, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const byte = data[offset + i];
    if (byte === 0) break;
    result += String.fromCharCode(byte);
  }
  return result.trim();
}

/**
 * Detect if the ROM is a Game Boy (GB/GBC) ROM
 */
function detectGBROM(data: Uint8Array): { title: string; isGBC: boolean } | null {
  // Minimum GB ROM size is 32KB
  if (data.length < 0x150) return null;

  // Check for Nintendo logo at 0x104 (first few bytes)
  const nintendoLogo = [
    0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
  ];

  for (let i = 0; i < nintendoLogo.length; i++) {
    if (data[0x104 + i] !== nintendoLogo[i]) {
      return null;
    }
  }

  const title = readString(data, GB_HEADER.TITLE_START, GB_HEADER.TITLE_LENGTH);
  const cgbFlag = data[GB_HEADER.CGB_FLAG];
  const isGBC = cgbFlag === 0x80 || cgbFlag === 0xc0;

  return { title, isGBC };
}

/**
 * Detect if the ROM is a GBA ROM
 */
function detectGBAROM(data: Uint8Array): { title: string; gameCode: string } | null {
  // Minimum GBA ROM size is 256KB
  if (data.length < 0x100000 / 4) return null;

  // Check for GBA header (entry point)
  // GBA ROMs typically start with ARM branch instruction
  const entryPoint = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);

  // Check if it looks like a GBA ROM (ARM branch or specific patterns)
  if ((entryPoint & 0xff000000) !== 0xea000000 && data[0xb2] !== 0x96) {
    // Try alternate detection - check for valid game code
    const gameCode = readString(data, GBA_HEADER.GAME_CODE_START, GBA_HEADER.GAME_CODE_LENGTH);
    if (!/^[A-Z0-9]{4}$/.test(gameCode)) {
      return null;
    }
  }

  const title = readString(data, GBA_HEADER.GAME_TITLE_START, GBA_HEADER.GAME_TITLE_LENGTH);
  const gameCode = readString(data, GBA_HEADER.GAME_CODE_START, GBA_HEADER.GAME_CODE_LENGTH);

  return { title, gameCode };
}

/**
 * Match ROM to known configurations
 */
function matchROMConfig(
  data: Uint8Array,
  configs: RomConfig[],
  fileName: string
): RomConfig | null {
  // Try GBA detection first (larger ROMs)
  const gbaInfo = detectGBAROM(data);
  if (gbaInfo) {
    // Match by game code
    const gbaConfig = configs.find(
      (c) =>
        c.platform === "GBA" &&
        c.gameCode.toUpperCase() === gbaInfo.gameCode.toUpperCase()
    );
    if (gbaConfig) return gbaConfig;
  }

  // Try GB/GBC detection
  const gbInfo = detectGBROM(data);
  if (gbInfo) {
    // Match by title
    const gbConfig = configs.find((c) => {
      if (c.platform !== "GB" && c.platform !== "GBC") return false;

      // Check if title contains the game name
      const configName = c.gameCode.toUpperCase().replace("POKEMON ", "");
      const romTitle = gbInfo.title.toUpperCase();

      return (
        romTitle.includes(configName) ||
        configName.includes(romTitle) ||
        c.gameName.toUpperCase().includes(romTitle)
      );
    });
    if (gbConfig) return gbConfig;
  }

  // Try matching by filename as fallback
  const fileNameUpper = fileName.toUpperCase();
  for (const config of configs) {
    const nameWords = config.gameName.toUpperCase().split(" ");
    const matchCount = nameWords.filter((w) => fileNameUpper.includes(w)).length;
    if (matchCount >= 2) return config;
  }

  return null;
}

/**
 * Main ROM detection function
 */
export function detectROM(
  data: Uint8Array,
  configs: RomConfig[],
  fileName: string
): ROMInfo | null {
  const config = matchROMConfig(data, configs, fileName);

  if (!config) return null;

  return {
    gameCode: config.gameCode,
    gameName: config.gameName,
    generation: config.generation,
    platform: config.platform as "GB" | "GBC" | "GBA",
    region: config.region,
    pokemonCount: config.pokemonCount,
    offsets: config.offsets as Record<string, unknown>,
    structureSizes: config.structureSizes as Record<string, number>,
    fileSize: data.length,
    fileName,
  };
}
