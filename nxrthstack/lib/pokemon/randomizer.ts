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

function randomizeGBAEncounters(
  romData: Uint8Array,
  romInfo: ROMInfo,
  pool: PokemonSpecies[],
  options: RandomizeOptions,
  changes: { originalName: string; newName: string }[]
): RandomizeResult {
  const offsets = romInfo.offsets as Record<string, number>;
  const encounterPointer = offsets.wildEncounterPointer;

  if (!encounterPointer) {
    throw new Error("Wild encounter pointer not found for this ROM");
  }

  let totalChanges = 0;

  // GBA encounter structure is more complex - uses pointers
  // For simplicity, we'll scan for encounter patterns
  // Each encounter slot in GBA is 4 bytes: minLevel (1), maxLevel (1), species (2)

  // Scan ROM for encounter data patterns
  for (let offset = 0x100000; offset < romData.length - 4; offset += 4) {
    const byte1 = readU8(romData, offset);
    const byte2 = readU8(romData, offset + 1);
    const speciesId = readU16LE(romData, offset + 2);

    // Check if this looks like an encounter entry
    // Levels should be 2-100, species ID should be valid
    if (byte1 >= 2 && byte1 <= 100 && byte2 >= byte1 && byte2 <= 100 && speciesId > 0 && speciesId <= 386) {
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
      writeU16LE(romData, offset + 2, replacement.pokedexId);
      changes.push({
        originalName: originalPokemon.name,
        newName: replacement.name,
      });
      totalChanges++;
    }
  }

  return { totalChanges, changes };
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
