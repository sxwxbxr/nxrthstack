/**
 * PKHeX Core - TypeScript port of PKHeX.Core Gen 3 handling
 * Based on: https://github.com/kwsch/PKHeX
 *
 * This implements the exact same logic as PKHeX for Gen 3 Pokemon
 * data encryption, decryption, and structure handling.
 */

// ============================================
// CONSTANTS (from PokeCrypto.cs)
// ============================================

export const SIZE_3STORED = 80;  // PC box Pokemon size
export const SIZE_3PARTY = 100;  // Party Pokemon size
export const SIZE_3HEADER = 32;  // Header size (unencrypted)
export const SIZE_3BLOCK = 12;   // Each substructure block size

// ============================================
// BLOCK POSITION TABLES (from PokeCrypto.cs)
// ============================================

/**
 * Block position lookup table - exactly matches PKHeX BlockPosition
 * Index = PID % 24, returns array of [pos0_type, pos1_type, pos2_type, pos3_type]
 * where type is: 0=Growth, 1=Attacks, 2=EVs/Condition, 3=Misc
 */
const BlockPosition: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0],
];

// ============================================
// BINARY UTILITIES
// ============================================

export function readU8(data: Uint8Array, offset: number): number {
  return data[offset];
}

export function readU16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

export function readU32LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

export function writeU8(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
}

export function writeU16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >> 8) & 0xFF;
}

export function writeU32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >> 8) & 0xFF;
  data[offset + 2] = (value >> 16) & 0xFF;
  data[offset + 3] = (value >> 24) & 0xFF;
}

// ============================================
// GEN 3 CRYPTO (from PokeCrypto.cs)
// ============================================

/**
 * Get the block order for a given shuffle value (PID % 24)
 * Returns which TYPE is at each POSITION
 */
export function getBlockOrder(sv: number): readonly [number, number, number, number] {
  return BlockPosition[sv] ?? BlockPosition[0];
}

/**
 * Get the position of a block type for a given shuffle value
 * @param sv Shuffle value (PID % 24)
 * @param blockType Block type (0=Growth, 1=Attacks, 2=EVs, 3=Misc)
 * @returns Position (0-3) where this block type is located
 */
export function getBlockPosition(sv: number, blockType: number): number {
  const order = getBlockOrder(sv);
  return order.indexOf(blockType);
}

/**
 * Decrypt Gen 3 Pokemon data (XOR encryption)
 * @param data Pokemon data (at least 80 bytes)
 * @param offset Start offset of Pokemon data
 * @returns Decrypted 48-byte substructure
 */
export function decryptGen3(data: Uint8Array, offset: number): Uint8Array {
  const pid = readU32LE(data, offset);
  const oid = readU32LE(data, offset + 4);
  const key = (pid ^ oid) >>> 0;

  const decrypted = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, offset + SIZE_3HEADER + i);
    writeU32LE(decrypted, i, (encrypted ^ key) >>> 0);
  }

  return decrypted;
}

/**
 * Encrypt and write Gen 3 substructure data
 * @param data Pokemon data array to write to
 * @param offset Start offset of Pokemon data
 * @param substructure Decrypted 48-byte substructure
 */
export function encryptGen3(data: Uint8Array, offset: number, substructure: Uint8Array): void {
  const pid = readU32LE(data, offset);
  const oid = readU32LE(data, offset + 4);
  const key = (pid ^ oid) >>> 0;

  for (let i = 0; i < 48; i += 4) {
    const decrypted = readU32LE(substructure, i);
    writeU32LE(data, offset + SIZE_3HEADER + i, (decrypted ^ key) >>> 0);
  }
}

/**
 * Calculate Gen 3 Pokemon checksum (Add16 algorithm)
 * Checksum is sum of all 16-bit words in the 48-byte substructure
 */
export function calculateGen3Checksum(substructure: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < 48; i += 2) {
    sum = (sum + readU16LE(substructure, i)) & 0xFFFF;
  }
  return sum;
}

/**
 * Verify Gen 3 Pokemon checksum
 */
export function verifyGen3Checksum(data: Uint8Array, offset: number): boolean {
  const storedChecksum = readU16LE(data, offset + 28);
  const substructure = decryptGen3(data, offset);
  const calculated = calculateGen3Checksum(substructure);
  return storedChecksum === calculated;
}

