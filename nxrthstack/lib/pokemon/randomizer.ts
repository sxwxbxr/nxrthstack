import type { ROMInfo } from "./rom-detector";
import type { PokemonSpecies } from "@/lib/db";

// Binary utilities
function readU8(data: Uint8Array, offset: number): number {
  return data[offset];
}

function writeU8(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
}

function readU16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function writeU16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

// Calculate Base Stat Total
function calculateBST(pokemon: PokemonSpecies): number {
  return (
    pokemon.hpBase +
    pokemon.attackBase +
    pokemon.defenseBase +
    pokemon.spAtkBase +
    pokemon.spDefBase +
    pokemon.speedBase
  );
}

// Find Pokemon with similar BST
function findSimilarBSTPokemon(
  targetBST: number,
  pool: PokemonSpecies[],
  variance: number
): PokemonSpecies | null {
  const candidates = pool.filter((p) => {
    const bst = calculateBST(p);
    return Math.abs(bst - targetBST) <= variance;
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Find Pokemon with same type
function findSameTypePokemon(
  originalTypes: string[],
  pool: PokemonSpecies[]
): PokemonSpecies | null {
  const candidates = pool.filter((p) => {
    const types = p.types as string[];
    return originalTypes.some((t) => types.includes(t));
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Get random Pokemon from pool
function getRandomPokemon(pool: PokemonSpecies[]): PokemonSpecies {
  return pool[Math.floor(Math.random() * pool.length)];
}

// Gen 1/2 Pokemon ID to species mapping (internal ID to National Dex)
const GEN1_INTERNAL_TO_NATIONAL: Record<number, number> = {
  0x99: 1,   // Bulbasaur
  0x09: 2,   // Ivysaur
  0x9A: 3,   // Venusaur
  0xB0: 4,   // Charmander
  0xB2: 5,   // Charmeleon
  0xB4: 6,   // Charizard
  0xB1: 7,   // Squirtle
  0xB3: 8,   // Wartortle
  0x1C: 9,   // Blastoise
  0x7B: 10,  // Caterpie
  0x7C: 11,  // Metapod
  0x7D: 12,  // Butterfree
  0x70: 13,  // Weedle
  0x71: 14,  // Kakuna
  0x72: 15,  // Beedrill
  0x24: 16,  // Pidgey
  0x96: 17,  // Pidgeotto
  0x97: 18,  // Pidgeot
  0xA5: 19,  // Rattata
  0xA6: 20,  // Raticate
  0x05: 21,  // Spearow
  0x23: 22,  // Fearow
  0x6C: 23,  // Ekans
  0x2D: 24,  // Arbok
  0x54: 25,  // Pikachu
  0x55: 26,  // Raichu
  0x60: 27,  // Sandshrew
  0x61: 28,  // Sandslash
  0x0F: 29,  // Nidoran♀
  0xA8: 30,  // Nidorina
  0x10: 31,  // Nidoqueen
  0x03: 32,  // Nidoran♂
  0xA7: 33,  // Nidorino
  0x07: 34,  // Nidoking
  0x04: 35,  // Clefairy
  0x8E: 36,  // Clefable
  0x52: 37,  // Vulpix
  0x53: 38,  // Ninetales
  0x64: 39,  // Jigglypuff
  0x65: 40,  // Wigglytuff
  0x6B: 41,  // Zubat
  0x82: 42,  // Golbat
  0xB9: 43,  // Oddish
  0xBA: 44,  // Gloom
  0xBB: 45,  // Vileplume
  0x6D: 46,  // Paras
  0x2E: 47,  // Parasect
  0x41: 48,  // Venonat
  0x77: 49,  // Venomoth
  0x3B: 50,  // Diglett
  0x76: 51,  // Dugtrio
  0x4D: 52,  // Meowth
  0x90: 53,  // Persian
  0x2F: 54,  // Psyduck
  0x80: 55,  // Golduck
  0x39: 56,  // Mankey
  0x75: 57,  // Primeape
  0x21: 58,  // Growlithe
  0x14: 59,  // Arcanine
  0x47: 60,  // Poliwag
  0x6E: 61,  // Poliwhirl
  0x6F: 62,  // Poliwrath
  0x94: 63,  // Abra
  0x26: 64,  // Kadabra
  0x95: 65,  // Alakazam
  0x6A: 66,  // Machop
  0x29: 67,  // Machoke
  0x7E: 68,  // Machamp
  0xBC: 69,  // Bellsprout
  0xBD: 70,  // Weepinbell
  0xBE: 71,  // Victreebel
  0x18: 72,  // Tentacool
  0x9B: 73,  // Tentacruel
  0xA9: 74,  // Geodude
  0x27: 75,  // Graveler
  0x31: 76,  // Golem
  0xA3: 77,  // Ponyta
  0xA4: 78,  // Rapidash
  0x25: 79,  // Slowpoke
  0x08: 80,  // Slowbro
  0xAD: 81,  // Magnemite
  0x36: 82,  // Magneton
  0x40: 83,  // Farfetch'd
  0x46: 84,  // Doduo
  0x74: 85,  // Dodrio
  0x3A: 86,  // Seel
  0x78: 87,  // Dewgong
  0x0D: 88,  // Grimer
  0x88: 89,  // Muk
  0x17: 90,  // Shellder
  0x8B: 91,  // Cloyster
  0x19: 92,  // Gastly
  0x93: 93,  // Haunter
  0x0E: 94,  // Gengar
  0x22: 95,  // Onix
  0x30: 96,  // Drowzee
  0x81: 97,  // Hypno
  0x4E: 98,  // Krabby
  0x8A: 99,  // Kingler
  0x06: 100, // Voltorb
  0x8D: 101, // Electrode
  0x0C: 102, // Exeggcute
  0x0A: 103, // Exeggutor
  0x11: 104, // Cubone
  0x91: 105, // Marowak
  0x2B: 106, // Hitmonlee
  0x2C: 107, // Hitmonchan
  0x0B: 108, // Lickitung
  0x37: 109, // Koffing
  0x8F: 110, // Weezing
  0x12: 111, // Rhyhorn
  0x01: 112, // Rhydon
  0x28: 113, // Chansey
  0x1E: 114, // Tangela
  0x02: 115, // Kangaskhan
  0x5C: 116, // Horsea
  0x5D: 117, // Seadra
  0x9D: 118, // Goldeen
  0x9E: 119, // Seaking
  0x1B: 120, // Staryu
  0x98: 121, // Starmie
  0x2A: 122, // Mr. Mime
  0x1A: 123, // Scyther
  0x48: 124, // Jynx
  0x35: 125, // Electabuzz
  0x33: 126, // Magmar
  0x1D: 127, // Pinsir
  0x3C: 128, // Tauros
  0x85: 129, // Magikarp
  0x16: 130, // Gyarados
  0x13: 131, // Lapras
  0x4C: 132, // Ditto
  0x66: 133, // Eevee
  0x69: 134, // Vaporeon
  0x68: 135, // Jolteon
  0x67: 136, // Flareon
  0xAA: 137, // Porygon
  0x62: 138, // Omanyte
  0x63: 139, // Omastar
  0x5A: 140, // Kabuto
  0x5B: 141, // Kabutops
  0xAB: 142, // Aerodactyl
  0x84: 143, // Snorlax
  0x4A: 144, // Articuno
  0x4B: 145, // Zapdos
  0x49: 146, // Moltres
  0x58: 147, // Dratini
  0x59: 148, // Dragonair
  0x42: 149, // Dragonite
  0x83: 150, // Mewtwo
  0x15: 151, // Mew
};

// Reverse mapping
const GEN1_NATIONAL_TO_INTERNAL: Record<number, number> = Object.fromEntries(
  Object.entries(GEN1_INTERNAL_TO_NATIONAL).map(([k, v]) => [v, parseInt(k)])
);

interface RandomizeOptions {
  matchBST: boolean;
  bstVariance: number;
  includeLegendaries: boolean;
  sameType: boolean;
}

interface RandomizeResult {
  totalChanges: number;
  changes: { originalName: string; newName: string }[];
}

/**
 * Randomize wild Pokemon encounters
 */
export function randomizeWildEncounters(
  romData: Uint8Array,
  romInfo: ROMInfo,
  pokemonSpecies: PokemonSpecies[],
  options: RandomizeOptions
): RandomizeResult {
  const offsets = romInfo.offsets as Record<string, unknown>;
  const changes: { originalName: string; newName: string }[] = [];

  // Build pool of available Pokemon
  let pool = pokemonSpecies.filter((p) => p.generation <= romInfo.generation);
  if (!options.includeLegendaries) {
    pool = pool.filter((p) => !p.isLegendary);
  }

  if (pool.length === 0) {
    throw new Error("No Pokemon available in pool");
  }

  // Platform-specific encounter randomization
  if (romInfo.platform === "GBA") {
    return randomizeGBAEncounters(romData, romInfo, pool, options, changes);
  } else {
    return randomizeGBEncounters(romData, romInfo, pool, options, changes);
  }
}

function randomizeGBEncounters(
  romData: Uint8Array,
  romInfo: ROMInfo,
  pool: PokemonSpecies[],
  options: RandomizeOptions,
  changes: { originalName: string; newName: string }[]
): RandomizeResult {
  const offsets = romInfo.offsets as Record<string, number>;
  const wildGrassOffset = offsets.wildGrassEncounters;

  if (!wildGrassOffset) {
    throw new Error("Wild encounter offset not found for this ROM");
  }

  let totalChanges = 0;
  const encounterAreaSize = 20; // 10 slots x 2 bytes each (level + species)
  const numAreas = 50; // Approximate number of areas

  for (let area = 0; area < numAreas; area++) {
    const areaOffset = wildGrassOffset + (area * encounterAreaSize);

    // Check if this area is valid (encounter rate > 0)
    if (areaOffset >= romData.length - encounterAreaSize) break;

    // Each slot is: level (1 byte) + species internal ID (1 byte)
    for (let slot = 0; slot < 10; slot++) {
      const slotOffset = areaOffset + (slot * 2);
      const levelByte = readU8(romData, slotOffset);
      const speciesInternal = readU8(romData, slotOffset + 1);

      // Skip empty slots
      if (speciesInternal === 0 || levelByte === 0) continue;

      // Convert internal ID to national dex number
      const originalNationalId = GEN1_INTERNAL_TO_NATIONAL[speciesInternal];
      if (!originalNationalId) continue;

      const originalPokemon = pool.find((p) => p.pokedexId === originalNationalId);
      if (!originalPokemon) continue;

      // Find replacement
      let replacement: PokemonSpecies | null = null;

      if (options.sameType) {
        replacement = findSameTypePokemon(originalPokemon.types as string[], pool);
      }

      if (!replacement && options.matchBST) {
        const originalBST = calculateBST(originalPokemon);
        replacement = findSimilarBSTPokemon(originalBST, pool, options.bstVariance);
      }

      if (!replacement) {
        replacement = getRandomPokemon(pool);
      }

      // Convert new national ID to internal ID
      const newInternalId = GEN1_NATIONAL_TO_INTERNAL[replacement.pokedexId];
      if (newInternalId !== undefined) {
        writeU8(romData, slotOffset + 1, newInternalId);
        changes.push({
          originalName: originalPokemon.name,
          newName: replacement.name,
        });
        totalChanges++;
      }
    }
  }

  return { totalChanges, changes };
}

// Read a 32-bit pointer from ROM and convert to file offset
function readPointer(data: Uint8Array, offset: number): number {
  const ptr = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
  // GBA pointers have 0x08000000 base address - remove it to get file offset
  if ((ptr & 0x08000000) !== 0) {
    return ptr & 0x01FFFFFF;
  }
  return ptr;
}

// Check if a pointer is valid (points within ROM bounds)
function isValidPointer(ptr: number, romLength: number): boolean {
  return ptr > 0 && ptr < romLength - 4;
}

// Check if a pointer looks like a valid GBA ROM pointer
function isValidGBAPointer(data: Uint8Array, offset: number, romLength: number): boolean {
  if (offset + 4 > romLength) return false;
  const ptr = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
  // Valid GBA pointers are in the range 0x08000000 - 0x09FFFFFF or are 0
  if (ptr === 0) return true;
  return (ptr >= 0x08000000 && ptr < 0x0A000000);
}

// Dynamically find the wild encounter table by searching for its pattern
function findEncounterTable(data: Uint8Array, hintOffset: number): number | null {
  // First try the hint offset
  if (validateEncounterTable(data, hintOffset)) {
    return hintOffset;
  }

  // Search nearby the hint (within +/- 0x10000 bytes)
  const searchRadius = 0x10000;
  const startSearch = Math.max(0x100000, hintOffset - searchRadius);
  const endSearch = Math.min(data.length - 100, hintOffset + searchRadius);

  for (let offset = startSearch; offset < endSearch; offset += 4) {
    if (validateEncounterTable(data, offset)) {
      return offset;
    }
  }

  return null;
}

// Validate that an offset points to a valid encounter table
function validateEncounterTable(data: Uint8Array, tableOffset: number): boolean {
  if (tableOffset + 60 >= data.length) return false; // Need space for at least 3 entries

  let validEntries = 0;

  // Check first few entries
  for (let i = 0; i < 3; i++) {
    const entryOffset = tableOffset + (i * 20);
    const bank = readU8(data, entryOffset);
    const map = readU8(data, entryOffset + 1);

    // Bank and map should be reasonable values (not all 0xFF except for terminator)
    if (bank > 50 || map > 100) {
      if (bank === 0xFF && map === 0xFF && i > 0) break; // Valid terminator
      continue;
    }

    // Check that the pointers look valid
    const grassPtr = readPointer(data, entryOffset + 4);
    const waterPtr = readPointer(data, entryOffset + 8);

    // At least one encounter type should have valid data
    if (grassPtr > 0 && grassPtr < data.length) {
      // Verify grass pointer points to valid encounter data
      const encounterRate = readU8(data, grassPtr);
      if (encounterRate > 0 && encounterRate <= 100) {
        if (isValidGBAPointer(data, grassPtr + 4, data.length)) {
          validEntries++;
        }
      }
    }

    if (waterPtr > 0 && waterPtr < data.length) {
      const encounterRate = readU8(data, waterPtr);
      if (encounterRate > 0 && encounterRate <= 100) {
        if (isValidGBAPointer(data, waterPtr + 4, data.length)) {
          validEntries++;
        }
      }
    }
  }

  return validEntries >= 2; // Need at least 2 valid looking entries
}

function randomizeGBAEncounters(
  romData: Uint8Array,
  romInfo: ROMInfo,
  pool: PokemonSpecies[],
  options: RandomizeOptions,
  changes: { originalName: string; newName: string }[]
): RandomizeResult {
  const offsets = romInfo.offsets as Record<string, number>;
  const hintOffset = offsets.wildEncounterPointer;

  if (!hintOffset) {
    throw new Error("Wild encounter pointer not found for this ROM");
  }

  // Find the actual encounter table (may differ from hint in regional versions)
  const encounterTablePointer = findEncounterTable(romData, hintOffset);

  if (!encounterTablePointer) {
    throw new Error(
      `Could not locate wild encounter table for ${romInfo.gameName}. ` +
      `This ROM version may not be supported for randomization yet.`
    );
  }

  let totalChanges = 0;

  // GBA Pokemon games use a structured encounter table
  // The encounter table pointer points to an array of map encounter headers
  // Each header is 20 bytes:
  //   - Bank (1 byte)
  //   - Map (1 byte)
  //   - Padding (2 bytes)
  //   - Grass encounter pointer (4 bytes) - points to grass encounter data or 0
  //   - Water encounter pointer (4 bytes) - points to surf encounter data or 0
  //   - Rock smash encounter pointer (4 bytes) - points to rock smash data or 0
  //   - Fishing encounter pointer (4 bytes) - points to fishing data or 0

  // Each encounter data block has:
  //   - Encounter rate (1 byte)
  //   - Padding (3 bytes)
  //   - Encounter slots pointer (4 bytes)

  // Each encounter slot is 4 bytes:
  //   - Min level (1 byte)
  //   - Max level (1 byte)
  //   - Species ID (2 bytes)

  // Grass encounters have 12 slots, water/rock smash have 5 slots, fishing has 10 slots

  const GRASS_SLOTS = 12;
  const WATER_SLOTS = 5;
  const ROCK_SMASH_SLOTS = 5;
  const FISHING_SLOTS = 10;

  // Process encounter table entries
  // The table ends when we hit an invalid entry (both bank and map are 0xFF or pointer is 0)
  let tableOffset = encounterTablePointer;
  const maxMaps = 500; // Safety limit
  let mapCount = 0;

  while (mapCount < maxMaps && tableOffset < romData.length - 20) {
    const bank = readU8(romData, tableOffset);
    const map = readU8(romData, tableOffset + 1);

    // End of table marker
    if (bank === 0xFF && map === 0xFF) break;
    if (bank === 0 && map === 0) {
      // Check if all pointers are also 0 (true end of table)
      const grassPtr = readPointer(romData, tableOffset + 4);
      if (grassPtr === 0) break;
    }

    // Read encounter data pointers
    const grassDataPtr = readPointer(romData, tableOffset + 4);
    const waterDataPtr = readPointer(romData, tableOffset + 8);
    const rockSmashDataPtr = readPointer(romData, tableOffset + 12);
    const fishingDataPtr = readPointer(romData, tableOffset + 16);

    // Process grass encounters
    if (isValidPointer(grassDataPtr, romData.length)) {
      const slotsPtr = readPointer(romData, grassDataPtr + 4);
      if (isValidPointer(slotsPtr, romData.length)) {
        totalChanges += randomizeEncounterSlots(
          romData, slotsPtr, GRASS_SLOTS, pool, options, changes
        );
      }
    }

    // Process water encounters
    if (isValidPointer(waterDataPtr, romData.length)) {
      const slotsPtr = readPointer(romData, waterDataPtr + 4);
      if (isValidPointer(slotsPtr, romData.length)) {
        totalChanges += randomizeEncounterSlots(
          romData, slotsPtr, WATER_SLOTS, pool, options, changes
        );
      }
    }

    // Process rock smash encounters
    if (isValidPointer(rockSmashDataPtr, romData.length)) {
      const slotsPtr = readPointer(romData, rockSmashDataPtr + 4);
      if (isValidPointer(slotsPtr, romData.length)) {
        totalChanges += randomizeEncounterSlots(
          romData, slotsPtr, ROCK_SMASH_SLOTS, pool, options, changes
        );
      }
    }

    // Process fishing encounters
    if (isValidPointer(fishingDataPtr, romData.length)) {
      const slotsPtr = readPointer(romData, fishingDataPtr + 4);
      if (isValidPointer(slotsPtr, romData.length)) {
        totalChanges += randomizeEncounterSlots(
          romData, slotsPtr, FISHING_SLOTS, pool, options, changes
        );
      }
    }

    tableOffset += 20; // Move to next map header
    mapCount++;
  }

  return { totalChanges, changes };
}

function randomizeEncounterSlots(
  romData: Uint8Array,
  slotsPtr: number,
  numSlots: number,
  pool: PokemonSpecies[],
  options: RandomizeOptions,
  changes: { originalName: string; newName: string }[]
): number {
  let changesCount = 0;

  for (let slot = 0; slot < numSlots; slot++) {
    const slotOffset = slotsPtr + (slot * 4);

    if (slotOffset >= romData.length - 4) break;

    const minLevel = readU8(romData, slotOffset);
    const maxLevel = readU8(romData, slotOffset + 1);
    const speciesId = readU16LE(romData, slotOffset + 2);

    // Validate encounter slot data
    if (minLevel === 0 || minLevel > 100) continue;
    if (maxLevel === 0 || maxLevel > 100 || maxLevel < minLevel) continue;
    if (speciesId === 0 || speciesId > 500) continue; // Pokemon IDs should be reasonable

    const originalPokemon = pool.find((p) => p.pokedexId === speciesId);
    if (!originalPokemon) continue;

    // Find replacement
    let replacement: PokemonSpecies | null = null;

    if (options.sameType) {
      replacement = findSameTypePokemon(originalPokemon.types as string[], pool);
    }

    if (!replacement && options.matchBST) {
      const originalBST = calculateBST(originalPokemon);
      replacement = findSimilarBSTPokemon(originalBST, pool, options.bstVariance);
    }

    if (!replacement) {
      replacement = getRandomPokemon(pool);
    }

    // Write new species ID
    writeU16LE(romData, slotOffset + 2, replacement.pokedexId);
    changes.push({
      originalName: originalPokemon.name,
      newName: replacement.name,
    });
    changesCount++;
  }

  return changesCount;
}

/**
 * Set starter Pokemon
 */
export function setStarters(
  romData: Uint8Array,
  romInfo: ROMInfo,
  starterIds: number[]
): void {
  const offsets = romInfo.offsets as Record<string, number | number[]>;
  const starterOffsets = offsets.starterOffsets as number[];

  if (!starterOffsets || starterOffsets.length === 0) {
    throw new Error("Starter offsets not found for this ROM");
  }

  if (romInfo.platform === "GBA") {
    // GBA uses 16-bit species IDs
    for (let i = 0; i < Math.min(starterIds.length, starterOffsets.length); i++) {
      writeU16LE(romData, starterOffsets[i], starterIds[i]);
    }
  } else {
    // GB/GBC uses internal IDs
    for (let i = 0; i < Math.min(starterIds.length, starterOffsets.length); i++) {
      const internalId = GEN1_NATIONAL_TO_INTERNAL[starterIds[i]];
      if (internalId !== undefined) {
        writeU8(romData, starterOffsets[i], internalId);
      }
    }
  }
}

interface RandomStarterOptions {
  excludeLegendaries: boolean;
  balancedBST: boolean;
}

/**
 * Get random starter Pokemon IDs
 */
export function getRandomStarters(
  pokemonSpecies: PokemonSpecies[],
  options: RandomStarterOptions
): number[] {
  let pool = [...pokemonSpecies];

  if (options.excludeLegendaries) {
    pool = pool.filter((p) => !p.isLegendary);
  }

  // For balanced BST, select from similar ranges
  const starters: number[] = [];
  const targetBST = 320; // Average starter BST
  const variance = 100;

  for (let i = 0; i < 3; i++) {
    if (options.balancedBST) {
      const candidate = findSimilarBSTPokemon(targetBST, pool, variance);
      if (candidate) {
        starters.push(candidate.pokedexId);
        // Remove from pool to avoid duplicates
        pool = pool.filter((p) => p.pokedexId !== candidate.pokedexId);
        continue;
      }
    }

    // Fallback to random
    const randomIndex = Math.floor(Math.random() * pool.length);
    const pokemon = pool[randomIndex];
    starters.push(pokemon.pokedexId);
    pool.splice(randomIndex, 1);
  }

  return starters;
}
