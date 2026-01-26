# Universal Pokemon ROM Editor - Technical Specification
## For R36S / ArkOS Compatible Games

### Version 2.0 - Multi-Generation Support

---

## Table of Contents

1. [Supported Platforms & Games](#1-supported-platforms--games)
2. [ROM Detection System](#2-rom-detection-system)
3. [Generation-Specific Offsets](#3-generation-specific-offsets)
4. [Universal Data Structures](#4-universal-data-structures)
5. [Core Features](#5-core-features)
6. [Difficulty Modification System](#6-difficulty-modification-system)
7. [Pokemon Stat Optimization](#7-pokemon-stat-optimization)
8. [Wild Encounter Randomization](#8-wild-encounter-randomization)
9. [Trainer & Gym Leader Enhancement](#9-trainer--gym-leader-enhancement)
10. [Implementation Guide](#10-implementation-guide)
11. [UI Component Specifications](#11-ui-component-specifications)

---

## 1. Supported Platforms & Games

### R36S / ArkOS Emulator Compatibility

| System | Emulator | Extensions | Pokemon Games |
|--------|----------|------------|---------------|
| Game Boy | Gambatte | .gb | Red, Blue, Yellow |
| Game Boy Color | Gambatte | .gbc | Gold, Silver, Crystal |
| Game Boy Advance | gpSP/mGBA | .gba | Ruby, Sapphire, Emerald, FireRed, LeafGreen |
| Nintendo DS | DraStic | .nds | Diamond, Pearl, Platinum, HeartGold, SoulSilver, Black, White, B2W2 |
| NES | FCEUmm | .nes | (Fan translations only) |

### Complete Game List

```javascript
const SUPPORTED_GAMES = {
  // Generation 1 (Game Boy)
  gen1: [
    { code: 'POKEMON RED', name: 'Pokemon Red', region: 'US', gen: 1 },
    { code: 'POKEMON BLUE', name: 'Pokemon Blue', region: 'US', gen: 1 },
    { code: 'POKEMON YELLOW', name: 'Pokemon Yellow', region: 'US', gen: 1 },
  ],
  
  // Generation 2 (Game Boy Color)
  gen2: [
    { code: 'POKEMON_GLD', name: 'Pokemon Gold', region: 'US', gen: 2 },
    { code: 'POKEMON_SLV', name: 'Pokemon Silver', region: 'US', gen: 2 },
    { code: 'PM_CRYSTAL', name: 'Pokemon Crystal', region: 'US', gen: 2 },
  ],
  
  // Generation 3 (Game Boy Advance)
  gen3: [
    { code: 'AXVE', name: 'Pokemon Ruby', region: 'US', gen: 3 },
    { code: 'AXPE', name: 'Pokemon Sapphire', region: 'US', gen: 3 },
    { code: 'BPEE', name: 'Pokemon Emerald', region: 'US', gen: 3 },
    { code: 'BPRE', name: 'Pokemon FireRed', region: 'US', gen: 3 },
    { code: 'BPGE', name: 'Pokemon LeafGreen', region: 'US', gen: 3 },
  ],
  
  // Generation 4 (Nintendo DS)
  gen4: [
    { code: 'ADAE', name: 'Pokemon Diamond', region: 'US', gen: 4 },
    { code: 'APAE', name: 'Pokemon Pearl', region: 'US', gen: 4 },
    { code: 'CPUE', name: 'Pokemon Platinum', region: 'US', gen: 4 },
    { code: 'IPKE', name: 'Pokemon HeartGold', region: 'US', gen: 4 },
    { code: 'IPGE', name: 'Pokemon SoulSilver', region: 'US', gen: 4 },
  ],
  
  // Generation 5 (Nintendo DS)
  gen5: [
    { code: 'IRBO', name: 'Pokemon Black', region: 'US', gen: 5 },
    { code: 'IRAO', name: 'Pokemon White', region: 'US', gen: 5 },
    { code: 'IREO', name: 'Pokemon Black 2', region: 'US', gen: 5 },
    { code: 'IRDO', name: 'Pokemon White 2', region: 'US', gen: 5 },
  ],
};

const POKEMON_COUNTS = {
  1: 151,   // Gen 1: Kanto
  2: 251,   // Gen 2: + Johto
  3: 386,   // Gen 3: + Hoenn
  4: 493,   // Gen 4: + Sinnoh
  5: 649,   // Gen 5: + Unova
};
```

---

## 2. ROM Detection System

### Universal ROM Detector

```javascript
class ROMDetector {
  constructor(data) {
    this.data = new Uint8Array(data);
    this.size = this.data.length;
  }
  
  detect() {
    // Try each platform in order
    const detectors = [
      this.detectNDS.bind(this),
      this.detectGBA.bind(this),
      this.detectGBC.bind(this),
      this.detectGB.bind(this),
    ];
    
    for (const detector of detectors) {
      const result = detector();
      if (result) return result;
    }
    
    return { valid: false, error: 'Unknown ROM format' };
  }
  
  // Nintendo DS Detection
  detectNDS() {
    if (this.size < 0x200) return null;
    
    // NDS ROMs have specific header structure
    const title = this.readString(0x00, 12);
    const gameCode = this.readString(0x0C, 4);
    
    // Check for valid NDS header
    if (this.data[0x15] !== 0x00) return null; // Unit code check
    
    const game = this.findGame(gameCode, [4, 5]);
    if (!game) return null;
    
    return {
      valid: true,
      platform: 'NDS',
      ...game,
      size: this.size,
      title,
      gameCode,
    };
  }
  
  // Game Boy Advance Detection  
  detectGBA() {
    if (this.size < 0xC0) return null;
    
    // GBA ROMs have Nintendo logo at 0x04 and game code at 0xAC
    const gameCode = this.readString(0xAC, 4);
    const title = this.readString(0xA0, 12);
    
    // Verify GBA header
    const fixedValue = this.data[0xB2];
    if (fixedValue !== 0x96) return null;
    
    const game = this.findGame(gameCode, [3]);
    if (!game) return null;
    
    return {
      valid: true,
      platform: 'GBA',
      ...game,
      size: this.size,
      title,
      gameCode,
      version: this.data[0xBC],
    };
  }
  
  // Game Boy Color Detection
  detectGBC() {
    if (this.size < 0x150) return null;
    
    // Check for GBC flag
    const cgbFlag = this.data[0x143];
    if (cgbFlag !== 0x80 && cgbFlag !== 0xC0) return null;
    
    const title = this.readString(0x134, 11);
    const game = this.findGameByTitle(title, [2]);
    
    if (!game) return null;
    
    return {
      valid: true,
      platform: 'GBC',
      ...game,
      size: this.size,
      title,
      cgbFlag,
    };
  }
  
  // Original Game Boy Detection
  detectGB() {
    if (this.size < 0x150) return null;
    
    // Check Nintendo logo
    const logoStart = 0x104;
    const expectedLogo = [0xCE, 0xED, 0x66, 0x66]; // First 4 bytes of Nintendo logo
    
    for (let i = 0; i < 4; i++) {
      if (this.data[logoStart + i] !== expectedLogo[i]) return null;
    }
    
    const title = this.readString(0x134, 16).replace(/\0/g, '');
    const game = this.findGameByTitle(title, [1]);
    
    if (!game) return null;
    
    return {
      valid: true,
      platform: 'GB',
      ...game,
      size: this.size,
      title,
    };
  }
  
  findGame(code, generations) {
    for (const gen of generations) {
      const games = SUPPORTED_GAMES[`gen${gen}`];
      const game = games?.find(g => g.code === code);
      if (game) return game;
    }
    return null;
  }
  
  findGameByTitle(title, generations) {
    const normalized = title.toUpperCase().replace(/[^A-Z]/g, '');
    
    for (const gen of generations) {
      const games = SUPPORTED_GAMES[`gen${gen}`];
      for (const game of games || []) {
        if (normalized.includes(game.code.replace(/[^A-Z]/g, ''))) {
          return game;
        }
      }
    }
    return null;
  }
  
  readString(offset, length) {
    let str = '';
    for (let i = 0; i < length; i++) {
      const byte = this.data[offset + i];
      if (byte === 0) break;
      str += String.fromCharCode(byte);
    }
    return str;
  }
}
```

---

## 3. Generation-Specific Offsets

### Generation 1 (Red/Blue/Yellow)

```javascript
const GEN1_OFFSETS = {
  pokemon_red_us: {
    baseStats: 0x383DE,        // 28 bytes per Pokemon
    pokemonNames: 0x1C21E,     // 10 bytes per name
    moveData: 0x38000,         // 6 bytes per move
    moveNames: 0xB0000,        // Variable length
    wildEncounters: 0xCEEB,    // Route encounter tables
    trainerData: 0x39D99,      // Trainer parties
    trainerNames: 0x0,         // In bank
    typeChart: 0x3E474,        // Type effectiveness
    evolutionData: 0x3B05D,    // Evolution methods
    starterPokemon: [0x1D104, 0x1D115, 0x1D126], // Starter offsets
    tmMoves: 0x13773,          // TM move list
    
    // Pokemon count
    pokemonCount: 151,
    moveCount: 165,
    
    // Structure sizes
    baseStatSize: 28,
    moveDataSize: 6,
  },
  
  pokemon_blue_us: {
    // Same structure as Red, different offsets for some data
    baseStats: 0x383DE,
    pokemonNames: 0x1C21E,
    // ... (mostly identical to Red)
  },
  
  pokemon_yellow_us: {
    baseStats: 0x383DE,
    pokemonNames: 0x1C21E,
    wildEncounters: 0xCB95,    // Slightly different
    starterPokemon: [0x1D11E], // Only Pikachu
    // Pikachu follows you - special handling needed
    pikachu: {
      happiness: 0x1A41E,
      surfingMinigame: true,
    },
  },
};
```

### Generation 2 (Gold/Silver/Crystal)

```javascript
const GEN2_OFFSETS = {
  pokemon_gold_us: {
    baseStats: 0x51B0B,        // 32 bytes per Pokemon
    pokemonNames: 0x53384,     // 10 bytes per name
    moveData: 0x41AFB,         // 7 bytes per move
    moveNames: 0x1B1574,
    wildEncounters: 0x2A5E9,   // Morning/Day/Night encounters
    trainerData: 0x39999,
    typeChart: 0x34BB1,
    evolutionData: 0x427BD,
    starterPokemon: [0x180DB, 0x180E7, 0x180F3],
    tmMoves: 0x11A2E,
    timeBasedEvents: true,
    pokemonCount: 251,
    moveCount: 251,
    baseStatSize: 32,
    
    // Gen 2 specific
    happiness: true,
    breeding: true,
    shinyFormula: 'dvs', // Based on DVs
    
    // Time-based encounters
    encounterSlots: {
      morning: 0x2A5E9,
      day: 0x2A5F9,
      night: 0x2A609,
    },
  },
  
  pokemon_crystal_us: {
    baseStats: 0x51424,
    pokemonNames: 0x53384,
    moveData: 0x41AFE,
    wildEncounters: 0x2A5E9,
    trainerData: 0x39990,
    evolutionData: 0x4256E,
    starterPokemon: [0x78E3B, 0x78E47, 0x78E53],
    pokemonCount: 251,
    
    // Crystal exclusive
    battleTower: true,
    celebiEvent: 0x726A3,
    oddEgg: 0x1FB4BE,
  },
};
```

### Generation 3 (Ruby/Sapphire/Emerald/FireRed/LeafGreen)

```javascript
const GEN3_OFFSETS = {
  pokemon_ruby_us: {
    baseStats: 0x1FEC18,       // 28 bytes per Pokemon
    pokemonNames: 0x1F716C,
    moveData: 0x1FB12C,        // 12 bytes per move
    moveNames: 0x1F8320,
    levelUpMoves: 0x207BC8,    // Pointers to learnsets
    tmHmLearnsets: 0x1FD0F0,   // 8 bytes per Pokemon
    wildEncounters: 0x39D454,  // Encounter header pointers
    trainerData: 0x1F0514,
    evolutionData: 0x203B50,
    starterPokemon: [0x5B1DF8, 0x5B1DFC, 0x5B1E00],
    typeChart: 0x1F2BE0,
    pokemonCount: 386,
    moveCount: 354,
    baseStatSize: 28,
    abilities: true,
    natures: true,
    doublesBattles: true,
  },
  
  pokemon_sapphire_us: {
    baseStats: 0x1FEC18,
    // ... Similar to Ruby
  },
  
  pokemon_emerald_us: {
    baseStats: 0x3203E8,
    pokemonNames: 0x3185C8,
    moveData: 0x31C898,
    moveNames: 0x31977C,
    levelUpMoves: 0x32937C,
    tmHmLearnsets: 0x31E898,
    wildEncounters: 0x552D48,
    trainerData: 0x310030,
    evolutionData: 0x32531C,
    starterPokemon: [0x5B1DF8, 0x5B1DFC, 0x5B1E00],
    typeChart: 0x31ADB8,
    pokemonCount: 386,
    moveCount: 354,
    baseStatSize: 28,
    
    // Emerald exclusive
    battleFrontier: true,
    rematches: true,
    animations: true,
  },
  
  pokemon_firered_us: {
    baseStats: 0x254784,
    pokemonNames: 0x245EE0,
    moveData: 0x250C04,
    moveNames: 0x247094,
    levelUpMoves: 0x25D7B4,
    tmHmLearnsets: 0x252BC8,
    wildEncounters: 0x3C9CB8,
    trainerData: 0x23EB38,
    evolutionData: 0x25977C,
    starterPokemon: [0x169C10, 0x169C14, 0x169C18],
    typeChart: 0x24F050,
    itemData: 0x3DB028,
    pokemonCount: 386,
    moveCount: 354,
    baseStatSize: 28,
    trainerCount: 743,
  },
  
  pokemon_leafgreen_us: {
    // Nearly identical to FireRed
    baseStats: 0x254784,
    pokemonNames: 0x245EE0,
    moveData: 0x250C04,
    // ...
  },
};
```

### Generation 4 (Diamond/Pearl/Platinum/HGSS)

```javascript
const GEN4_OFFSETS = {
  // Gen 4 uses NARC file system - offsets are file-based
  pokemon_diamond_us: {
    // NARC file paths within ROM
    narcs: {
      pokemonData: '/poketool/personal/personal.narc',    // Base stats
      learnsets: '/poketool/personal/wotbl.narc',         // Level-up moves
      evolutions: '/poketool/personal/evo.narc',          // Evolution data
      encounters: '/fielddata/encountdata/d_enc_data.narc', // Wild encounters
      trainerData: '/poketool/trainer/trdata.narc',       // Trainer Pokemon
      trainerPokemon: '/poketool/trainer/trpoke.narc',    // Trainer parties
      moveData: '/poketool/waza/waza_tbl.narc',           // Move stats
      itemData: '/itemtool/itemdata/item_data.narc',      // Items
    },
    pokemonCount: 493,
    moveCount: 467,
    
    // NDS-specific
    arm9Offset: 0x4000,       // ARM9 executable
    arm9CompressedSize: 0xBC340,
    overlayTable: 0x0,
    
    // Gen 4 features
    physicalSpecialSplit: true,
    gtsEnabled: true,
    pokeRadar: true,
  },
  
  pokemon_platinum_us: {
    narcs: {
      pokemonData: '/poketool/personal/pl_personal.narc',
      learnsets: '/poketool/personal/wotbl.narc',
      evolutions: '/poketool/personal/evo.narc',
      encounters: '/fielddata/encountdata/pl_enc_data.narc',
      trainerData: '/poketool/trainer/trdata.narc',
      trainerPokemon: '/poketool/trainer/trpoke.narc',
      moveData: '/poketool/waza/pl_waza_tbl.narc',
    },
    pokemonCount: 493,
    moveCount: 467,
    
    // Platinum exclusive
    battleFrontier: true,
    distortionWorld: true,
    formChanges: {
      giratina: true,
      shaymin: true,
      rotom: true,
    },
  },
  
  pokemon_heartgold_us: {
    narcs: {
      pokemonData: '/a/0/0/2',  // Different file structure
      learnsets: '/a/0/3/3',
      evolutions: '/a/0/3/4',
      encounters: '/a/0/3/7',
      trainerData: '/a/0/5/5',
      trainerPokemon: '/a/0/5/6',
      moveData: '/a/0/1/1',
    },
    pokemonCount: 493,
    
    // HGSS exclusive
    pokemonFollowing: true,
    pokeathlon: true,
    safariZoneCustomization: true,
    gbSounds: true,
  },
  
  pokemon_soulsilver_us: {
    // Same structure as HeartGold
    narcs: {
      pokemonData: '/a/0/0/2',
      // ...
    },
  },
};
```

### Generation 5 (Black/White/B2W2)

```javascript
const GEN5_OFFSETS = {
  pokemon_black_us: {
    narcs: {
      pokemonData: '/a/0/1/6',     // Personal data
      learnsets: '/a/0/1/8',       // Level-up moves
      evolutions: '/a/0/1/9',      // Evolution data
      encounters: '/a/1/2/6',      // Wild encounters
      trainerData: '/a/0/9/1',     // Trainer data
      trainerPokemon: '/a/0/9/2',  // Trainer Pokemon
      moveData: '/a/0/2/1',        // Move stats
      itemData: '/a/0/2/4',        // Item data
      tmData: '/a/0/2/2',          // TM/HM data
    },
    pokemonCount: 649,
    moveCount: 559,
    
    // Gen 5 features
    seasons: true,
    tripleRotationBattles: true,
    dreamWorld: true,
    hiddenAbilities: true,
    
    // Experience changes
    experienceFormula: 'scaled', // Level-based scaling
  },
  
  pokemon_white_us: {
    // Same structure, different exclusive Pokemon
    narcs: {
      pokemonData: '/a/0/1/6',
      // ...
    },
    versionExclusives: [641, 643], // Tornadus, Reshiram
  },
  
  pokemon_black2_us: {
    narcs: {
      pokemonData: '/a/0/1/6',
      learnsets: '/a/0/1/8',
      evolutions: '/a/0/1/9',
      encounters: '/a/1/2/7',      // Different from B/W
      trainerData: '/a/0/9/1',
      trainerPokemon: '/a/0/9/2',
      moveData: '/a/0/2/1',
    },
    pokemonCount: 649,
    
    // B2W2 exclusive
    pwt: true,                     // Pokemon World Tournament
    medalSystem: true,
    difficulty: {                  // Key system difficulties
      easy: 0x0,
      normal: 0x1,
      challenge: 0x2,
    },
    memoryLink: true,
  },
  
  pokemon_white2_us: {
    // Same structure as Black 2
    narcs: {
      pokemonData: '/a/0/1/6',
      // ...
    },
    versionExclusives: [642, 644], // Thundurus, Zekrom
  },
};
```

---

## 4. Universal Data Structures

### Base Stat Structure (All Generations)

```javascript
/**
 * Unified Pokemon data interface
 * Handles differences between generations internally
 */
class PokemonData {
  constructor(rom, gen, offsets) {
    this.rom = rom;
    this.gen = gen;
    this.offsets = offsets;
  }
  
  // Get stat structure size by generation
  getStatSize() {
    switch (this.gen) {
      case 1: return 28;
      case 2: return 32;
      case 3: return 28;
      case 4: return 44;  // From NARC
      case 5: return 48;  // From NARC
      default: return 28;
    }
  }
  
  /**
   * Read Pokemon base stats - unified interface
   */
  readBaseStats(pokemonId) {
    if (this.gen >= 4) {
      return this.readNARCStats(pokemonId);
    }
    
    const offset = this.offsets.baseStats + (pokemonId * this.getStatSize());
    
    // Common stats (all generations)
    const stats = {
      id: pokemonId,
      hp: this.rom[offset + this.getStatOffset('hp')],
      attack: this.rom[offset + this.getStatOffset('attack')],
      defense: this.rom[offset + this.getStatOffset('defense')],
      speed: this.rom[offset + this.getStatOffset('speed')],
      spAttack: this.rom[offset + this.getStatOffset('spAttack')],
      spDefense: this.rom[offset + this.getStatOffset('spDefense')],
    };
    
    // Type handling
    stats.type1 = this.rom[offset + this.getStatOffset('type1')];
    stats.type2 = this.rom[offset + this.getStatOffset('type2')];
    
    // Catch rate
    stats.catchRate = this.rom[offset + this.getStatOffset('catchRate')];
    
    // Base experience
    stats.baseExp = this.rom[offset + this.getStatOffset('baseExp')];
    
    // Generation-specific
    if (this.gen >= 3) {
      stats.ability1 = this.rom[offset + this.getStatOffset('ability1')];
      stats.ability2 = this.rom[offset + this.getStatOffset('ability2')];
    }
    
    if (this.gen >= 4) {
      stats.ability3 = this.rom[offset + this.getStatOffset('ability3')]; // Hidden
    }
    
    // Calculate BST
    stats.bst = stats.hp + stats.attack + stats.defense + 
                stats.speed + stats.spAttack + stats.spDefense;
    
    return stats;
  }
  
  /**
   * Write Pokemon base stats
   */
  writeBaseStats(pokemonId, stats) {
    if (this.gen >= 4) {
      return this.writeNARCStats(pokemonId, stats);
    }
    
    const offset = this.offsets.baseStats + (pokemonId * this.getStatSize());
    
    this.rom[offset + this.getStatOffset('hp')] = Math.min(255, Math.max(1, stats.hp));
    this.rom[offset + this.getStatOffset('attack')] = Math.min(255, Math.max(1, stats.attack));
    this.rom[offset + this.getStatOffset('defense')] = Math.min(255, Math.max(1, stats.defense));
    this.rom[offset + this.getStatOffset('speed')] = Math.min(255, Math.max(1, stats.speed));
    this.rom[offset + this.getStatOffset('spAttack')] = Math.min(255, Math.max(1, stats.spAttack));
    this.rom[offset + this.getStatOffset('spDefense')] = Math.min(255, Math.max(1, stats.spDefense));
    this.rom[offset + this.getStatOffset('type1')] = stats.type1;
    this.rom[offset + this.getStatOffset('type2')] = stats.type2;
    this.rom[offset + this.getStatOffset('catchRate')] = Math.min(255, Math.max(1, stats.catchRate));
  }
  
  /**
   * Get stat offset by generation
   */
  getStatOffset(stat) {
    const offsets = {
      1: { hp: 1, attack: 2, defense: 3, speed: 4, spAttack: 5, spDefense: 5, type1: 6, type2: 7, catchRate: 8, baseExp: 9 },
      2: { hp: 1, attack: 2, defense: 3, speed: 4, spAttack: 5, spDefense: 6, type1: 7, type2: 8, catchRate: 9, baseExp: 10 },
      3: { hp: 0, attack: 1, defense: 2, speed: 3, spAttack: 4, spDefense: 5, type1: 6, type2: 7, catchRate: 8, baseExp: 9, ability1: 22, ability2: 23 },
    };
    return offsets[this.gen]?.[stat] ?? 0;
  }
}
```

### Type System (Unified)

```javascript
/**
 * Type IDs are consistent from Gen 2 onwards
 * Gen 1 has no Dark or Steel types
 */
const TYPE_IDS = {
  NORMAL: 0,
  FIGHTING: 1,
  FLYING: 2,
  POISON: 3,
  GROUND: 4,
  ROCK: 5,
  BUG: 6,
  GHOST: 7,
  STEEL: 8,      // Gen 2+
  FIRE: 9,       // Gen 1: 20
  WATER: 10,     // Gen 1: 21
  GRASS: 11,     // Gen 1: 22
  ELECTRIC: 12,  // Gen 1: 23
  PSYCHIC: 13,   // Gen 1: 24
  ICE: 14,       // Gen 1: 25
  DRAGON: 15,    // Gen 1: 26
  DARK: 16,      // Gen 2+
  FAIRY: 17,     // Gen 6+ (not in scope)
};

// Gen 1 uses different type IDs
const GEN1_TYPE_IDS = {
  NORMAL: 0, FIGHTING: 1, FLYING: 2, POISON: 3, GROUND: 4,
  ROCK: 5, BUG: 7, GHOST: 8, FIRE: 20, WATER: 21,
  GRASS: 22, ELECTRIC: 23, PSYCHIC: 24, ICE: 25, DRAGON: 26,
};

const TYPE_COLORS = {
  0: '#A8A878',   // Normal
  1: '#C03028',   // Fighting
  2: '#A890F0',   // Flying
  3: '#A040A0',   // Poison
  4: '#E0C068',   // Ground
  5: '#B8A038',   // Rock
  6: '#A8B820',   // Bug
  7: '#705898',   // Ghost
  8: '#B8B8D0',   // Steel
  9: '#F08030',   // Fire
  10: '#6890F0',  // Water
  11: '#78C850',  // Grass
  12: '#F8D030',  // Electric
  13: '#F85888',  // Psychic
  14: '#98D8D8',  // Ice
  15: '#7038F8',  // Dragon
  16: '#705848',  // Dark
};
```

---

## 5. Core Features

### Feature Support Matrix

| Feature | Gen 1 | Gen 2 | Gen 3 | Gen 4 | Gen 5 |
|---------|-------|-------|-------|-------|-------|
| Wild Pokemon Randomizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trainer Pokemon Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Base Stat Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Type Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Move Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Starter Randomizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Evolution Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Learnset Editor | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Ability Editor | ❌ | ❌ | ✅ | ✅ | ✅ |
| TM Compatibility | ✅ | ✅ | ✅ | ✅ | ✅ |
| Item Randomizer | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Difficulty Scaling | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stat Min/Max | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 6. Difficulty Modification System

### Trainer Difficulty Scaling

```javascript
class DifficultyModifier {
  constructor(rom, gen, offsets) {
    this.rom = rom;
    this.gen = gen;
    this.offsets = offsets;
  }
  
  /**
   * Scale all trainer Pokemon levels
   * @param {number} multiplier - Level multiplier (e.g., 1.2 for 20% harder)
   */
  scaleTrainerLevels(multiplier) {
    const trainers = this.readAllTrainers();
    let modified = 0;
    
    for (const trainer of trainers) {
      for (const pokemon of trainer.pokemon) {
        const newLevel = Math.min(100, Math.floor(pokemon.level * multiplier));
        this.writeTrainerPokemonLevel(pokemon.offset, newLevel);
        modified++;
      }
    }
    
    return { trainersModified: trainers.length, pokemonModified: modified };
  }
  
  /**
   * Improve trainer AI (Gen 3+)
   */
  improveTrainerAI() {
    if (this.gen < 3) return { message: 'AI flags not available in Gen 1-2' };
    
    const trainers = this.readAllTrainers();
    let modified = 0;
    
    for (const trainer of trainers) {
      // AI flags in Gen 3: offset + 28 (4 bytes)
      // Bit 0: Check type effectiveness
      // Bit 1: Check for good moves
      // Bit 2: Smart switching
      // Bit 3: Consider HP
      const aiOffset = trainer.offset + 28;
      const currentAI = this.readU32(aiOffset);
      
      // Enable all smart AI flags
      const improvedAI = currentAI | 0x0F;
      this.writeU32(aiOffset, improvedAI);
      modified++;
    }
    
    return { trainersModified: modified };
  }
  
  /**
   * Give trainers held items (Gen 2+)
   */
  addTrainerItems() {
    if (this.gen < 2) return { message: 'Held items not available in Gen 1' };
    
    const itemPools = {
      2: [0x19, 0x1A, 0x1B, 0x1C, 0x1D], // Berries
      3: [0x0D, 0x0E, 0x0F, 0x10, 0x12], // Sitrus, Lum, etc.
      4: [0x95, 0x96, 0x97, 0x98],        // Various berries/items
      5: [0x95, 0x96, 0x97, 0x98],
    };
    
    const items = itemPools[this.gen] || [];
    const trainers = this.readAllTrainers();
    let modified = 0;
    
    for (const trainer of trainers) {
      if (!trainer.hasItems) {
        // Would need to modify trainer flags - complex
        continue;
      }
      
      for (const pokemon of trainer.pokemon) {
        if (pokemon.item === 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          this.writeTrainerPokemonItem(pokemon.offset, randomItem);
          modified++;
        }
      }
    }
    
    return { itemsAdded: modified };
  }
  
  /**
   * Full difficulty preset
   */
  applyDifficultyPreset(preset) {
    const presets = {
      easy: {
        levelMultiplier: 0.8,
        catchRateMultiplier: 1.5,
        expMultiplier: 1.3,
      },
      normal: {
        levelMultiplier: 1.0,
        catchRateMultiplier: 1.0,
        expMultiplier: 1.0,
      },
      hard: {
        levelMultiplier: 1.2,
        catchRateMultiplier: 0.8,
        expMultiplier: 0.8,
        improveAI: true,
        addItems: true,
      },
      insane: {
        levelMultiplier: 1.5,
        catchRateMultiplier: 0.5,
        expMultiplier: 0.5,
        improveAI: true,
        addItems: true,
        perfectIVs: true, // Enemies have perfect IVs
      },
    };
    
    const config = presets[preset];
    if (!config) throw new Error(`Unknown preset: ${preset}`);
    
    const results = {};
    
    // Scale levels
    results.levels = this.scaleTrainerLevels(config.levelMultiplier);
    
    // Modify catch rates
    if (config.catchRateMultiplier !== 1.0) {
      results.catchRates = this.scaleCatchRates(config.catchRateMultiplier);
    }
    
    // Improve AI
    if (config.improveAI) {
      results.ai = this.improveTrainerAI();
    }
    
    // Add items
    if (config.addItems) {
      results.items = this.addTrainerItems();
    }
    
    return results;
  }
  
  /**
   * Scale all Pokemon catch rates
   */
  scaleCatchRates(multiplier) {
    const pokemonData = new PokemonData(this.rom, this.gen, this.offsets);
    const count = this.offsets.pokemonCount || POKEMON_COUNTS[this.gen];
    let modified = 0;
    
    for (let i = 1; i <= count; i++) {
      const stats = pokemonData.readBaseStats(i);
      const newRate = Math.min(255, Math.max(1, Math.floor(stats.catchRate * multiplier)));
      
      if (newRate !== stats.catchRate) {
        stats.catchRate = newRate;
        pokemonData.writeBaseStats(i, stats);
        modified++;
      }
    }
    
    return { pokemonModified: modified };
  }
}
```

---

## 7. Pokemon Stat Optimization

### Perfect & Minimum Stat Calculator

```javascript
class StatOptimizer {
  constructor(rom, gen, offsets) {
    this.rom = rom;
    this.gen = gen;
    this.offsets = offsets;
    this.pokemonData = new PokemonData(rom, gen, offsets);
  }
  
  /**
   * Get EV/IV limits by generation
   */
  getLimits() {
    if (this.gen <= 2) {
      return {
        maxDV: 15,      // DVs, not IVs
        maxStatExp: 65535,
        evTotal: null,  // No limit, stat exp system
      };
    } else {
      return {
        maxIV: 31,
        maxEV: 252,
        evTotal: 510,
      };
    }
  }
  
  /**
   * Calculate stat at a given level
   * Uses proper formulas for each generation
   */
  calculateStat(baseStat, level, isHP, iv, ev, nature = 1.0) {
    if (this.gen <= 2) {
      // Gen 1-2 formula
      const dv = Math.min(iv, 15);
      const statExp = Math.min(ev, 65535);
      
      if (isHP) {
        return Math.floor(((baseStat + dv) * 2 + Math.floor(Math.ceil(Math.sqrt(statExp)) / 4)) * level / 100) + level + 10;
      } else {
        return Math.floor(((baseStat + dv) * 2 + Math.floor(Math.ceil(Math.sqrt(statExp)) / 4)) * level / 100) + 5;
      }
    } else {
      // Gen 3+ formula
      const ivVal = Math.min(iv, 31);
      const evVal = Math.min(ev, 252);
      
      if (isHP) {
        return Math.floor(((2 * baseStat + ivVal + Math.floor(evVal / 4)) * level / 100)) + level + 10;
      } else {
        return Math.floor((Math.floor(((2 * baseStat + ivVal + Math.floor(evVal / 4)) * level / 100)) + 5) * nature);
      }
    }
  }
  
  /**
   * Calculate perfect stats for a Pokemon
   */
  calculatePerfectStats(pokemonId, level = 100) {
    const base = this.pokemonData.readBaseStats(pokemonId);
    const limits = this.getLimits();
    
    if (this.gen <= 2) {
      return {
        hp: this.calculateStat(base.hp, level, true, limits.maxDV, limits.maxStatExp),
        attack: this.calculateStat(base.attack, level, false, limits.maxDV, limits.maxStatExp),
        defense: this.calculateStat(base.defense, level, false, limits.maxDV, limits.maxStatExp),
        spAttack: this.calculateStat(base.spAttack, level, false, limits.maxDV, limits.maxStatExp),
        spDefense: this.calculateStat(base.spDefense, level, false, limits.maxDV, limits.maxStatExp),
        speed: this.calculateStat(base.speed, level, false, limits.maxDV, limits.maxStatExp),
      };
    } else {
      // Optimal EV spread for highest total stats: 252 in two stats, 6 in one
      // For simplicity, max everything
      return {
        hp: this.calculateStat(base.hp, level, true, 31, 252),
        attack: this.calculateStat(base.attack, level, false, 31, 252, 1.1),
        defense: this.calculateStat(base.defense, level, false, 31, 252, 1.1),
        spAttack: this.calculateStat(base.spAttack, level, false, 31, 252, 1.1),
        spDefense: this.calculateStat(base.spDefense, level, false, 31, 252, 1.1),
        speed: this.calculateStat(base.speed, level, false, 31, 252, 1.1),
      };
    }
  }
  
  /**
   * Calculate minimum possible stats for a Pokemon
   */
  calculateMinStats(pokemonId, level = 100) {
    const base = this.pokemonData.readBaseStats(pokemonId);
    
    if (this.gen <= 2) {
      return {
        hp: this.calculateStat(base.hp, level, true, 0, 0),
        attack: this.calculateStat(base.attack, level, false, 0, 0),
        defense: this.calculateStat(base.defense, level, false, 0, 0),
        spAttack: this.calculateStat(base.spAttack, level, false, 0, 0),
        spDefense: this.calculateStat(base.spDefense, level, false, 0, 0),
        speed: this.calculateStat(base.speed, level, false, 0, 0),
      };
    } else {
      // Gen 3+: 0 IVs, 0 EVs, negative nature (0.9x)
      return {
        hp: this.calculateStat(base.hp, level, true, 0, 0),
        attack: this.calculateStat(base.attack, level, false, 0, 0, 0.9),
        defense: this.calculateStat(base.defense, level, false, 0, 0, 0.9),
        spAttack: this.calculateStat(base.spAttack, level, false, 0, 0, 0.9),
        spDefense: this.calculateStat(base.spDefense, level, false, 0, 0, 0.9),
        speed: this.calculateStat(base.speed, level, false, 0, 0, 0.9),
      };
    }
  }
  
  /**
   * Set enemy trainer Pokemon to have perfect stats
   */
  setTrainerPerfectStats() {
    // This depends on generation
    // Gen 1-2: Modify DV bytes in trainer data
    // Gen 3+: Modify IV value in trainer Pokemon entry
    
    if (this.gen < 3) {
      // Gen 1-2 trainers don't have individual IVs/DVs stored
      // DVs are calculated from personality or fixed
      return { message: 'Gen 1-2 trainer DVs are fixed by species' };
    }
    
    const trainers = this.readAllTrainers();
    let modified = 0;
    
    for (const trainer of trainers) {
      for (const pokemon of trainer.pokemon) {
        // IV value in Gen 3: 0-255, scaled to 0-31 for each stat
        // 255 = perfect IVs
        this.writeU16(pokemon.offset, 255);
        modified++;
      }
    }
    
    return { pokemonModified: modified };
  }
  
  /**
   * Modify base stats to make Pokemon stronger/weaker
   */
  modifyBaseStats(pokemonId, modifications) {
    const stats = this.pokemonData.readBaseStats(pokemonId);
    
    for (const [stat, change] of Object.entries(modifications)) {
      if (stats.hasOwnProperty(stat)) {
        if (typeof change === 'object') {
          if (change.set !== undefined) {
            stats[stat] = change.set;
          } else if (change.add !== undefined) {
            stats[stat] += change.add;
          } else if (change.multiply !== undefined) {
            stats[stat] = Math.floor(stats[stat] * change.multiply);
          }
        } else {
          stats[stat] = change;
        }
        
        // Clamp to valid range
        stats[stat] = Math.min(255, Math.max(1, stats[stat]));
      }
    }
    
    this.pokemonData.writeBaseStats(pokemonId, stats);
    return stats;
  }
  
  /**
   * Apply stat modifications to all Pokemon
   * @param {string} mode - 'perfect', 'minimum', 'boost', 'nerf'
   * @param {number} amount - For boost/nerf, the percentage
   */
  applyGlobalStatMod(mode, amount = 20) {
    const count = this.offsets.pokemonCount || POKEMON_COUNTS[this.gen];
    let modified = 0;
    
    for (let i = 1; i <= count; i++) {
      const stats = this.pokemonData.readBaseStats(i);
      
      switch (mode) {
        case 'perfect':
          // Max out all stats
          stats.hp = 255;
          stats.attack = 255;
          stats.defense = 255;
          stats.speed = 255;
          stats.spAttack = 255;
          stats.spDefense = 255;
          break;
          
        case 'minimum':
          // Minimum stats
          stats.hp = 1;
          stats.attack = 1;
          stats.defense = 1;
          stats.speed = 1;
          stats.spAttack = 1;
          stats.spDefense = 1;
          break;
          
        case 'boost':
          // Increase by percentage
          const boostMult = 1 + (amount / 100);
          stats.hp = Math.min(255, Math.floor(stats.hp * boostMult));
          stats.attack = Math.min(255, Math.floor(stats.attack * boostMult));
          stats.defense = Math.min(255, Math.floor(stats.defense * boostMult));
          stats.speed = Math.min(255, Math.floor(stats.speed * boostMult));
          stats.spAttack = Math.min(255, Math.floor(stats.spAttack * boostMult));
          stats.spDefense = Math.min(255, Math.floor(stats.spDefense * boostMult));
          break;
          
        case 'nerf':
          // Decrease by percentage
          const nerfMult = 1 - (amount / 100);
          stats.hp = Math.max(1, Math.floor(stats.hp * nerfMult));
          stats.attack = Math.max(1, Math.floor(stats.attack * nerfMult));
          stats.defense = Math.max(1, Math.floor(stats.defense * nerfMult));
          stats.speed = Math.max(1, Math.floor(stats.speed * nerfMult));
          stats.spAttack = Math.max(1, Math.floor(stats.spAttack * nerfMult));
          stats.spDefense = Math.max(1, Math.floor(stats.spDefense * nerfMult));
          break;
      }
      
      this.pokemonData.writeBaseStats(i, stats);
      modified++;
    }
    
    return { pokemonModified: modified };
  }
  
  /**
   * Calculate optimal competitive stat spread
   * Returns suggested EV spread for different roles
   */
  suggestCompetitiveSpread(pokemonId) {
    const base = this.pokemonData.readBaseStats(pokemonId);
    const bst = base.hp + base.attack + base.defense + 
                base.speed + base.spAttack + base.spDefense;
    
    // Determine role based on stats
    const physicalAttack = base.attack > base.spAttack;
    const tanky = (base.hp + base.defense + base.spDefense) / 3 > 80;
    const fast = base.speed > 90;
    
    const spreads = [];
    
    if (physicalAttack && fast) {
      spreads.push({
        name: 'Physical Sweeper',
        nature: 'Jolly (+Spd, -SpA) or Adamant (+Atk, -SpA)',
        evs: { hp: 4, attack: 252, speed: 252 },
      });
    }
    
    if (!physicalAttack && fast) {
      spreads.push({
        name: 'Special Sweeper',
        nature: 'Timid (+Spd, -Atk) or Modest (+SpA, -Atk)',
        evs: { hp: 4, spAttack: 252, speed: 252 },
      });
    }
    
    if (tanky) {
      spreads.push({
        name: 'Physical Wall',
        nature: 'Impish (+Def, -SpA) or Bold (+Def, -Atk)',
        evs: { hp: 252, defense: 252, spDefense: 4 },
      });
      
      spreads.push({
        name: 'Special Wall',
        nature: 'Careful (+SpD, -SpA) or Calm (+SpD, -Atk)',
        evs: { hp: 252, spDefense: 252, defense: 4 },
      });
    }
    
    return {
      pokemon: base,
      bst,
      suggestedRole: spreads[0]?.name || 'Versatile',
      spreads,
    };
  }
}
```

### Nature System (Gen 3+)

```javascript
const NATURES = {
  0:  { name: 'Hardy',   plus: null, minus: null },
  1:  { name: 'Lonely',  plus: 'attack', minus: 'defense' },
  2:  { name: 'Brave',   plus: 'attack', minus: 'speed' },
  3:  { name: 'Adamant', plus: 'attack', minus: 'spAttack' },
  4:  { name: 'Naughty', plus: 'attack', minus: 'spDefense' },
  5:  { name: 'Bold',    plus: 'defense', minus: 'attack' },
  6:  { name: 'Docile',  plus: null, minus: null },
  7:  { name: 'Relaxed', plus: 'defense', minus: 'speed' },
  8:  { name: 'Impish',  plus: 'defense', minus: 'spAttack' },
  9:  { name: 'Lax',     plus: 'defense', minus: 'spDefense' },
  10: { name: 'Timid',   plus: 'speed', minus: 'attack' },
  11: { name: 'Hasty',   plus: 'speed', minus: 'defense' },
  12: { name: 'Serious', plus: null, minus: null },
  13: { name: 'Jolly',   plus: 'speed', minus: 'spAttack' },
  14: { name: 'Naive',   plus: 'speed', minus: 'spDefense' },
  15: { name: 'Modest',  plus: 'spAttack', minus: 'attack' },
  16: { name: 'Mild',    plus: 'spAttack', minus: 'defense' },
  17: { name: 'Quiet',   plus: 'spAttack', minus: 'speed' },
  18: { name: 'Bashful', plus: null, minus: null },
  19: { name: 'Rash',    plus: 'spAttack', minus: 'spDefense' },
  20: { name: 'Calm',    plus: 'spDefense', minus: 'attack' },
  21: { name: 'Gentle',  plus: 'spDefense', minus: 'defense' },
  22: { name: 'Sassy',   plus: 'spDefense', minus: 'speed' },
  23: { name: 'Careful', plus: 'spDefense', minus: 'spAttack' },
  24: { name: 'Quirky',  plus: null, minus: null },
};

function getNatureMultiplier(natureId, stat) {
  const nature = NATURES[natureId];
  if (!nature) return 1.0;
  
  if (nature.plus === stat) return 1.1;
  if (nature.minus === stat) return 0.9;
  return 1.0;
}

function findBestNature(role) {
  const roles = {
    physicalSweeper: [3, 13],    // Adamant, Jolly
    specialSweeper: [15, 10],    // Modest, Timid
    physicalWall: [5, 8],        // Bold, Impish
    specialWall: [20, 23],       // Calm, Careful
    mixedAttacker: [11, 14],     // Hasty, Naive
  };
  return roles[role] || [0]; // Hardy as fallback
}
```

---

## 8. Wild Encounter Randomization

### Universal Encounter Randomizer

```javascript
class EncounterRandomizer {
  constructor(rom, gen, offsets) {
    this.rom = rom;
    this.gen = gen;
    this.offsets = offsets;
  }
  
  /**
   * Get encounter reading method by generation
   */
  readEncounters() {
    switch (this.gen) {
      case 1: return this.readGen1Encounters();
      case 2: return this.readGen2Encounters();
      case 3: return this.readGen3Encounters();
      case 4:
      case 5: return this.readNARCEncounters();
      default: throw new Error(`Unsupported generation: ${this.gen}`);
    }
  }
  
  /**
   * Gen 1: Simple encounter table format
   */
  readGen1Encounters() {
    const areas = [];
    let offset = this.offsets.wildEncounters;
    
    // Each area: rate (1 byte), then 10 slots of level (1) + species (1)
    while (offset < this.rom.length - 22) {
      const rate = this.rom[offset];
      if (rate === 0) break;
      
      const encounters = [];
      for (let i = 0; i < 10; i++) {
        const slotOffset = offset + 1 + (i * 2);
        encounters.push({
          level: this.rom[slotOffset],
          species: this.rom[slotOffset + 1],
        });
      }
      
      areas.push({
        offset,
        rate,
        type: 'grass',
        encounters,
      });
      
      offset += 21;
    }
    
    return areas;
  }
  
  /**
   * Gen 2: Time-based encounters
   */
  readGen2Encounters() {
    const areas = [];
    // Gen 2 has morning/day/night variants
    
    for (const timeSlot of ['morning', 'day', 'night']) {
      const timeOffset = this.offsets.encounterSlots?.[timeSlot] || this.offsets.wildEncounters;
      
      // Read encounter tables for this time period
      // Structure similar to Gen 1 but with 7 slots and rate per time
      // ...
    }
    
    return areas;
  }
  
  /**
   * Gen 3: Header pointer format
   */
  readGen3Encounters() {
    const areas = [];
    let headerOffset = this.offsets.wildEncounters;
    
    while (headerOffset < this.rom.length - 32) {
      const bankNumber = this.rom[headerOffset];
      const mapNumber = this.rom[headerOffset + 1];
      
      if (bankNumber === 0xFF && mapNumber === 0xFF) break;
      
      const grassPtr = this.readPointer(headerOffset + 4);
      const waterPtr = this.readPointer(headerOffset + 8);
      const rockSmashPtr = this.readPointer(headerOffset + 12);
      const fishingPtr = this.readPointer(headerOffset + 16);
      
      if (grassPtr) {
        areas.push({
          headerOffset,
          type: 'grass',
          pointer: grassPtr,
          encounters: this.readGen3EncounterTable(grassPtr, 12),
        });
      }
      
      if (waterPtr) {
        areas.push({
          headerOffset,
          type: 'water',
          pointer: waterPtr,
          encounters: this.readGen3EncounterTable(waterPtr, 5),
        });
      }
      
      if (fishingPtr) {
        areas.push({
          headerOffset,
          type: 'fishing',
          pointer: fishingPtr,
          encounters: this.readGen3EncounterTable(fishingPtr, 10),
        });
      }
      
      headerOffset += 20;
    }
    
    return areas;
  }
  
  readGen3EncounterTable(pointer, count) {
    const encounters = [];
    for (let i = 0; i < count; i++) {
      const offset = pointer + (i * 4);
      encounters.push({
        offset,
        minLevel: this.rom[offset],
        maxLevel: this.rom[offset + 1],
        species: this.rom[offset + 2] | (this.rom[offset + 3] << 8),
      });
    }
    return encounters;
  }
  
  /**
   * Randomize encounters with options
   */
  randomize(options = {}) {
    const {
      pokemonPool = this.getValidPool(options),
      matchBST = false,
      bstTolerance = 50,
      areaTheming = false,
      keepLevels = true,
      includeLegendaries = false,
    } = options;
    
    const areas = this.readEncounters();
    let modified = 0;
    
    for (const area of areas) {
      // If area theming, pick a subset of Pokemon for this area
      let areaPool = pokemonPool;
      if (areaTheming) {
        const types = this.getAreaTypes(area);
        areaPool = this.filterByType(pokemonPool, types);
        if (areaPool.length < 5) areaPool = pokemonPool; // Fallback
      }
      
      for (const encounter of area.encounters) {
        let newSpecies;
        
        if (matchBST) {
          const originalBST = this.getBST(encounter.species);
          const candidates = areaPool.filter(p => 
            Math.abs(this.getBST(p) - originalBST) <= bstTolerance
          );
          newSpecies = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : areaPool[Math.floor(Math.random() * areaPool.length)];
        } else {
          newSpecies = areaPool[Math.floor(Math.random() * areaPool.length)];
        }
        
        this.writeEncounter(encounter, newSpecies);
        modified++;
      }
    }
    
    return { areasModified: areas.length, encountersModified: modified };
  }
  
  writeEncounter(encounter, species) {
    if (this.gen <= 2) {
      this.rom[encounter.offset + 1] = species;
    } else {
      this.rom[encounter.offset + 2] = species & 0xFF;
      this.rom[encounter.offset + 3] = (species >> 8) & 0xFF;
    }
  }
  
  getValidPool(options = {}) {
    const count = POKEMON_COUNTS[this.gen];
    const legendaries = this.getLegendaries();
    const pool = [];
    
    for (let i = 1; i <= count; i++) {
      if (!options.includeLegendaries && legendaries.includes(i)) continue;
      pool.push(i);
    }
    
    return pool;
  }
  
  getLegendaries() {
    // By generation
    const legends = {
      1: [144, 145, 146, 150, 151],
      2: [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251],
      3: [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386],
      4: [/* Gen 4 legendaries */],
      5: [/* Gen 5 legendaries */],
    };
    return legends[this.gen] || legends[3];
  }
  
  getBST(pokemonId) {
    const pokemonData = new PokemonData(this.rom, this.gen, this.offsets);
    const stats = pokemonData.readBaseStats(pokemonId);
    return stats.hp + stats.attack + stats.defense + 
           stats.speed + stats.spAttack + stats.spDefense;
  }
  
  readPointer(offset) {
    const ptr = this.rom[offset] | 
                (this.rom[offset + 1] << 8) | 
                (this.rom[offset + 2] << 16) | 
                (this.rom[offset + 3] << 24);
    return ptr >= 0x08000000 ? ptr - 0x08000000 : 0;
  }
}
```

---

## 9. Trainer & Gym Leader Enhancement

### Trainer Enhancement System

```javascript
class TrainerEnhancer {
  constructor(rom, gen, offsets) {
    this.rom = rom;
    this.gen = gen;
    this.offsets = offsets;
  }
  
  /**
   * Important trainers (Gym Leaders, Elite 4, Champion, Rivals)
   */
  getImportantTrainers() {
    // These IDs vary by game
    const trainers = {
      firered: {
        gymLeaders: [414, 415, 416, 417, 418, 419, 420, 421], // Brock to Giovanni
        elite4: [410, 411, 412, 413],
        champion: [438],
        rival: [326, 327, 328, 329, 330, 331, 332, 333, 334], // Multiple battles
      },
      emerald: {
        gymLeaders: [265, 266, 267, 268, 269, 270, 271, 272],
        elite4: [261, 262, 263, 264],
        champion: [335],
        rival: [520, 521, 522, 523, 524],
      },
      // Add more games...
    };
    
    return trainers;
  }
  
  /**
   * Make gym leaders use full teams
   */
  expandGymLeaderTeams() {
    const important = this.getImportantTrainers();
    const results = { modified: [] };
    
    // Read current gym leader data
    for (const leaderId of important.gymLeaders || []) {
      const trainer = this.readTrainer(leaderId);
      
      // Expand team to 6 Pokemon if less
      if (trainer.partySize < 6) {
        // This requires careful handling - need to extend party data
        // May need to find free space in ROM
        results.modified.push({
          id: leaderId,
          originalSize: trainer.partySize,
          message: 'Team expansion requires ROM space allocation',
        });
      }
    }
    
    return results;
  }
  
  /**
   * Give trainers competitive movesets
   */
  improveTrainerMovesets() {
    if (this.gen < 3) {
      return { message: 'Custom movesets not available in Gen 1-2' };
    }
    
    const trainers = this.readAllTrainers();
    let modified = 0;
    
    for (const trainer of trainers) {
      // Check if trainer has custom moves flag
      if (!(trainer.partyFlags & 0x01)) continue;
      
      for (const pokemon of trainer.pokemon) {
        const goodMoves = this.getGoodMovesForPokemon(pokemon.species);
        
        // Write improved moveset
        for (let i = 0; i < 4 && i < goodMoves.length; i++) {
          this.writeU16(pokemon.movesOffset + (i * 2), goodMoves[i]);
        }
        
        modified++;
      }
    }
    
    return { pokemonModified: modified };
  }
  
  /**
   * Get good moves for a Pokemon based on its stats and type
   */
  getGoodMovesForPokemon(speciesId) {
    // This would ideally use a database of competitive moves
    // Simplified version - return STAB moves + coverage
    const pokemonData = new PokemonData(this.rom, this.gen, this.offsets);
    const stats = pokemonData.readBaseStats(speciesId);
    
    const goodMoves = [];
    
    // Placeholder - would need move database
    // Return generic good moves
    if (stats.attack > stats.spAttack) {
      goodMoves.push(89, 38, 157, 200); // Earthquake, Double-Edge, Rock Slide, Outrage
    } else {
      goodMoves.push(59, 85, 94, 58); // Blizzard, Thunderbolt, Psychic, Ice Beam
    }
    
    return goodMoves;
  }
  
  /**
   * Scale trainer levels progressively
   */
  progressiveScaling(startMultiplier = 1.0, endMultiplier = 1.5) {
    const trainers = this.readAllTrainers();
    
    // Sort by average level to determine progression
    trainers.sort((a, b) => {
      const avgA = a.pokemon.reduce((s, p) => s + p.level, 0) / a.pokemon.length;
      const avgB = b.pokemon.reduce((s, p) => s + p.level, 0) / b.pokemon.length;
      return avgA - avgB;
    });
    
    let modified = 0;
    
    trainers.forEach((trainer, index) => {
      // Calculate multiplier based on position
      const progress = index / trainers.length;
      const multiplier = startMultiplier + (endMultiplier - startMultiplier) * progress;
      
      for (const pokemon of trainer.pokemon) {
        const newLevel = Math.min(100, Math.floor(pokemon.level * multiplier));
        this.writeTrainerPokemonLevel(pokemon.offset, newLevel);
        modified++;
      }
    });
    
    return { trainersModified: trainers.length, pokemonModified: modified };
  }
}
```

---

## 10. Implementation Guide

### React Component Architecture

```
src/
├── components/
│   ├── ROMEditor/
│   │   ├── ROMEditor.jsx           # Main container
│   │   ├── ROMUploader.jsx         # File upload + detection
│   │   ├── GameInfo.jsx            # Display game info
│   │   └── DownloadButton.jsx      # Export modified ROM
│   │
│   ├── Tabs/
│   │   ├── WildPokemonTab.jsx      # Encounter editor
│   │   ├── TrainerTab.jsx          # Trainer editor
│   │   ├── PokemonStatsTab.jsx     # Base stat editor
│   │   ├── RandomizerTab.jsx       # Quick randomization
│   │   ├── DifficultyTab.jsx       # Difficulty presets
│   │   └── StarterTab.jsx          # Starter selection
│   │
│   ├── Pokemon/
│   │   ├── PokemonSelector.jsx     # Pokemon dropdown/search
│   │   ├── PokemonCard.jsx         # Pokemon display card
│   │   ├── StatEditor.jsx          # Individual stat editor
│   │   ├── StatBar.jsx             # Visual stat bar
│   │   └── TypeBadge.jsx           # Type display
│   │
│   └── common/
│       ├── Tabs.jsx
│       ├── Modal.jsx
│       ├── Slider.jsx
│       └── Tooltip.jsx
│
├── utils/
│   ├── rom/
│   │   ├── detector.js             # ROM detection
│   │   ├── reader.js               # Binary reading utilities
│   │   ├── writer.js               # Binary writing utilities
│   │   └── narc.js                 # NDS NARC file handling
│   │
│   ├── pokemon/
│   │   ├── data.js                 # Pokemon data handler
│   │   ├── stats.js                # Stat calculations
│   │   ├── types.js                # Type handling
│   │   └── natures.js              # Nature handling (Gen 3+)
│   │
│   ├── randomizer/
│   │   ├── encounters.js           # Wild encounter randomizer
│   │   ├── trainers.js             # Trainer randomizer
│   │   ├── starters.js             # Starter randomizer
│   │   └── moves.js                # Move randomizer
│   │
│   └── difficulty/
│       ├── scaling.js              # Level scaling
│       ├── presets.js              # Difficulty presets
│       └── ai.js                   # AI improvements
│
├── data/
│   ├── pokemon/
│   │   ├── gen1.json               # Gen 1 Pokemon data
│   │   ├── gen2.json
│   │   ├── gen3.json
│   │   ├── gen4.json
│   │   └── gen5.json
│   │
│   ├── moves/
│   │   ├── gen1.json
│   │   ├── gen2.json
│   │   └── ...
│   │
│   ├── offsets/
│   │   ├── firered.json
│   │   ├── emerald.json
│   │   ├── platinum.json
│   │   └── ...
│   │
│   └── items/
│       └── ...
│
└── hooks/
    ├── useROM.js                   # ROM state management
    ├── usePokemon.js               # Pokemon data access
    └── useRandomizer.js            # Randomizer state
```

### State Management Pattern

```javascript
// useROM.js - Custom hook for ROM management
import { useState, useCallback } from 'react';
import { ROMDetector } from '../utils/rom/detector';

export function useROM() {
  const [rom, setROM] = useState(null);
  const [romInfo, setROMInfo] = useState(null);
  const [offsets, setOffsets] = useState(null);
  const [modified, setModified] = useState(false);
  const [history, setHistory] = useState([]);
  
  const loadROM = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    const detector = new ROMDetector(data);
    const info = detector.detect();
    
    if (!info.valid) {
      throw new Error('Unsupported ROM format');
    }
    
    // Load offsets for detected game
    const gameOffsets = await import(`../data/offsets/${info.gameCode.toLowerCase()}.json`);
    
    setROM(data);
    setROMInfo(info);
    setOffsets(gameOffsets.default);
    setModified(false);
    setHistory([]);
    
    return info;
  }, []);
  
  const modifyROM = useCallback((modification) => {
    if (!rom) return;
    
    // Save to history for undo
    setHistory(prev => [...prev, new Uint8Array(rom)]);
    
    // Apply modification
    const newROM = new Uint8Array(rom);
    modification(newROM);
    
    setROM(newROM);
    setModified(true);
  }, [rom]);
  
  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setROM(previous);
  }, [history]);
  
  const downloadROM = useCallback(() => {
    if (!rom || !romInfo) return;
    
    const blob = new Blob([rom], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${romInfo.name}_Modified.${romInfo.platform.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }, [rom, romInfo]);
  
  return {
    rom,
    romInfo,
    offsets,
    modified,
    canUndo: history.length > 0,
    loadROM,
    modifyROM,
    undo,
    downloadROM,
  };
}
```

---

## 11. UI Component Specifications

### Main Editor Layout

```jsx
// ROMEditor.jsx
export default function ROMEditor() {
  const { rom, romInfo, offsets, loadROM, modifyROM, downloadROM } = useROM();
  const [activeTab, setActiveTab] = useState('info');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-xl">
              🎮
            </div>
            <div>
              <h1 className="font-bold text-lg">Universal Pokemon ROM Editor</h1>
              <p className="text-slate-400 text-sm">Gen 1-5 Support</p>
            </div>
          </div>
          
          {romInfo && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {romInfo.name} ({romInfo.platform})
              </span>
              <button
                onClick={downloadROM}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium"
              >
                💾 Download ROM
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {!rom ? (
          <ROMUploader onLoad={loadROM} />
        ) : (
          <>
            {/* Tab Navigation */}
            <nav className="flex gap-1 bg-slate-800/50 p-1 rounded-lg mb-4">
              {[
                { id: 'info', label: 'Game Info', icon: 'ℹ️' },
                { id: 'wild', label: 'Wild Pokemon', icon: '🌿' },
                { id: 'trainers', label: 'Trainers', icon: '👤' },
                { id: 'stats', label: 'Pokemon Stats', icon: '📊' },
                { id: 'randomizer', label: 'Randomizer', icon: '🎲' },
                { id: 'difficulty', label: 'Difficulty', icon: '💪' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
            
            {/* Tab Content */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              {activeTab === 'info' && <GameInfoTab romInfo={romInfo} />}
              {activeTab === 'wild' && <WildPokemonTab rom={rom} offsets={offsets} onModify={modifyROM} />}
              {activeTab === 'trainers' && <TrainerTab rom={rom} offsets={offsets} onModify={modifyROM} />}
              {activeTab === 'stats' && <PokemonStatsTab rom={rom} offsets={offsets} onModify={modifyROM} />}
              {activeTab === 'randomizer' && <RandomizerTab rom={rom} offsets={offsets} onModify={modifyROM} />}
              {activeTab === 'difficulty' && <DifficultyTab rom={rom} offsets={offsets} onModify={modifyROM} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

### Stat Optimizer UI

```jsx
// PokemonStatsTab.jsx
function PokemonStatsTab({ rom, offsets, onModify }) {
  const [selectedPokemon, setSelectedPokemon] = useState(1);
  const [stats, setStats] = useState(null);
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [level, setLevel] = useState(100);
  
  useEffect(() => {
    if (!rom || !offsets) return;
    
    const pokemonData = new PokemonData(rom, offsets.gen, offsets);
    const baseStats = pokemonData.readBaseStats(selectedPokemon);
    setStats(baseStats);
    
    // Calculate perfect and minimum stats
    const optimizer = new StatOptimizer(rom, offsets.gen, offsets);
    setCalculatedStats({
      perfect: optimizer.calculatePerfectStats(selectedPokemon, level),
      minimum: optimizer.calculateMinStats(selectedPokemon, level),
    });
  }, [rom, offsets, selectedPokemon, level]);
  
  const handleStatChange = (stat, value) => {
    const newStats = { ...stats, [stat]: value };
    setStats(newStats);
  };
  
  const applyChanges = () => {
    onModify((romData) => {
      const pokemonData = new PokemonData(romData, offsets.gen, offsets);
      pokemonData.writeBaseStats(selectedPokemon, stats);
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Pokemon Selector */}
      <div className="flex gap-4">
        <PokemonSelector
          value={selectedPokemon}
          onChange={setSelectedPokemon}
          gen={offsets.gen}
        />
        
        <div>
          <label className="block text-sm text-slate-400 mb-1">Level</label>
          <input
            type="number"
            min="1"
            max="100"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 100)}
            className="w-20 px-3 py-2 bg-slate-700 rounded-lg"
          />
        </div>
      </div>
      
      {stats && (
        <>
          {/* Base Stats Editor */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'].map(stat => (
              <StatEditor
                key={stat}
                label={stat.toUpperCase()}
                value={stats[stat]}
                onChange={(v) => handleStatChange(stat, v)}
                color={STAT_COLORS[stat]}
              />
            ))}
          </div>
          
          <div className="text-center text-lg font-bold">
            BST: {stats.hp + stats.attack + stats.defense + stats.spAttack + stats.spDefense + stats.speed}
          </div>
          
          {/* Calculated Stats Display */}
          {calculatedStats && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/50">
                <h4 className="font-bold text-green-400 mb-2">Perfect Stats (Lv.{level})</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(calculatedStats.perfect).map(([stat, value]) => (
                    <div key={stat} className="bg-slate-800/50 rounded px-2 py-1">
                      <span className="text-slate-400">{stat}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-red-900/30 rounded-lg p-4 border border-red-700/50">
                <h4 className="font-bold text-red-400 mb-2">Minimum Stats (Lv.{level})</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(calculatedStats.minimum).map(([stat, value]) => (
                    <div key={stat} className="bg-slate-800/50 rounded px-2 py-1">
                      <span className="text-slate-400">{stat}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStats({ ...stats, hp: 255, attack: 255, defense: 255, spAttack: 255, spDefense: 255, speed: 255 })}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium"
            >
              ⭐ Max All Stats
            </button>
            <button
              onClick={() => setStats({ ...stats, hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 })}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium"
            >
              💀 Min All Stats
            </button>
            <button
              onClick={applyChanges}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium"
            >
              ✓ Apply Changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Version History

- **v2.0** - Multi-generation support (Gen 1-5)
  - Universal ROM detection
  - Generation-specific offset tables
  - Unified stat calculation
  - Perfect/minimum stat calculator
  - Difficulty presets
  - Trainer enhancement system
  - NDS NARC file support (Gen 4-5)

---

## Legal Notice

This specification is for educational purposes only. Users must:
- Own legitimate copies of games they modify
- Not distribute copyrighted ROM files
- Comply with local laws regarding ROM modification
- Use modifications for personal use only