// ============================================
// GEN 3 POKEMON DATA ACCESS
// ============================================

export interface Gen3Pokemon {
  personality: number;
  otId: number;
  trainerId: number;
  secretId: number;
  nickname: string;
  language: number;
  otName: string;
  markings: number;
  checksum: number;

  // Growth block (type 0)
  species: number;
  heldItem: number;
  experience: number;
  ppBonuses: number;
  friendship: number;

  // Attacks block (type 1)
  move1: number;
  move2: number;
  move3: number;
  move4: number;
  pp1: number;
  pp2: number;
  pp3: number;
  pp4: number;

  // EVs/Condition block (type 2)
  evHp: number;
  evAttack: number;
  evDefense: number;
  evSpeed: number;
  evSpAttack: number;
  evSpDefense: number;
  coolness: number;
  beauty: number;
  cuteness: number;
  smartness: number;
  toughness: number;
  feel: number;

  // Misc block (type 3)
  pokerus: number;
  metLocation: number;
  originsInfo: number;
  ivData: number;
  ribbons: number;

  // Derived values
  ivHp: number;
  ivAttack: number;
  ivDefense: number;
  ivSpeed: number;
  ivSpAttack: number;
  ivSpDefense: number;
  isEgg: boolean;
  abilityBit: number;

  // Shiny calculation
  isShiny: boolean;
  nature: number;

  // Party data (only for party Pokemon)
  level?: number;
  currentHp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  spAttack?: number;
  spDefense?: number;
}

/**
 * Read a Gen 3 Pokemon from raw data
 * @param data Save data
 * @param offset Pokemon offset
 * @param isParty Whether this is party data (100 bytes) or box data (80 bytes)
 */
export function readGen3Pokemon(
  data: Uint8Array,
  offset: number,
  isParty: boolean = false
): Gen3Pokemon | null {
  const personality = readU32LE(data, offset);
  const otId = readU32LE(data, offset + 4);

  // Empty slot check
  if (personality === 0 && otId === 0) {
    return null;
  }

  const trainerId = otId & 0xFFFF;
  const secretId = (otId >> 16) & 0xFFFF;

  // Decrypt substructure
  const substructure = decryptGen3(data, offset);

  // Get block order based on personality
  const sv = personality % 24;
  const order = getBlockOrder(sv);

  // Find position of each block type
  const growthPos = order.indexOf(0) * SIZE_3BLOCK;
  const attacksPos = order.indexOf(1) * SIZE_3BLOCK;
  const evsPos = order.indexOf(2) * SIZE_3BLOCK;
  const miscPos = order.indexOf(3) * SIZE_3BLOCK;

  // Read Growth block (type 0)
  const species = readU16LE(substructure, growthPos);
  const heldItem = readU16LE(substructure, growthPos + 2);
  const experience = readU32LE(substructure, growthPos + 4);
  const ppBonuses = readU8(substructure, growthPos + 8);
  const friendship = readU8(substructure, growthPos + 9);

  // Validate species
  if (species === 0 || species > 386) {
    return null;
  }

  // Read Attacks block (type 1)
  const move1 = readU16LE(substructure, attacksPos);
  const move2 = readU16LE(substructure, attacksPos + 2);
  const move3 = readU16LE(substructure, attacksPos + 4);
  const move4 = readU16LE(substructure, attacksPos + 6);
  const pp1 = readU8(substructure, attacksPos + 8);
  const pp2 = readU8(substructure, attacksPos + 9);
  const pp3 = readU8(substructure, attacksPos + 10);
  const pp4 = readU8(substructure, attacksPos + 11);

  // Read EVs/Condition block (type 2)
  const evHp = readU8(substructure, evsPos);
  const evAttack = readU8(substructure, evsPos + 1);
  const evDefense = readU8(substructure, evsPos + 2);
  const evSpeed = readU8(substructure, evsPos + 3);
  const evSpAttack = readU8(substructure, evsPos + 4);
  const evSpDefense = readU8(substructure, evsPos + 5);
  const coolness = readU8(substructure, evsPos + 6);
  const beauty = readU8(substructure, evsPos + 7);
  const cuteness = readU8(substructure, evsPos + 8);
  const smartness = readU8(substructure, evsPos + 9);
  const toughness = readU8(substructure, evsPos + 10);
  const feel = readU8(substructure, evsPos + 11);

  // Read Misc block (type 3)
  const pokerus = readU8(substructure, miscPos);
  const metLocation = readU8(substructure, miscPos + 1);
  const originsInfo = readU16LE(substructure, miscPos + 2);
  const ivData = readU32LE(substructure, miscPos + 4);
  const ribbons = readU32LE(substructure, miscPos + 8);

  // Parse IVs from packed data
  const ivHp = ivData & 0x1F;
  const ivAttack = (ivData >> 5) & 0x1F;
  const ivDefense = (ivData >> 10) & 0x1F;
  const ivSpeed = (ivData >> 15) & 0x1F;
  const ivSpAttack = (ivData >> 20) & 0x1F;
  const ivSpDefense = (ivData >> 25) & 0x1F;
  const isEgg = ((ivData >> 30) & 1) === 1;
  const abilityBit = (ivData >> 31) & 1;

  // Calculate shiny status
  const p1 = personality & 0xFFFF;
  const p2 = (personality >> 16) & 0xFFFF;
  const shinyValue = trainerId ^ secretId ^ p1 ^ p2;
  const isShiny = shinyValue < 8;

  // Nature
  const nature = personality % 25;

  // Read header data
  const checksum = readU16LE(data, offset + 28);
  const language = readU8(data, offset + 18);
  const markings = readU8(data, offset + 27);

  // Build result
  const pokemon: Gen3Pokemon = {
    personality,
    otId,
    trainerId,
    secretId,
    nickname: '', // Will be decoded externally
    language,
    otName: '',   // Will be decoded externally
    markings,
    checksum,
    species,
    heldItem,
    experience,
    ppBonuses,
    friendship,
    move1,
    move2,
    move3,
    move4,
    pp1,
    pp2,
    pp3,
    pp4,
    evHp,
    evAttack,
    evDefense,
    evSpeed,
    evSpAttack,
    evSpDefense,
    coolness,
    beauty,
    cuteness,
    smartness,
    toughness,
    feel,
    pokerus,
    metLocation,
    originsInfo,
    ivData,
    ribbons,
    ivHp,
    ivAttack,
    ivDefense,
    ivSpeed,
    ivSpAttack,
    ivSpDefense,
    isEgg,
    abilityBit,
    isShiny,
    nature,
  };

  // Add party data if present
  if (isParty && data.length >= offset + SIZE_3PARTY) {
    pokemon.level = readU8(data, offset + 84);
    pokemon.currentHp = readU16LE(data, offset + 86);
    pokemon.maxHp = readU16LE(data, offset + 88);
    pokemon.attack = readU16LE(data, offset + 90);
    pokemon.defense = readU16LE(data, offset + 92);
    pokemon.speed = readU16LE(data, offset + 94);
    pokemon.spAttack = readU16LE(data, offset + 96);
    pokemon.spDefense = readU16LE(data, offset + 98);
  }

  return pokemon;
}

/**
 * Write a Gen 3 Pokemon to raw data
 * @param data Save data array to write to
 * @param offset Pokemon offset
 * @param pokemon Pokemon data to write
 */
export function writeGen3Pokemon(
  data: Uint8Array,
  offset: number,
  pokemon: Partial<Gen3Pokemon> & { personality: number; otId: number; species: number }
): void {
  const { personality, otId, species } = pokemon;

  // Write header
  writeU32LE(data, offset, personality);
  writeU32LE(data, offset + 4, otId);

  // Language (offset 18)
  writeU8(data, offset + 18, pokemon.language ?? 2); // Default to English

  // Flags byte (offset 19)
  writeU8(data, offset + 19, 0);

  // Markings (offset 27)
  writeU8(data, offset + 27, pokemon.markings ?? 0);

  // Padding (offset 30)
  writeU16LE(data, offset + 30, 0);

  // Build substructure
  const substructure = new Uint8Array(48);
  const sv = personality % 24;
  const order = getBlockOrder(sv);

  // Find position of each block type
  const growthPos = order.indexOf(0) * SIZE_3BLOCK;
  const attacksPos = order.indexOf(1) * SIZE_3BLOCK;
  const evsPos = order.indexOf(2) * SIZE_3BLOCK;
  const miscPos = order.indexOf(3) * SIZE_3BLOCK;

  // Write Growth block (type 0)
  writeU16LE(substructure, growthPos, species);
  writeU16LE(substructure, growthPos + 2, pokemon.heldItem ?? 0);
  writeU32LE(substructure, growthPos + 4, pokemon.experience ?? 0);
  writeU8(substructure, growthPos + 8, pokemon.ppBonuses ?? 0);
  writeU8(substructure, growthPos + 9, pokemon.friendship ?? 70);
  writeU8(substructure, growthPos + 10, 0); // Unused
  writeU8(substructure, growthPos + 11, 0); // Unused

  // Write Attacks block (type 1)
  writeU16LE(substructure, attacksPos, pokemon.move1 ?? 33); // Tackle default
  writeU16LE(substructure, attacksPos + 2, pokemon.move2 ?? 0);
  writeU16LE(substructure, attacksPos + 4, pokemon.move3 ?? 0);
  writeU16LE(substructure, attacksPos + 6, pokemon.move4 ?? 0);
  writeU8(substructure, attacksPos + 8, pokemon.pp1 ?? 35);
  writeU8(substructure, attacksPos + 9, pokemon.pp2 ?? 0);
  writeU8(substructure, attacksPos + 10, pokemon.pp3 ?? 0);
  writeU8(substructure, attacksPos + 11, pokemon.pp4 ?? 0);

  // Write EVs/Condition block (type 2)
  writeU8(substructure, evsPos, pokemon.evHp ?? 0);
  writeU8(substructure, evsPos + 1, pokemon.evAttack ?? 0);
  writeU8(substructure, evsPos + 2, pokemon.evDefense ?? 0);
  writeU8(substructure, evsPos + 3, pokemon.evSpeed ?? 0);
  writeU8(substructure, evsPos + 4, pokemon.evSpAttack ?? 0);
  writeU8(substructure, evsPos + 5, pokemon.evSpDefense ?? 0);
  writeU8(substructure, evsPos + 6, pokemon.coolness ?? 0);
  writeU8(substructure, evsPos + 7, pokemon.beauty ?? 0);
  writeU8(substructure, evsPos + 8, pokemon.cuteness ?? 0);
  writeU8(substructure, evsPos + 9, pokemon.smartness ?? 0);
  writeU8(substructure, evsPos + 10, pokemon.toughness ?? 0);
  writeU8(substructure, evsPos + 11, pokemon.feel ?? 0);

  // Write Misc block (type 3)
  writeU8(substructure, miscPos, pokemon.pokerus ?? 0);
  writeU8(substructure, miscPos + 1, pokemon.metLocation ?? 0);
  writeU16LE(substructure, miscPos + 2, pokemon.originsInfo ?? 0);

  // Pack IVs
  const ivs = pokemon.ivData ?? (
    ((pokemon.ivHp ?? 31) & 0x1F) |
    (((pokemon.ivAttack ?? 31) & 0x1F) << 5) |
    (((pokemon.ivDefense ?? 31) & 0x1F) << 10) |
    (((pokemon.ivSpeed ?? 31) & 0x1F) << 15) |
    (((pokemon.ivSpAttack ?? 31) & 0x1F) << 20) |
    (((pokemon.ivSpDefense ?? 31) & 0x1F) << 25) |
    ((pokemon.isEgg ? 1 : 0) << 30) |
    ((pokemon.abilityBit ?? 0) << 31)
  );
  writeU32LE(substructure, miscPos + 4, ivs >>> 0);
  writeU32LE(substructure, miscPos + 8, pokemon.ribbons ?? 0);

  // Calculate and write checksum
  const checksum = calculateGen3Checksum(substructure);
  writeU16LE(data, offset + 28, checksum);

  // Encrypt and write substructure
  encryptGen3(data, offset, substructure);
}

/**
 * Modify a specific field in a Gen 3 Pokemon
 * Handles decryption, modification, checksum recalculation, and re-encryption
 */
export function modifyGen3Pokemon(
  data: Uint8Array,
  offset: number,
  modifications: Partial<Gen3Pokemon>
): boolean {
  // Read current pokemon
  const pokemon = readGen3Pokemon(data, offset, false);
  if (!pokemon) return false;

  // Check if personality is being modified (special handling needed)
  if (modifications.personality !== undefined && modifications.personality !== pokemon.personality) {
    return modifyGen3PokemonWithPersonality(data, offset, pokemon, modifications);
  }

  // Decrypt current substructure
  const substructure = decryptGen3(data, offset);
  const sv = pokemon.personality % 24;
  const order = getBlockOrder(sv);

  const growthPos = order.indexOf(0) * SIZE_3BLOCK;
  const attacksPos = order.indexOf(1) * SIZE_3BLOCK;
  const evsPos = order.indexOf(2) * SIZE_3BLOCK;
  const miscPos = order.indexOf(3) * SIZE_3BLOCK;

  // Apply modifications to substructure
  if (modifications.species !== undefined) {
    writeU16LE(substructure, growthPos, modifications.species);
  }
  if (modifications.heldItem !== undefined) {
    writeU16LE(substructure, growthPos + 2, modifications.heldItem);
  }
  if (modifications.experience !== undefined) {
    writeU32LE(substructure, growthPos + 4, modifications.experience);
  }
  if (modifications.ppBonuses !== undefined) {
    writeU8(substructure, growthPos + 8, modifications.ppBonuses);
  }
  if (modifications.friendship !== undefined) {
    writeU8(substructure, growthPos + 9, modifications.friendship);
  }

  // Attacks
  if (modifications.move1 !== undefined) writeU16LE(substructure, attacksPos, modifications.move1);
  if (modifications.move2 !== undefined) writeU16LE(substructure, attacksPos + 2, modifications.move2);
  if (modifications.move3 !== undefined) writeU16LE(substructure, attacksPos + 4, modifications.move3);
  if (modifications.move4 !== undefined) writeU16LE(substructure, attacksPos + 6, modifications.move4);
  if (modifications.pp1 !== undefined) writeU8(substructure, attacksPos + 8, modifications.pp1);
  if (modifications.pp2 !== undefined) writeU8(substructure, attacksPos + 9, modifications.pp2);
  if (modifications.pp3 !== undefined) writeU8(substructure, attacksPos + 10, modifications.pp3);
  if (modifications.pp4 !== undefined) writeU8(substructure, attacksPos + 11, modifications.pp4);

  // EVs
  if (modifications.evHp !== undefined) writeU8(substructure, evsPos, modifications.evHp);
  if (modifications.evAttack !== undefined) writeU8(substructure, evsPos + 1, modifications.evAttack);
  if (modifications.evDefense !== undefined) writeU8(substructure, evsPos + 2, modifications.evDefense);
  if (modifications.evSpeed !== undefined) writeU8(substructure, evsPos + 3, modifications.evSpeed);
  if (modifications.evSpAttack !== undefined) writeU8(substructure, evsPos + 4, modifications.evSpAttack);
  if (modifications.evSpDefense !== undefined) writeU8(substructure, evsPos + 5, modifications.evSpDefense);

  // IVs - need to rebuild the packed value
  if (modifications.ivHp !== undefined || modifications.ivAttack !== undefined ||
      modifications.ivDefense !== undefined || modifications.ivSpeed !== undefined ||
      modifications.ivSpAttack !== undefined || modifications.ivSpDefense !== undefined) {
    const currentIvData = readU32LE(substructure, miscPos + 4);
    let newIvData = currentIvData;

    if (modifications.ivHp !== undefined) {
      newIvData = (newIvData & ~0x1F) | (modifications.ivHp & 0x1F);
    }
    if (modifications.ivAttack !== undefined) {
      newIvData = (newIvData & ~(0x1F << 5)) | ((modifications.ivAttack & 0x1F) << 5);
    }
    if (modifications.ivDefense !== undefined) {
      newIvData = (newIvData & ~(0x1F << 10)) | ((modifications.ivDefense & 0x1F) << 10);
    }
    if (modifications.ivSpeed !== undefined) {
      newIvData = (newIvData & ~(0x1F << 15)) | ((modifications.ivSpeed & 0x1F) << 15);
    }
    if (modifications.ivSpAttack !== undefined) {
      newIvData = (newIvData & ~(0x1F << 20)) | ((modifications.ivSpAttack & 0x1F) << 20);
    }
    if (modifications.ivSpDefense !== undefined) {
      newIvData = (newIvData & ~(0x1F << 25)) | ((modifications.ivSpDefense & 0x1F) << 25);
    }

    writeU32LE(substructure, miscPos + 4, newIvData >>> 0);
  }

  // Recalculate checksum
  const checksum = calculateGen3Checksum(substructure);
  writeU16LE(data, offset + 28, checksum);

  // Re-encrypt
  encryptGen3(data, offset, substructure);

  return true;
}

/**
 * Modify a Gen 3 Pokemon including personality change
 * This requires re-shuffling the substructure blocks
 */
function modifyGen3PokemonWithPersonality(
  data: Uint8Array,
  offset: number,
  currentPokemon: Gen3Pokemon,
  modifications: Partial<Gen3Pokemon>
): boolean {
  const oldPersonality = currentPokemon.personality;
  const newPersonality = modifications.personality!;
  const otId = currentPokemon.otId;

  // Decrypt with old key
  const oldSubstructure = decryptGen3(data, offset);

  // Get old and new block orders
  const oldSv = oldPersonality % 24;
  const newSv = newPersonality % 24;
  const oldOrder = getBlockOrder(oldSv);
  const newOrder = getBlockOrder(newSv);

  // Extract blocks based on OLD order (get actual block data by type)
  const blocks: Uint8Array[] = [
    new Uint8Array(SIZE_3BLOCK), // Type 0: Growth
    new Uint8Array(SIZE_3BLOCK), // Type 1: Attacks
    new Uint8Array(SIZE_3BLOCK), // Type 2: EVs
    new Uint8Array(SIZE_3BLOCK), // Type 3: Misc
  ];

  for (let type = 0; type < 4; type++) {
    const oldPos = oldOrder.indexOf(type) * SIZE_3BLOCK;
    for (let i = 0; i < SIZE_3BLOCK; i++) {
      blocks[type][i] = oldSubstructure[oldPos + i];
    }
  }

  // Rebuild substructure with NEW order
  const newSubstructure = new Uint8Array(48);
  for (let type = 0; type < 4; type++) {
    const newPos = newOrder.indexOf(type) * SIZE_3BLOCK;
    for (let i = 0; i < SIZE_3BLOCK; i++) {
      newSubstructure[newPos + i] = blocks[type][i];
    }
  }

  // Apply any additional modifications to the new substructure
  // (Find block positions in the NEW layout)
  const growthPos = newOrder.indexOf(0) * SIZE_3BLOCK;
  const attacksPos = newOrder.indexOf(1) * SIZE_3BLOCK;
  const evsPos = newOrder.indexOf(2) * SIZE_3BLOCK;
  const miscPos = newOrder.indexOf(3) * SIZE_3BLOCK;

  if (modifications.species !== undefined) {
    writeU16LE(newSubstructure, growthPos, modifications.species);
  }
  if (modifications.experience !== undefined) {
    writeU32LE(newSubstructure, growthPos + 4, modifications.experience);
  }
  // ... add more as needed

  // Write new personality
  writeU32LE(data, offset, newPersonality);

  // Recalculate checksum
  const checksum = calculateGen3Checksum(newSubstructure);
  writeU16LE(data, offset + 28, checksum);

  // Encrypt with NEW key
  const newKey = (newPersonality ^ otId) >>> 0;
  for (let i = 0; i < 48; i += 4) {
    const decrypted = readU32LE(newSubstructure, i);
    writeU32LE(data, offset + SIZE_3HEADER + i, (decrypted ^ newKey) >>> 0);
  }

  return true;
}

/**
 * Toggle shiny status for a Gen 3 Pokemon
 * This modifies personality to change shiny status while preserving other traits
 */
export function toggleGen3Shiny(data: Uint8Array, offset: number): boolean {
  const pokemon = readGen3Pokemon(data, offset, false);
  if (!pokemon) return false;

  const { personality, trainerId, secretId, otId } = pokemon;

  // Calculate current shiny value
  const p1 = personality & 0xFFFF;
  const p2 = (personality >> 16) & 0xFFFF;
  const currentShinyValue = trainerId ^ secretId ^ p1 ^ p2;
  const isCurrentlyShiny = currentShinyValue < 8;

  // Calculate new P2 to toggle shiny
  let newP2: number;
  if (isCurrentlyShiny) {
    // Make non-shiny: set shiny value to 8
    newP2 = (trainerId ^ secretId ^ p1 ^ 8) & 0xFFFF;
  } else {
    // Make shiny: set shiny value to 0
    newP2 = (trainerId ^ secretId ^ p1) & 0xFFFF;
  }

  const newPersonality = ((newP2 << 16) | p1) >>> 0;

  // Use the personality change function to handle re-shuffling
  return modifyGen3PokemonWithPersonality(data, offset, pokemon, { personality: newPersonality });
}

// ============================================
// GEN 3 SAVE STRUCTURE
// ============================================

export const SECTION_SIZE = 0x1000;  // 4096 bytes per section
export const SECTION_DATA_SIZE = 0xF80;  // 3968 bytes of usable data
export const SAVE_SLOT_SIZE = 0xE000;  // 57344 bytes per save slot (14 sections)

/**
 * Calculate Gen 3 section checksum
 * Checksum covers first 0xF80 bytes of section data
 */
export function calculateSectionChecksum(data: Uint8Array, sectionOffset: number): number {
  let sum = 0;
  for (let i = 0; i < SECTION_DATA_SIZE; i += 4) {
    sum = (sum + readU32LE(data, sectionOffset + i)) >>> 0;
  }
  // Fold 32-bit sum to 16-bit
  return ((sum & 0xFFFF) + (sum >>> 16)) & 0xFFFF;
}

/**
 * Update Gen 3 section checksum
 */
export function updateSectionChecksum(data: Uint8Array, sectionOffset: number): void {
  const checksum = calculateSectionChecksum(data, sectionOffset);
  writeU16LE(data, sectionOffset + 0xFF6, checksum);
}

/**
 * Get Gen 3 active save slot info
 * Returns the offset of the active save and the section map
 */
export function getGen3SaveInfo(data: Uint8Array): {
  activeSaveOffset: number;
  sections: Record<number, number>;
} {
  // Read save indices from both slots
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);

  // 0xFFFFFFFF means uninitialized
  const save1Valid = save1Index !== 0xFFFFFFFF;
  const save2Valid = save2Index !== 0xFFFFFFFF;

  let activeSaveOffset: number;
  if (!save1Valid && save2Valid) {
    activeSaveOffset = SAVE_SLOT_SIZE; // Only save 2 is valid
  } else if (save1Valid && !save2Valid) {
    activeSaveOffset = 0; // Only save 1 is valid
  } else if (save2Index > save1Index) {
    activeSaveOffset = SAVE_SLOT_SIZE; // Save 2 has higher index
  } else {
    activeSaveOffset = 0; // Save 1 has higher or equal index
  }

  // Build section map
  const sections: Record<number, number> = {};
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * SECTION_SIZE);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    const signature = readU32LE(data, sectionOffset + 0xFF8);

    // Validate signature
    if (signature === 0x08012025 && sectionId < 14) {
      sections[sectionId] = sectionOffset;
    }
  }

  return { activeSaveOffset, sections };
}

/**
 * Get PC Pokemon offset within the save file
 * PC data spans sections 5-13
 */
export function getPCPokemonOffset(
  sections: Record<number, number>,
  boxIndex: number,
  slotIndex: number
): { pokemonOffset: number; sectionOffset: number } | null {
  if (boxIndex < 0 || boxIndex > 13) return null;
  if (slotIndex < 0 || slotIndex > 29) return null;

  // PC data offset: 4-byte header + box data
  // Each Pokemon is 80 bytes, each box has 30 Pokemon
  const pcDataOffset = 4 + (boxIndex * 30 * SIZE_3STORED) + (slotIndex * SIZE_3STORED);

  // Section sizes: sections 5-12 have 3968 bytes, section 13 has 2000 bytes
  const sectionSizes = [3968, 3968, 3968, 3968, 3968, 3968, 3968, 3968, 2000];

  let remainingOffset = pcDataOffset;
  let sectionIdx = 5;

  while (sectionIdx <= 13) {
    const sectionSize = sectionSizes[sectionIdx - 5];
    if (remainingOffset < sectionSize) {
      if (sections[sectionIdx] === undefined) return null;
      return {
        pokemonOffset: sections[sectionIdx] + remainingOffset,
        sectionOffset: sections[sectionIdx],
      };
    }
    remainingOffset -= sectionSize;
    sectionIdx++;
  }

  return null;
}
