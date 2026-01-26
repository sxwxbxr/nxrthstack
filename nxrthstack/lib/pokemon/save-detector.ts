/**
 * Pokemon Save File Detector
 * Detects and parses save files for Gen 1-3 Pokemon games
 */

export interface SaveInfo {
  generation: 1 | 2 | 3;
  game: string;
  gameCode: string;
  platform: "GB" | "GBC" | "GBA";
  fileSize: number;
  isValid: boolean;
  trainerName: string;
  trainerId: number;
  playTime: { hours: number; minutes: number; seconds: number };
  money: number;
  badges: number;
}

export interface Pokemon {
  species: number;
  speciesName: string;
  nickname: string;
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  special?: number; // Gen 1-2
  spAttack?: number; // Gen 3
  spDefense?: number; // Gen 3
  moves: number[];
  movePP: number[];
  exp: number;
  evs: { hp: number; attack: number; defense: number; speed: number; special?: number; spAttack?: number; spDefense?: number };
  ivs: { hp: number; attack: number; defense: number; speed: number; special?: number; spAttack?: number; spDefense?: number };
  heldItem?: number; // Gen 2-3
  otId: number;
  otName: string;
  isShiny?: boolean; // Gen 2-3
  nature?: number; // Gen 3
  ability?: number; // Gen 3
}

export interface InventoryItem {
  itemId: number;
  itemName: string;
  quantity: number;
}

export interface SaveData {
  info: SaveInfo;
  party: Pokemon[];
  boxes: Pokemon[][];
  inventory: {
    items: InventoryItem[];
    keyItems: InventoryItem[];
    pokeballs: InventoryItem[];
    tmHm: InventoryItem[];
  };
  pokedex: {
    seen: number[];
    caught: number[];
  };
}

// Gen 1 character encoding table
const GEN1_CHAR_TABLE: Record<number, string> = {
  0x80: "A", 0x81: "B", 0x82: "C", 0x83: "D", 0x84: "E",
  0x85: "F", 0x86: "G", 0x87: "H", 0x88: "I", 0x89: "J",
  0x8A: "K", 0x8B: "L", 0x8C: "M", 0x8D: "N", 0x8E: "O",
  0x8F: "P", 0x90: "Q", 0x91: "R", 0x92: "S", 0x93: "T",
  0x94: "U", 0x95: "V", 0x96: "W", 0x97: "X", 0x98: "Y",
  0x99: "Z", 0x9A: "(", 0x9B: ")", 0x9C: ":", 0x9D: ";",
  0x9E: "[", 0x9F: "]",
  0xA0: "a", 0xA1: "b", 0xA2: "c", 0xA3: "d", 0xA4: "e",
  0xA5: "f", 0xA6: "g", 0xA7: "h", 0xA8: "i", 0xA9: "j",
  0xAA: "k", 0xAB: "l", 0xAC: "m", 0xAD: "n", 0xAE: "o",
  0xAF: "p", 0xB0: "q", 0xB1: "r", 0xB2: "s", 0xB3: "t",
  0xB4: "u", 0xB5: "v", 0xB6: "w", 0xB7: "x", 0xB8: "y",
  0xB9: "z",
  0xE0: "'", 0xE3: "-", 0xE6: "?", 0xE7: "!", 0xE8: ".",
  0xEF: "♂", 0xF5: "♀",
  0xF6: "0", 0xF7: "1", 0xF8: "2", 0xF9: "3", 0xFA: "4",
  0xFB: "5", 0xFC: "6", 0xFD: "7", 0xFE: "8", 0xFF: "9",
  0x50: "", // Terminator
  0x7F: " ",
};

// Reverse mapping for encoding
const GEN1_CHAR_REVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(GEN1_CHAR_TABLE).map(([k, v]) => [v, parseInt(k)])
);

// Gen 3 character encoding table
const GEN3_CHAR_TABLE: Record<number, string> = {
  0x00: " ", 0x01: "À", 0x02: "Á", 0x03: "Â", 0x04: "Ç",
  0x05: "È", 0x06: "É", 0x07: "Ê", 0x08: "Ë", 0x09: "Ì",
  0xBB: "A", 0xBC: "B", 0xBD: "C", 0xBE: "D", 0xBF: "E",
  0xC0: "F", 0xC1: "G", 0xC2: "H", 0xC3: "I", 0xC4: "J",
  0xC5: "K", 0xC6: "L", 0xC7: "M", 0xC8: "N", 0xC9: "O",
  0xCA: "P", 0xCB: "Q", 0xCC: "R", 0xCD: "S", 0xCE: "T",
  0xCF: "U", 0xD0: "V", 0xD1: "W", 0xD2: "X", 0xD3: "Y",
  0xD4: "Z",
  0xD5: "a", 0xD6: "b", 0xD7: "c", 0xD8: "d", 0xD9: "e",
  0xDA: "f", 0xDB: "g", 0xDC: "h", 0xDD: "i", 0xDE: "j",
  0xDF: "k", 0xE0: "l", 0xE1: "m", 0xE2: "n", 0xE3: "o",
  0xE4: "p", 0xE5: "q", 0xE6: "r", 0xE7: "s", 0xE8: "t",
  0xE9: "u", 0xEA: "v", 0xEB: "w", 0xEC: "x", 0xED: "y",
  0xEE: "z",
  0xA1: "0", 0xA2: "1", 0xA3: "2", 0xA4: "3", 0xA5: "4",
  0xA6: "5", 0xA7: "6", 0xA8: "7", 0xA9: "8", 0xAA: "9",
  0xAB: "!", 0xAC: "?", 0xAD: ".", 0xAE: "-",
  0xB0: "...", 0xB1: "\"", 0xB2: "\"", 0xB3: "'", 0xB4: "'",
  0xB5: "M", 0xB6: "F", 0xFF: "", // Terminator
};

const GEN3_CHAR_REVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(GEN3_CHAR_TABLE).map(([k, v]) => [v, parseInt(k)])
);

// Pokemon species names (Gen 1-3)
export const POKEMON_NAMES: Record<number, string> = {
  0: "???",
  1: "Bulbasaur", 2: "Ivysaur", 3: "Venusaur", 4: "Charmander", 5: "Charmeleon",
  6: "Charizard", 7: "Squirtle", 8: "Wartortle", 9: "Blastoise", 10: "Caterpie",
  11: "Metapod", 12: "Butterfree", 13: "Weedle", 14: "Kakuna", 15: "Beedrill",
  16: "Pidgey", 17: "Pidgeotto", 18: "Pidgeot", 19: "Rattata", 20: "Raticate",
  21: "Spearow", 22: "Fearow", 23: "Ekans", 24: "Arbok", 25: "Pikachu",
  26: "Raichu", 27: "Sandshrew", 28: "Sandslash", 29: "Nidoran♀", 30: "Nidorina",
  31: "Nidoqueen", 32: "Nidoran♂", 33: "Nidorino", 34: "Nidoking", 35: "Clefairy",
  36: "Clefable", 37: "Vulpix", 38: "Ninetales", 39: "Jigglypuff", 40: "Wigglytuff",
  41: "Zubat", 42: "Golbat", 43: "Oddish", 44: "Gloom", 45: "Vileplume",
  46: "Paras", 47: "Parasect", 48: "Venonat", 49: "Venomoth", 50: "Diglett",
  51: "Dugtrio", 52: "Meowth", 53: "Persian", 54: "Psyduck", 55: "Golduck",
  56: "Mankey", 57: "Primeape", 58: "Growlithe", 59: "Arcanine", 60: "Poliwag",
  61: "Poliwhirl", 62: "Poliwrath", 63: "Abra", 64: "Kadabra", 65: "Alakazam",
  66: "Machop", 67: "Machoke", 68: "Machamp", 69: "Bellsprout", 70: "Weepinbell",
  71: "Victreebel", 72: "Tentacool", 73: "Tentacruel", 74: "Geodude", 75: "Graveler",
  76: "Golem", 77: "Ponyta", 78: "Rapidash", 79: "Slowpoke", 80: "Slowbro",
  81: "Magnemite", 82: "Magneton", 83: "Farfetch'd", 84: "Doduo", 85: "Dodrio",
  86: "Seel", 87: "Dewgong", 88: "Grimer", 89: "Muk", 90: "Shellder",
  91: "Cloyster", 92: "Gastly", 93: "Haunter", 94: "Gengar", 95: "Onix",
  96: "Drowzee", 97: "Hypno", 98: "Krabby", 99: "Kingler", 100: "Voltorb",
  101: "Electrode", 102: "Exeggcute", 103: "Exeggutor", 104: "Cubone", 105: "Marowak",
  106: "Hitmonlee", 107: "Hitmonchan", 108: "Lickitung", 109: "Koffing", 110: "Weezing",
  111: "Rhyhorn", 112: "Rhydon", 113: "Chansey", 114: "Tangela", 115: "Kangaskhan",
  116: "Horsea", 117: "Seadra", 118: "Goldeen", 119: "Seaking", 120: "Staryu",
  121: "Starmie", 122: "Mr. Mime", 123: "Scyther", 124: "Jynx", 125: "Electabuzz",
  126: "Magmar", 127: "Pinsir", 128: "Tauros", 129: "Magikarp", 130: "Gyarados",
  131: "Lapras", 132: "Ditto", 133: "Eevee", 134: "Vaporeon", 135: "Jolteon",
  136: "Flareon", 137: "Porygon", 138: "Omanyte", 139: "Omastar", 140: "Kabuto",
  141: "Kabutops", 142: "Aerodactyl", 143: "Snorlax", 144: "Articuno", 145: "Zapdos",
  146: "Moltres", 147: "Dratini", 148: "Dragonair", 149: "Dragonite", 150: "Mewtwo",
  151: "Mew",
  // Gen 2
  152: "Chikorita", 153: "Bayleef", 154: "Meganium", 155: "Cyndaquil", 156: "Quilava",
  157: "Typhlosion", 158: "Totodile", 159: "Croconaw", 160: "Feraligatr", 161: "Sentret",
  162: "Furret", 163: "Hoothoot", 164: "Noctowl", 165: "Ledyba", 166: "Ledian",
  167: "Spinarak", 168: "Ariados", 169: "Crobat", 170: "Chinchou", 171: "Lanturn",
  172: "Pichu", 173: "Cleffa", 174: "Igglybuff", 175: "Togepi", 176: "Togetic",
  177: "Natu", 178: "Xatu", 179: "Mareep", 180: "Flaaffy", 181: "Ampharos",
  182: "Bellossom", 183: "Marill", 184: "Azumarill", 185: "Sudowoodo", 186: "Politoed",
  187: "Hoppip", 188: "Skiploom", 189: "Jumpluff", 190: "Aipom", 191: "Sunkern",
  192: "Sunflora", 193: "Yanma", 194: "Wooper", 195: "Quagsire", 196: "Espeon",
  197: "Umbreon", 198: "Murkrow", 199: "Slowking", 200: "Misdreavus", 201: "Unown",
  202: "Wobbuffet", 203: "Girafarig", 204: "Pineco", 205: "Forretress", 206: "Dunsparce",
  207: "Gligar", 208: "Steelix", 209: "Snubbull", 210: "Granbull", 211: "Qwilfish",
  212: "Scizor", 213: "Shuckle", 214: "Heracross", 215: "Sneasel", 216: "Teddiursa",
  217: "Ursaring", 218: "Slugma", 219: "Magcargo", 220: "Swinub", 221: "Piloswine",
  222: "Corsola", 223: "Remoraid", 224: "Octillery", 225: "Delibird", 226: "Mantine",
  227: "Skarmory", 228: "Houndour", 229: "Houndoom", 230: "Kingdra", 231: "Phanpy",
  232: "Donphan", 233: "Porygon2", 234: "Stantler", 235: "Smeargle", 236: "Tyrogue",
  237: "Hitmontop", 238: "Smoochum", 239: "Elekid", 240: "Magby", 241: "Miltank",
  242: "Blissey", 243: "Raikou", 244: "Entei", 245: "Suicune", 246: "Larvitar",
  247: "Pupitar", 248: "Tyranitar", 249: "Lugia", 250: "Ho-Oh", 251: "Celebi",
  // Gen 3
  252: "Treecko", 253: "Grovyle", 254: "Sceptile", 255: "Torchic", 256: "Combusken",
  257: "Blaziken", 258: "Mudkip", 259: "Marshtomp", 260: "Swampert", 261: "Poochyena",
  262: "Mightyena", 263: "Zigzagoon", 264: "Linoone", 265: "Wurmple", 266: "Silcoon",
  267: "Beautifly", 268: "Cascoon", 269: "Dustox", 270: "Lotad", 271: "Lombre",
  272: "Ludicolo", 273: "Seedot", 274: "Nuzleaf", 275: "Shiftry", 276: "Taillow",
  277: "Swellow", 278: "Wingull", 279: "Pelipper", 280: "Ralts", 281: "Kirlia",
  282: "Gardevoir", 283: "Surskit", 284: "Masquerain", 285: "Shroomish", 286: "Breloom",
  287: "Slakoth", 288: "Vigoroth", 289: "Slaking", 290: "Nincada", 291: "Ninjask",
  292: "Shedinja", 293: "Whismur", 294: "Loudred", 295: "Exploud", 296: "Makuhita",
  297: "Hariyama", 298: "Azurill", 299: "Nosepass", 300: "Skitty", 301: "Delcatty",
  302: "Sableye", 303: "Mawile", 304: "Aron", 305: "Lairon", 306: "Aggron",
  307: "Meditite", 308: "Medicham", 309: "Electrike", 310: "Manectric", 311: "Plusle",
  312: "Minun", 313: "Volbeat", 314: "Illumise", 315: "Roselia", 316: "Gulpin",
  317: "Swalot", 318: "Carvanha", 319: "Sharpedo", 320: "Wailmer", 321: "Wailord",
  322: "Numel", 323: "Camerupt", 324: "Torkoal", 325: "Spoink", 326: "Grumpig",
  327: "Spinda", 328: "Trapinch", 329: "Vibrava", 330: "Flygon", 331: "Cacnea",
  332: "Cacturne", 333: "Swablu", 334: "Altaria", 335: "Zangoose", 336: "Seviper",
  337: "Lunatone", 338: "Solrock", 339: "Barboach", 340: "Whiscash", 341: "Corphish",
  342: "Crawdaunt", 343: "Baltoy", 344: "Claydol", 345: "Lileep", 346: "Cradily",
  347: "Anorith", 348: "Armaldo", 349: "Feebas", 350: "Milotic", 351: "Castform",
  352: "Kecleon", 353: "Shuppet", 354: "Banette", 355: "Duskull", 356: "Dusclops",
  357: "Tropius", 358: "Chimecho", 359: "Absol", 360: "Wynaut", 361: "Snorunt",
  362: "Glalie", 363: "Spheal", 364: "Sealeo", 365: "Walrein", 366: "Clamperl",
  367: "Huntail", 368: "Gorebyss", 369: "Relicanth", 370: "Luvdisc", 371: "Bagon",
  372: "Shelgon", 373: "Salamence", 374: "Beldum", 375: "Metang", 376: "Metagross",
  377: "Regirock", 378: "Regice", 379: "Registeel", 380: "Latias", 381: "Latios",
  382: "Kyogre", 383: "Groudon", 384: "Rayquaza", 385: "Jirachi", 386: "Deoxys",
};

// Item names (Gen 3)
export const ITEM_NAMES: Record<number, string> = {
  0: "None",
  1: "Master Ball", 2: "Ultra Ball", 3: "Great Ball", 4: "Poké Ball",
  5: "Safari Ball", 6: "Net Ball", 7: "Dive Ball", 8: "Nest Ball",
  9: "Repeat Ball", 10: "Timer Ball", 11: "Luxury Ball", 12: "Premier Ball",
  13: "Potion", 14: "Antidote", 15: "Burn Heal", 16: "Ice Heal",
  17: "Awakening", 18: "Parlyz Heal", 19: "Full Restore", 20: "Max Potion",
  21: "Hyper Potion", 22: "Super Potion", 23: "Full Heal", 24: "Revive",
  25: "Max Revive", 26: "Fresh Water", 27: "Soda Pop", 28: "Lemonade",
  29: "Moomoo Milk", 30: "EnergyPowder", 31: "Energy Root", 32: "Heal Powder",
  33: "Revival Herb", 34: "Ether", 35: "Max Ether", 36: "Elixir",
  37: "Max Elixir", 38: "Lava Cookie", 39: "Blue Flute", 40: "Yellow Flute",
  41: "Red Flute", 42: "Black Flute", 43: "White Flute", 44: "Berry Juice",
  45: "Sacred Ash", 46: "Shoal Salt", 47: "Shoal Shell", 48: "Red Shard",
  49: "Blue Shard", 50: "Yellow Shard", 51: "Green Shard",
  // More items...
  63: "HP Up", 64: "Protein", 65: "Iron", 66: "Carbos", 67: "Calcium",
  68: "Rare Candy", 69: "PP Up", 70: "Zinc", 71: "PP Max",
  // TMs/HMs
  289: "TM01", 290: "TM02", 291: "TM03", 292: "TM04", 293: "TM05",
  294: "TM06", 295: "TM07", 296: "TM08", 297: "TM09", 298: "TM10",
  339: "HM01", 340: "HM02", 341: "HM03", 342: "HM04", 343: "HM05",
  344: "HM06", 345: "HM07", 346: "HM08",
};

// Move names
export const MOVE_NAMES: Record<number, string> = {
  0: "—", 1: "Pound", 2: "Karate Chop", 3: "Double Slap", 4: "Comet Punch",
  5: "Mega Punch", 6: "Pay Day", 7: "Fire Punch", 8: "Ice Punch", 9: "Thunder Punch",
  10: "Scratch", 11: "Vice Grip", 12: "Guillotine", 13: "Razor Wind", 14: "Swords Dance",
  15: "Cut", 16: "Gust", 17: "Wing Attack", 18: "Whirlwind", 19: "Fly",
  20: "Bind", 21: "Slam", 22: "Vine Whip", 23: "Stomp", 24: "Double Kick",
  25: "Mega Kick", 26: "Jump Kick", 27: "Rolling Kick", 28: "Sand Attack", 29: "Headbutt",
  30: "Horn Attack", 31: "Fury Attack", 32: "Horn Drill", 33: "Tackle", 34: "Body Slam",
  35: "Wrap", 36: "Take Down", 37: "Thrash", 38: "Double-Edge", 39: "Tail Whip",
  40: "Poison Sting", 41: "Twineedle", 42: "Pin Missile", 43: "Leer", 44: "Bite",
  45: "Growl", 46: "Roar", 47: "Sing", 48: "Supersonic", 49: "Sonic Boom",
  50: "Disable", 51: "Acid", 52: "Ember", 53: "Flamethrower", 54: "Mist",
  55: "Water Gun", 56: "Hydro Pump", 57: "Surf", 58: "Ice Beam", 59: "Blizzard",
  60: "Psybeam", 61: "Bubble Beam", 62: "Aurora Beam", 63: "Hyper Beam", 64: "Peck",
  65: "Drill Peck", 66: "Submission", 67: "Low Kick", 68: "Counter", 69: "Seismic Toss",
  70: "Strength", 71: "Absorb", 72: "Mega Drain", 73: "Leech Seed", 74: "Growth",
  75: "Razor Leaf", 76: "Solar Beam", 77: "Poison Powder", 78: "Stun Spore", 79: "Sleep Powder",
  80: "Petal Dance", 81: "String Shot", 82: "Dragon Rage", 83: "Fire Spin", 84: "Thunder Shock",
  85: "Thunderbolt", 86: "Thunder Wave", 87: "Thunder", 88: "Rock Throw", 89: "Earthquake",
  90: "Fissure", 91: "Dig", 92: "Toxic", 93: "Confusion", 94: "Psychic",
  95: "Hypnosis", 96: "Meditate", 97: "Agility", 98: "Quick Attack", 99: "Rage",
  100: "Teleport",
  // Continue with more moves as needed...
};

// Nature names (Gen 3)
export const NATURE_NAMES: string[] = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];

// Helper functions
function readU8(data: Uint8Array, offset: number): number {
  return data[offset];
}

function readU16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readU32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
}

function writeU8(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
}

function writeU16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >> 8) & 0xFF;
}

function writeU32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >> 8) & 0xFF;
  data[offset + 2] = (value >> 16) & 0xFF;
  data[offset + 3] = (value >> 24) & 0xFF;
}

function decodeGen1String(data: Uint8Array, offset: number, maxLength: number): string {
  let result = "";
  for (let i = 0; i < maxLength; i++) {
    const byte = data[offset + i];
    if (byte === 0x50) break; // Terminator
    result += GEN1_CHAR_TABLE[byte] || "?";
  }
  return result;
}

function encodeGen1String(str: string, maxLength: number): Uint8Array {
  const result = new Uint8Array(maxLength);
  result.fill(0x50); // Fill with terminators
  for (let i = 0; i < Math.min(str.length, maxLength - 1); i++) {
    result[i] = GEN1_CHAR_REVERSE[str[i]] || 0x7F;
  }
  return result;
}

function decodeGen3String(data: Uint8Array, offset: number, maxLength: number): string {
  let result = "";
  for (let i = 0; i < maxLength; i++) {
    const byte = data[offset + i];
    if (byte === 0xFF) break; // Terminator
    result += GEN3_CHAR_TABLE[byte] || "?";
  }
  return result;
}

function encodeGen3String(str: string, maxLength: number): Uint8Array {
  const result = new Uint8Array(maxLength);
  result.fill(0xFF); // Fill with terminators
  for (let i = 0; i < Math.min(str.length, maxLength - 1); i++) {
    result[i] = GEN3_CHAR_REVERSE[str[i]] || 0x00;
  }
  return result;
}

/**
 * Detect save file type and basic info
 */
export function detectSave(data: Uint8Array): SaveInfo | null {
  const size = data.length;

  // Gen 1 save: 32KB
  if (size === 0x8000) {
    return detectGen1Save(data);
  }

  // Gen 2 save: 32KB
  if (size === 0x8000) {
    const gen2Result = detectGen2Save(data);
    if (gen2Result) return gen2Result;
  }

  // Gen 3 save: 128KB or 64KB (some emulators)
  if (size === 0x20000 || size === 0x10000) {
    return detectGen3Save(data);
  }

  return null;
}

function detectGen1Save(data: Uint8Array): SaveInfo | null {
  // Gen 1 save structure
  // Player name at 0x2598
  // Money at 0x25F3
  // Badges at 0x2602

  const trainerName = decodeGen1String(data, 0x2598, 11);
  if (!trainerName || trainerName.length === 0) return null;

  const trainerId = readU16LE(data, 0x2605);
  const money = (readU8(data, 0x25F3) * 10000) + (readU8(data, 0x25F4) * 100) + readU8(data, 0x25F5);
  const badges = readU8(data, 0x2602);
  const hours = readU8(data, 0x2CED);
  const minutes = readU8(data, 0x2CEE);
  const seconds = readU8(data, 0x2CEF);

  // Try to determine specific game
  let game = "Pokemon Red/Blue";
  let gameCode = "POKEMON RED";

  return {
    generation: 1,
    game,
    gameCode,
    platform: "GB",
    fileSize: data.length,
    isValid: true,
    trainerName,
    trainerId,
    playTime: { hours, minutes, seconds },
    money,
    badges,
  };
}

function detectGen2Save(data: Uint8Array): SaveInfo | null {
  // Gen 2 uses different offsets
  // Try Crystal offsets first, then Gold/Silver
  const trainerName = decodeGen1String(data, 0x200B, 11);
  if (!trainerName || trainerName.length === 0) return null;

  const trainerId = readU16LE(data, 0x2009);
  const money = readU32LE(data, 0x23DB) & 0xFFFFFF;
  const badges = readU16LE(data, 0x23E5);
  const hours = readU8(data, 0x2054);
  const minutes = readU8(data, 0x2055);
  const seconds = readU8(data, 0x2056);

  return {
    generation: 2,
    game: "Pokemon Gold/Silver/Crystal",
    gameCode: "POKEMON GOLD",
    platform: "GBC",
    fileSize: data.length,
    isValid: true,
    trainerName,
    trainerId,
    playTime: { hours, minutes, seconds },
    money,
    badges: badges & 0xFF,
  };
}

function detectGen3Save(data: Uint8Array): SaveInfo | null {
  // Gen 3 saves have two save slots, each 57344 bytes (0xE000)
  // The active save is determined by the save index
  // Section 0 contains trainer info

  // Find the most recent save
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);

  const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

  // Read section order to find trainer data (section ID 0)
  let trainerSectionOffset = -1;
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    if (sectionId === 0) {
      trainerSectionOffset = sectionOffset;
      break;
    }
  }

  if (trainerSectionOffset === -1) return null;

  const trainerName = decodeGen3String(data, trainerSectionOffset, 7);
  if (!trainerName || trainerName.length === 0) return null;

  const trainerId = readU16LE(data, trainerSectionOffset + 0xA);
  const secretId = readU16LE(data, trainerSectionOffset + 0xC);
  const hours = readU16LE(data, trainerSectionOffset + 0xE);
  const minutes = readU8(data, trainerSectionOffset + 0x10);
  const seconds = readU8(data, trainerSectionOffset + 0x11);

  // Game code at offset 0xAC
  const gameCode = readU32LE(data, trainerSectionOffset + 0xAC);

  // Determine game from code
  let game = "Pokemon Ruby/Sapphire";
  let gameCodeStr = "AXVE";

  // Money is in section 1
  let money = 0;
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    if (sectionId === 1) {
      money = readU32LE(data, sectionOffset + 0x490);
      break;
    }
  }

  return {
    generation: 3,
    game,
    gameCode: gameCodeStr,
    platform: "GBA",
    fileSize: data.length,
    isValid: true,
    trainerName,
    trainerId,
    playTime: { hours, minutes, seconds },
    money,
    badges: 0, // Need to find badge offset
  };
}

/**
 * Parse full save data
 */
export function parseSave(data: Uint8Array): SaveData | null {
  const info = detectSave(data);
  if (!info) return null;

  if (info.generation === 3) {
    return parseGen3Save(data, info);
  }

  // Gen 1/2 parsing would go here
  return {
    info,
    party: [],
    boxes: [],
    inventory: {
      items: [],
      keyItems: [],
      pokeballs: [],
      tmHm: [],
    },
    pokedex: {
      seen: [],
      caught: [],
    },
  };
}

function parseGen3Save(data: Uint8Array, info: SaveInfo): SaveData {
  // Find active save and sections
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);
  const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

  // Build section map
  const sections: Record<number, number> = {};
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    sections[sectionId] = sectionOffset;
  }

  // Parse party Pokemon (section 1)
  const party: Pokemon[] = [];
  if (sections[1] !== undefined) {
    const partyCount = readU32LE(data, sections[1] + 0x234);
    for (let i = 0; i < Math.min(partyCount, 6); i++) {
      const pokemon = parseGen3Pokemon(data, sections[1] + 0x238 + (i * 100));
      if (pokemon) party.push(pokemon);
    }
  }

  // Parse PC boxes (sections 5-13)
  const boxes: Pokemon[][] = [];
  // PC data spans multiple sections - simplified for now

  // Parse inventory
  const inventory = {
    items: [] as InventoryItem[],
    keyItems: [] as InventoryItem[],
    pokeballs: [] as InventoryItem[],
    tmHm: [] as InventoryItem[],
  };

  if (sections[1] !== undefined) {
    // Items pocket
    for (let i = 0; i < 30; i++) {
      const itemId = readU16LE(data, sections[1] + 0x560 + (i * 4));
      const quantity = readU16LE(data, sections[1] + 0x562 + (i * 4));
      if (itemId > 0) {
        inventory.items.push({
          itemId,
          itemName: ITEM_NAMES[itemId] || `Item ${itemId}`,
          quantity,
        });
      }
    }

    // Key items
    for (let i = 0; i < 30; i++) {
      const itemId = readU16LE(data, sections[1] + 0x5D8 + (i * 4));
      const quantity = readU16LE(data, sections[1] + 0x5DA + (i * 4));
      if (itemId > 0) {
        inventory.keyItems.push({
          itemId,
          itemName: ITEM_NAMES[itemId] || `Item ${itemId}`,
          quantity,
        });
      }
    }

    // Poke Balls
    for (let i = 0; i < 16; i++) {
      const itemId = readU16LE(data, sections[1] + 0x650 + (i * 4));
      const quantity = readU16LE(data, sections[1] + 0x652 + (i * 4));
      if (itemId > 0) {
        inventory.pokeballs.push({
          itemId,
          itemName: ITEM_NAMES[itemId] || `Item ${itemId}`,
          quantity,
        });
      }
    }
  }

  return {
    info,
    party,
    boxes,
    inventory,
    pokedex: {
      seen: [],
      caught: [],
    },
  };
}

function parseGen3Pokemon(data: Uint8Array, offset: number): Pokemon | null {
  const personality = readU32LE(data, offset);
  const otId = readU32LE(data, offset + 4);

  if (personality === 0 && otId === 0) return null;

  const nickname = decodeGen3String(data, offset + 8, 10);
  const otName = decodeGen3String(data, offset + 20, 7);

  // Decrypt substructure data
  const key = personality ^ otId;
  const substructOrder = personality % 24;

  // Read encrypted data
  const encryptedData = new Uint8Array(48);
  for (let i = 0; i < 48; i++) {
    encryptedData[i] = data[offset + 32 + i];
  }

  // Decrypt
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(encryptedData, i);
    const decrypted = encrypted ^ key;
    writeU32LE(encryptedData, i, decrypted);
  }

  // Substructure order determines data layout
  const substructOffsets = getSubstructOrder(substructOrder);

  // Growth substructure
  const growthOffset = substructOffsets[0] * 12;
  const species = readU16LE(encryptedData, growthOffset);
  const heldItem = readU16LE(encryptedData, growthOffset + 2);
  const exp = readU32LE(encryptedData, growthOffset + 4);

  // Attacks substructure
  const attacksOffset = substructOffsets[1] * 12;
  const moves = [
    readU16LE(encryptedData, attacksOffset),
    readU16LE(encryptedData, attacksOffset + 2),
    readU16LE(encryptedData, attacksOffset + 4),
    readU16LE(encryptedData, attacksOffset + 6),
  ];
  const movePP = [
    readU8(encryptedData, attacksOffset + 8),
    readU8(encryptedData, attacksOffset + 9),
    readU8(encryptedData, attacksOffset + 10),
    readU8(encryptedData, attacksOffset + 11),
  ];

  // EVs & Condition substructure
  const evsOffset = substructOffsets[2] * 12;
  const evs = {
    hp: readU8(encryptedData, evsOffset),
    attack: readU8(encryptedData, evsOffset + 1),
    defense: readU8(encryptedData, evsOffset + 2),
    speed: readU8(encryptedData, evsOffset + 3),
    spAttack: readU8(encryptedData, evsOffset + 4),
    spDefense: readU8(encryptedData, evsOffset + 5),
  };

  // Misc substructure
  const miscOffset = substructOffsets[3] * 12;
  const ivData = readU32LE(encryptedData, miscOffset + 4);
  const ivs = {
    hp: ivData & 0x1F,
    attack: (ivData >> 5) & 0x1F,
    defense: (ivData >> 10) & 0x1F,
    speed: (ivData >> 15) & 0x1F,
    spAttack: (ivData >> 20) & 0x1F,
    spDefense: (ivData >> 25) & 0x1F,
  };

  // Read calculated stats from party data
  const level = readU8(data, offset + 84);
  const currentHp = readU16LE(data, offset + 86);
  const maxHp = readU16LE(data, offset + 88);
  const attack = readU16LE(data, offset + 90);
  const defense = readU16LE(data, offset + 92);
  const speed = readU16LE(data, offset + 94);
  const spAttack = readU16LE(data, offset + 96);
  const spDefense = readU16LE(data, offset + 98);

  const nature = personality % 25;
  const isShiny = ((otId >> 16) ^ (otId & 0xFFFF) ^ (personality >> 16) ^ (personality & 0xFFFF)) < 8;

  return {
    species,
    speciesName: POKEMON_NAMES[species] || `Pokemon ${species}`,
    nickname: nickname || POKEMON_NAMES[species] || "???",
    level,
    currentHp,
    maxHp,
    attack,
    defense,
    speed,
    spAttack,
    spDefense,
    moves,
    movePP,
    exp,
    evs,
    ivs,
    heldItem,
    otId: otId & 0xFFFF,
    otName,
    isShiny,
    nature,
  };
}

// Substructure order lookup table
function getSubstructOrder(index: number): number[] {
  const orders = [
    [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
    [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
    [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
    [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
  ];
  return orders[index] || [0, 1, 2, 3];
}

/**
 * Modify trainer data in save
 */
export function setTrainerName(data: Uint8Array, name: string, generation: number): void {
  if (generation === 3) {
    const save1Index = readU32LE(data, 0x0FFC);
    const save2Index = readU32LE(data, 0xEFFC);
    const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

    for (let i = 0; i < 14; i++) {
      const sectionOffset = activeSaveOffset + (i * 0x1000);
      const sectionId = readU16LE(data, sectionOffset + 0xFF4);
      if (sectionId === 0) {
        const encoded = encodeGen3String(name, 7);
        for (let j = 0; j < 7; j++) {
          data[sectionOffset + j] = encoded[j];
        }
        // Update checksum
        updateGen3SectionChecksum(data, sectionOffset);
        break;
      }
    }
  }
}

export function setMoney(data: Uint8Array, amount: number, generation: number): void {
  if (generation === 3) {
    const save1Index = readU32LE(data, 0x0FFC);
    const save2Index = readU32LE(data, 0xEFFC);
    const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

    for (let i = 0; i < 14; i++) {
      const sectionOffset = activeSaveOffset + (i * 0x1000);
      const sectionId = readU16LE(data, sectionOffset + 0xFF4);
      if (sectionId === 1) {
        // Money is XOR encrypted with security key
        const securityKey = readU32LE(data, sectionOffset + 0xF20);
        writeU32LE(data, sectionOffset + 0x490, amount ^ securityKey);
        updateGen3SectionChecksum(data, sectionOffset);
        break;
      }
    }
  }
}

function updateGen3SectionChecksum(data: Uint8Array, sectionOffset: number): void {
  let checksum = 0;
  for (let i = 0; i < 0xFF4; i += 4) {
    checksum = (checksum + readU32LE(data, sectionOffset + i)) >>> 0;
  }
  checksum = ((checksum & 0xFFFF) + (checksum >>> 16)) & 0xFFFF;
  writeU16LE(data, sectionOffset + 0xFF6, checksum);
}

// Pokemon base stats for stat calculation
const BASE_STATS: Record<number, { hp: number; attack: number; defense: number; spAttack: number; spDefense: number; speed: number }> = {
  // Gen 1
  1: { hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
  2: { hp: 60, attack: 62, defense: 63, spAttack: 80, spDefense: 80, speed: 60 },
  3: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
  4: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
  5: { hp: 58, attack: 64, defense: 58, spAttack: 80, spDefense: 65, speed: 80 },
  6: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
  7: { hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
  8: { hp: 59, attack: 63, defense: 80, spAttack: 65, spDefense: 80, speed: 58 },
  9: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
  25: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
  26: { hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110 },
  // Add more base stats as needed - fallback uses generic values
};

// Generic base stats for Pokemon not in the lookup table
const DEFAULT_BASE_STATS = { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 };

// Nature stat modifiers: [stat_increased, stat_decreased] (0=none/neutral, 1=atk, 2=def, 3=spd, 4=spa, 5=spd)
const NATURE_MODIFIERS: Record<number, [number, number]> = {
  0: [0, 0],   // Hardy (neutral)
  1: [1, 2],   // Lonely (+Atk, -Def)
  2: [1, 3],   // Brave (+Atk, -Spd)
  3: [1, 4],   // Adamant (+Atk, -SpA)
  4: [1, 5],   // Naughty (+Atk, -SpD)
  5: [2, 1],   // Bold (+Def, -Atk)
  6: [0, 0],   // Docile (neutral)
  7: [2, 3],   // Relaxed (+Def, -Spd)
  8: [2, 4],   // Impish (+Def, -SpA)
  9: [2, 5],   // Lax (+Def, -SpD)
  10: [3, 1],  // Timid (+Spd, -Atk)
  11: [3, 2],  // Hasty (+Spd, -Def)
  12: [0, 0],  // Serious (neutral)
  13: [3, 4],  // Jolly (+Spd, -SpA)
  14: [3, 5],  // Naive (+Spd, -SpD)
  15: [4, 1],  // Modest (+SpA, -Atk)
  16: [4, 2],  // Mild (+SpA, -Def)
  17: [4, 3],  // Quiet (+SpA, -Spd)
  18: [0, 0],  // Bashful (neutral)
  19: [4, 5],  // Rash (+SpA, -SpD)
  20: [5, 1],  // Calm (+SpD, -Atk)
  21: [5, 2],  // Gentle (+SpD, -Def)
  22: [5, 3],  // Sassy (+SpD, -Spd)
  23: [5, 4],  // Careful (+SpD, -SpA)
  24: [0, 0],  // Quirky (neutral)
};

/**
 * Calculate a stat for Gen 3 Pokemon
 */
function calculateGen3Stat(
  baseStat: number,
  iv: number,
  ev: number,
  level: number,
  nature: number,
  statIndex: number // 0=hp, 1=atk, 2=def, 3=spd, 4=spa, 5=spd
): number {
  if (statIndex === 0) {
    // HP formula
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  } else {
    // Other stats formula
    let stat = Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5;

    // Apply nature modifier
    const [increased, decreased] = NATURE_MODIFIERS[nature] || [0, 0];
    if (statIndex === increased && increased !== 0) {
      stat = Math.floor(stat * 1.1);
    } else if (statIndex === decreased && decreased !== 0) {
      stat = Math.floor(stat * 0.9);
    }

    return stat;
  }
}

/**
 * Get active save offset and section map for Gen 3 save
 */
function getGen3SaveInfo(data: Uint8Array): { activeSaveOffset: number; sections: Record<number, number> } {
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);
  const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

  const sections: Record<number, number> = {};
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    sections[sectionId] = sectionOffset;
  }

  return { activeSaveOffset, sections };
}

/**
 * Encrypt/decrypt Gen 3 Pokemon substructure data
 */
function cryptGen3Substructure(data: Uint8Array, pokemonOffset: number, action: 'encrypt' | 'decrypt'): Uint8Array {
  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  const key = personality ^ otId;

  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i++) {
    substructure[i] = data[pokemonOffset + 32 + i];
  }

  // XOR with key
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(substructure, i, value ^ key);
  }

  return substructure;
}

/**
 * Write encrypted substructure back to Pokemon data
 */
function writeGen3Substructure(data: Uint8Array, pokemonOffset: number, substructure: Uint8Array): void {
  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  const key = personality ^ otId;

  // Encrypt and write back
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    const encrypted = value ^ key;
    writeU32LE(data, pokemonOffset + 32 + i, encrypted);
  }
}

/**
 * Set Pokemon IVs for Gen 3
 */
export function setGen3PokemonIVs(
  data: Uint8Array,
  partyIndex: number,
  ivs: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number }
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + 0x234);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + 0x238 + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const substructOffsets = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Misc substructure contains IVs
  const miscOffset = substructOffsets[3] * 12;

  // Read existing misc data (to preserve other bits like egg flag, ability)
  const existingMiscData = readU32LE(substructure, miscOffset + 4);
  const preservedBits = existingMiscData & 0xC0000000; // Preserve is_egg and ability bit

  // Pack IVs into 32-bit value (5 bits each)
  const ivData =
    (ivs.hp & 0x1F) |
    ((ivs.attack & 0x1F) << 5) |
    ((ivs.defense & 0x1F) << 10) |
    ((ivs.speed & 0x1F) << 15) |
    ((ivs.spAttack & 0x1F) << 20) |
    ((ivs.spDefense & 0x1F) << 25) |
    preservedBits;

  writeU32LE(substructure, miscOffset + 4, ivData);

  // Encrypt and write back
  writeGen3Substructure(data, pokemonOffset, substructure);

  // Update section checksum
  updateGen3SectionChecksum(data, sections[1]);

  return true;
}

/**
 * Set Pokemon EVs for Gen 3
 */
export function setGen3PokemonEVs(
  data: Uint8Array,
  partyIndex: number,
  evs: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number }
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + 0x234);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + 0x238 + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const substructOffsets = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // EVs & Condition substructure
  const evsOffset = substructOffsets[2] * 12;

  // Write EVs (clamp to 0-255 per stat)
  writeU8(substructure, evsOffset, Math.min(255, Math.max(0, evs.hp)));
  writeU8(substructure, evsOffset + 1, Math.min(255, Math.max(0, evs.attack)));
  writeU8(substructure, evsOffset + 2, Math.min(255, Math.max(0, evs.defense)));
  writeU8(substructure, evsOffset + 3, Math.min(255, Math.max(0, evs.speed)));
  writeU8(substructure, evsOffset + 4, Math.min(255, Math.max(0, evs.spAttack)));
  writeU8(substructure, evsOffset + 5, Math.min(255, Math.max(0, evs.spDefense)));

  // Encrypt and write back
  writeGen3Substructure(data, pokemonOffset, substructure);

  // Update section checksum
  updateGen3SectionChecksum(data, sections[1]);

  return true;
}

/**
 * Set Pokemon level and recalculate stats for Gen 3
 */
export function setGen3PokemonLevel(data: Uint8Array, partyIndex: number, level: number): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + 0x234);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + 0x238 + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const nature = personality % 25;
  const substructOrder = personality % 24;
  const substructOffsets = getSubstructOrder(substructOrder);

  // Decrypt to read species, IVs, EVs
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Read species from growth substructure
  const growthOffset = substructOffsets[0] * 12;
  const species = readU16LE(substructure, growthOffset);

  // Read EVs
  const evsOffset = substructOffsets[2] * 12;
  const evs = {
    hp: readU8(substructure, evsOffset),
    attack: readU8(substructure, evsOffset + 1),
    defense: readU8(substructure, evsOffset + 2),
    speed: readU8(substructure, evsOffset + 3),
    spAttack: readU8(substructure, evsOffset + 4),
    spDefense: readU8(substructure, evsOffset + 5),
  };

  // Read IVs
  const miscOffset = substructOffsets[3] * 12;
  const ivData = readU32LE(substructure, miscOffset + 4);
  const ivs = {
    hp: ivData & 0x1F,
    attack: (ivData >> 5) & 0x1F,
    defense: (ivData >> 10) & 0x1F,
    speed: (ivData >> 15) & 0x1F,
    spAttack: (ivData >> 20) & 0x1F,
    spDefense: (ivData >> 25) & 0x1F,
  };

  // Update experience based on level (using Medium Slow growth rate as default)
  // Exp = n^3 where n = level (simplified, actual formula varies by growth rate)
  const exp = Math.pow(level, 3);
  writeU32LE(substructure, growthOffset + 4, exp);

  // Write back substructure
  writeGen3Substructure(data, pokemonOffset, substructure);

  // Get base stats for species
  const baseStats = BASE_STATS[species] || DEFAULT_BASE_STATS;

  // Calculate and write new stats
  const clampedLevel = Math.min(100, Math.max(1, level));
  writeU8(data, pokemonOffset + 84, clampedLevel);

  const newMaxHp = calculateGen3Stat(baseStats.hp, ivs.hp, evs.hp, clampedLevel, nature, 0);
  const newAtk = calculateGen3Stat(baseStats.attack, ivs.attack, evs.attack, clampedLevel, nature, 1);
  const newDef = calculateGen3Stat(baseStats.defense, ivs.defense, evs.defense, clampedLevel, nature, 2);
  const newSpd = calculateGen3Stat(baseStats.speed, ivs.speed, evs.speed, clampedLevel, nature, 3);
  const newSpA = calculateGen3Stat(baseStats.spAttack, ivs.spAttack, evs.spAttack, clampedLevel, nature, 4);
  const newSpD = calculateGen3Stat(baseStats.spDefense, ivs.spDefense, evs.spDefense, clampedLevel, nature, 5);

  // Read current HP and cap it at new max
  const currentHp = Math.min(readU16LE(data, pokemonOffset + 86), newMaxHp);

  writeU16LE(data, pokemonOffset + 86, currentHp);
  writeU16LE(data, pokemonOffset + 88, newMaxHp);
  writeU16LE(data, pokemonOffset + 90, newAtk);
  writeU16LE(data, pokemonOffset + 92, newDef);
  writeU16LE(data, pokemonOffset + 94, newSpd);
  writeU16LE(data, pokemonOffset + 96, newSpA);
  writeU16LE(data, pokemonOffset + 98, newSpD);

  // Update section checksum
  updateGen3SectionChecksum(data, sections[1]);

  return true;
}

/**
 * Recalculate Pokemon stats based on current IVs, EVs, and level
 */
export function recalculateGen3Stats(data: Uint8Array, partyIndex: number): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + 0x234);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + 0x238 + (partyIndex * 100);
  const level = readU8(data, pokemonOffset + 84);

  return setGen3PokemonLevel(data, partyIndex, level);
}

/**
 * Set Pokemon to perfect legitimate stats (max IVs, optimal EVs, level 100)
 * EVs distribution: 252/252/6 split based on species strength
 */
export function setPerfectPokemon(
  data: Uint8Array,
  partyIndex: number,
  evDistribution?: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number }
): boolean {
  // Default competitive EV spread: 252 HP, 252 Speed, 6 SpDef (can be customized)
  const evs = evDistribution || {
    hp: 252,
    attack: 0,
    defense: 0,
    speed: 252,
    spAttack: 0,
    spDefense: 6,
  };

  // Max IVs for Gen 3 (31 each)
  const maxIVs = {
    hp: 31,
    attack: 31,
    defense: 31,
    speed: 31,
    spAttack: 31,
    spDefense: 31,
  };

  // Set IVs first
  if (!setGen3PokemonIVs(data, partyIndex, maxIVs)) return false;

  // Set EVs
  if (!setGen3PokemonEVs(data, partyIndex, evs)) return false;

  // Set level to 100 (this also recalculates stats)
  if (!setGen3PokemonLevel(data, partyIndex, 100)) return false;

  // Heal Pokemon to full HP
  healGen3Pokemon(data, partyIndex);

  return true;
}

/**
 * Heal Pokemon to full HP
 */
export function healGen3Pokemon(data: Uint8Array, partyIndex: number): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + 0x234);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + 0x238 + (partyIndex * 100);
  const maxHp = readU16LE(data, pokemonOffset + 88);
  writeU16LE(data, pokemonOffset + 86, maxHp);

  updateGen3SectionChecksum(data, sections[1]);
  return true;
}

/**
 * Preset EV distributions for common competitive builds
 */
export const EV_PRESETS = {
  // Sweeper builds
  physicalSweeper: { hp: 4, attack: 252, defense: 0, speed: 252, spAttack: 0, spDefense: 0 },
  specialSweeper: { hp: 4, attack: 0, defense: 0, speed: 252, spAttack: 252, spDefense: 0 },
  mixedSweeper: { hp: 4, attack: 126, defense: 0, speed: 252, spAttack: 126, spDefense: 0 },

  // Tank builds
  physicalTank: { hp: 252, attack: 0, defense: 252, speed: 0, spAttack: 0, spDefense: 4 },
  specialTank: { hp: 252, attack: 0, defense: 4, speed: 0, spAttack: 0, spDefense: 252 },
  mixedTank: { hp: 252, attack: 0, defense: 128, speed: 0, spAttack: 0, spDefense: 128 },

  // Balanced builds
  balanced: { hp: 84, attack: 84, defense: 84, speed: 84, spAttack: 84, spDefense: 84 },
  hpSpeed: { hp: 252, attack: 0, defense: 0, speed: 252, spAttack: 0, spDefense: 4 },
};

export type EVPresetName = keyof typeof EV_PRESETS;

/**
 * Game templates for creating new save files
 */
export interface GameTemplate {
  id: string;
  name: string;
  generation: 1 | 2 | 3;
  platform: "GB" | "GBC" | "GBA";
  fileSize: number;
  gameCode: string;
  securityKey: number;
  defaultTrainerGender: 0 | 1; // 0 = male, 1 = female
}

export const GAME_TEMPLATES: GameTemplate[] = [
  // Gen 3 GBA Games
  {
    id: "ruby",
    name: "Pokemon Ruby",
    generation: 3,
    platform: "GBA",
    fileSize: 0x20000, // 128KB
    gameCode: "AXVE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "sapphire",
    name: "Pokemon Sapphire",
    generation: 3,
    platform: "GBA",
    fileSize: 0x20000,
    gameCode: "AXPE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "emerald",
    name: "Pokemon Emerald",
    generation: 3,
    platform: "GBA",
    fileSize: 0x20000,
    gameCode: "BPEE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "firered",
    name: "Pokemon FireRed",
    generation: 3,
    platform: "GBA",
    fileSize: 0x20000,
    gameCode: "BPRE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "leafgreen",
    name: "Pokemon LeafGreen",
    generation: 3,
    platform: "GBA",
    fileSize: 0x20000,
    gameCode: "BPGE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  // Gen 1 GB Games
  {
    id: "red",
    name: "Pokemon Red",
    generation: 1,
    platform: "GB",
    fileSize: 0x8000, // 32KB
    gameCode: "RED",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "blue",
    name: "Pokemon Blue",
    generation: 1,
    platform: "GB",
    fileSize: 0x8000,
    gameCode: "BLUE",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "yellow",
    name: "Pokemon Yellow",
    generation: 1,
    platform: "GBC",
    fileSize: 0x8000,
    gameCode: "YELLOW",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  // Gen 2 GBC Games
  {
    id: "gold",
    name: "Pokemon Gold",
    generation: 2,
    platform: "GBC",
    fileSize: 0x8000,
    gameCode: "GOLD",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "silver",
    name: "Pokemon Silver",
    generation: 2,
    platform: "GBC",
    fileSize: 0x8000,
    gameCode: "SILVER",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
  {
    id: "crystal",
    name: "Pokemon Crystal",
    generation: 2,
    platform: "GBC",
    fileSize: 0x8000,
    gameCode: "CRYSTAL",
    securityKey: 0,
    defaultTrainerGender: 0,
  },
];

/**
 * Options for creating a new save file
 */
export interface NewSaveOptions {
  gameId: string;
  trainerName: string;
  trainerId?: number;
  secretId?: number;
  trainerGender?: 0 | 1;
  money?: number;
  starterPokemon?: number; // Species ID of starter Pokemon
}

/**
 * Create a new Gen 3 save file from scratch
 */
function createGen3Save(template: GameTemplate, options: NewSaveOptions): Uint8Array {
  const data = new Uint8Array(template.fileSize);
  data.fill(0xFF); // Fill with 0xFF (default flash memory state)

  // Gen 3 save structure: 14 sections, each 0x1000 bytes (4KB)
  // Two save slots: 0x0000-0xDFFF and 0xE000-0x1BFFF
  // We'll initialize the first slot

  // Generate trainer ID and secret ID if not provided
  const trainerId = options.trainerId ?? Math.floor(Math.random() * 65536);
  const secretId = options.secretId ?? Math.floor(Math.random() * 65536);
  const trainerGender = options.trainerGender ?? template.defaultTrainerGender;

  // Section sizes for Gen 3 (data size, not including footer)
  const sectionDataSizes = [
    0x0F2C, // Section 0: Trainer info
    0x0F80, // Section 1: Team/Items
    0x0F80, // Section 2: Game state
    0x0F80, // Section 3: Misc data
    0x0C40, // Section 4: Rival info
    0x0F80, // Section 5-13: PC boxes
    0x0F80, 0x0F80, 0x0F80, 0x0F80,
    0x0F80, 0x0F80, 0x0F80, 0x07D0,
  ];

  // Initialize all 14 sections in slot 1
  for (let sectionId = 0; sectionId < 14; sectionId++) {
    const sectionOffset = sectionId * 0x1000;

    // Clear section data area
    for (let i = 0; i < 0xFF4; i++) {
      data[sectionOffset + i] = 0x00;
    }

    // Section footer (0xFF4 - 0xFFF)
    writeU16LE(data, sectionOffset + 0xFF4, sectionId); // Section ID
    writeU16LE(data, sectionOffset + 0xFF6, 0); // Checksum (calculated later)
    writeU32LE(data, sectionOffset + 0xFF8, 0x08012025); // Signature (magic number)
    writeU32LE(data, sectionOffset + 0xFFC, 1); // Save index (1 for new save)
  }

  // Section 0: Trainer Info
  const section0 = 0;

  // Trainer name (offset 0x00, 7 bytes + terminator)
  const encodedName = encodeGen3String(options.trainerName, 8);
  for (let i = 0; i < 8; i++) {
    data[section0 + i] = encodedName[i];
  }

  // Trainer gender (offset 0x08)
  data[section0 + 0x08] = trainerGender;

  // Trainer ID (offset 0x0A, 2 bytes)
  writeU16LE(data, section0 + 0x0A, trainerId);

  // Secret ID (offset 0x0C, 2 bytes)
  writeU16LE(data, section0 + 0x0C, secretId);

  // Play time (offset 0x0E: hours, 0x10: minutes, 0x11: seconds, 0x12: frames)
  writeU16LE(data, section0 + 0x0E, 0); // Hours
  data[section0 + 0x10] = 0; // Minutes
  data[section0 + 0x11] = 0; // Seconds
  data[section0 + 0x12] = 0; // Frames

  // Game code (for some games, offset varies)
  // Options bitmask at various offsets

  // Section 1: Team/Items
  const section1 = 0x1000;

  // Team size (offset 0x234)
  writeU32LE(data, section1 + 0x234, 0); // No Pokemon in party yet

  // Money (offset 0x490, XOR encrypted with security key)
  const money = options.money ?? 3000; // Default starting money
  const securityKey = 0; // For new saves, security key starts at 0
  writeU32LE(data, section1 + 0x490, money ^ securityKey);

  // Security key (offset 0xF20 for R/S/E, different for FR/LG)
  writeU32LE(data, section1 + 0xF20, securityKey);

  // Add starter Pokemon if specified
  if (options.starterPokemon) {
    addStarterToParty(data, section1, options.starterPokemon, trainerId, secretId, options.trainerName);
  }

  // Update all section checksums
  for (let sectionId = 0; sectionId < 14; sectionId++) {
    const sectionOffset = sectionId * 0x1000;
    updateGen3SectionChecksum(data, sectionOffset);
  }

  return data;
}

/**
 * Add a starter Pokemon to the party in a Gen 3 save
 */
function addStarterToParty(
  data: Uint8Array,
  section1Offset: number,
  species: number,
  trainerId: number,
  secretId: number,
  trainerName: string
): void {
  // Set party count to 1
  writeU32LE(data, section1Offset + 0x234, 1);

  // Pokemon data starts at offset 0x238 (100 bytes per Pokemon)
  const pokemonOffset = section1Offset + 0x238;

  // Generate random personality value
  const personality = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
  const fullOtId = (secretId << 16) | trainerId;

  // Write Pokemon structure
  writeU32LE(data, pokemonOffset, personality); // Personality
  writeU32LE(data, pokemonOffset + 4, fullOtId); // OT ID

  // Nickname (offset 8, 10 bytes)
  const pokemonName = POKEMON_NAMES[species] || "Pokemon";
  const encodedNickname = encodeGen3String(pokemonName.toUpperCase(), 10);
  for (let i = 0; i < 10; i++) {
    data[pokemonOffset + 8 + i] = encodedNickname[i];
  }

  // Language (offset 18)
  writeU16LE(data, pokemonOffset + 18, 0x0202); // English

  // OT Name (offset 20, 7 bytes)
  const encodedOtName = encodeGen3String(trainerName, 7);
  for (let i = 0; i < 7; i++) {
    data[pokemonOffset + 20 + i] = encodedOtName[i];
  }

  // Markings (offset 27)
  data[pokemonOffset + 27] = 0;

  // Checksum (offset 28) - calculated after substructure
  // Unused (offset 30)

  // Prepare substructure data (48 bytes, will be encrypted)
  const substructure = new Uint8Array(48);

  // Determine substructure order based on personality
  const substructOrder = personality % 24;
  const substructOffsets = getSubstructOrder(substructOrder);

  // Growth substructure (12 bytes)
  const growthOffset = substructOffsets[0] * 12;
  writeU16LE(substructure, growthOffset, species); // Species
  writeU16LE(substructure, growthOffset + 2, 0); // Held item (none)
  writeU32LE(substructure, growthOffset + 4, 125); // Experience (level 5 medium slow)
  data[substructure[growthOffset + 8]] = 0; // PP bonuses
  data[substructure[growthOffset + 9]] = 70; // Friendship

  // Attacks substructure (12 bytes)
  const attacksOffset = substructOffsets[1] * 12;
  // Give starter moves based on species (simplified - just Tackle and Growl for now)
  writeU16LE(substructure, attacksOffset, 33); // Tackle
  writeU16LE(substructure, attacksOffset + 2, 45); // Growl
  writeU16LE(substructure, attacksOffset + 4, 0); // No move
  writeU16LE(substructure, attacksOffset + 6, 0); // No move
  substructure[attacksOffset + 8] = 35; // Tackle PP
  substructure[attacksOffset + 9] = 40; // Growl PP
  substructure[attacksOffset + 10] = 0;
  substructure[attacksOffset + 11] = 0;

  // EVs & Condition substructure (12 bytes)
  const evsOffset = substructOffsets[2] * 12;
  // All EVs start at 0, condition values at 0

  // Misc substructure (12 bytes)
  const miscOffset = substructOffsets[3] * 12;
  // Pokerus (offset 0)
  substructure[miscOffset] = 0;
  // Met location (offset 1)
  substructure[miscOffset + 1] = 0; // Met at start
  // Origins info (offset 2-3)
  writeU16LE(substructure, miscOffset + 2, 5 | (3 << 7)); // Level 5, Poke Ball

  // IVs and flags (offset 4-7)
  // Random IVs for starter
  const ivHp = Math.floor(Math.random() * 32);
  const ivAtk = Math.floor(Math.random() * 32);
  const ivDef = Math.floor(Math.random() * 32);
  const ivSpd = Math.floor(Math.random() * 32);
  const ivSpA = Math.floor(Math.random() * 32);
  const ivSpD = Math.floor(Math.random() * 32);
  const ivData = ivHp | (ivAtk << 5) | (ivDef << 10) | (ivSpd << 15) | (ivSpA << 20) | (ivSpD << 25);
  writeU32LE(substructure, miscOffset + 4, ivData);

  // Ribbons and obedience (offset 8-11)
  writeU32LE(substructure, miscOffset + 8, 0);

  // Calculate substructure checksum
  let subChecksum = 0;
  for (let i = 0; i < 48; i += 2) {
    subChecksum = (subChecksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, subChecksum);

  // Encrypt and write substructure
  const key = personality ^ fullOtId;
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    const encrypted = (value ^ key) >>> 0;
    writeU32LE(data, pokemonOffset + 32 + i, encrypted);
  }

  // Status condition (offset 80)
  writeU32LE(data, pokemonOffset + 80, 0); // No status

  // Level (offset 84)
  data[pokemonOffset + 84] = 5;

  // Pokerus remaining (offset 85)
  data[pokemonOffset + 85] = 0;

  // Calculate stats for level 5
  const baseStats = BASE_STATS[species] || DEFAULT_BASE_STATS;
  const nature = personality % 25;

  const hp = calculateGen3Stat(baseStats.hp, ivHp, 0, 5, nature, 0);
  const atk = calculateGen3Stat(baseStats.attack, ivAtk, 0, 5, nature, 1);
  const def = calculateGen3Stat(baseStats.defense, ivDef, 0, 5, nature, 2);
  const spd = calculateGen3Stat(baseStats.speed, ivSpd, 0, 5, nature, 3);
  const spa = calculateGen3Stat(baseStats.spAttack, ivSpA, 0, 5, nature, 4);
  const spdef = calculateGen3Stat(baseStats.spDefense, ivSpD, 0, 5, nature, 5);

  writeU16LE(data, pokemonOffset + 86, hp); // Current HP
  writeU16LE(data, pokemonOffset + 88, hp); // Max HP
  writeU16LE(data, pokemonOffset + 90, atk); // Attack
  writeU16LE(data, pokemonOffset + 92, def); // Defense
  writeU16LE(data, pokemonOffset + 94, spd); // Speed
  writeU16LE(data, pokemonOffset + 96, spa); // Sp. Attack
  writeU16LE(data, pokemonOffset + 98, spdef); // Sp. Defense
}

/**
 * Create a new Gen 1 save file from scratch
 */
function createGen1Save(template: GameTemplate, options: NewSaveOptions): Uint8Array {
  const data = new Uint8Array(template.fileSize);
  data.fill(0x00);

  // Trainer name at 0x2598 (11 bytes)
  const encodedName = encodeGen1String(options.trainerName, 11);
  for (let i = 0; i < 11; i++) {
    data[0x2598 + i] = encodedName[i];
  }

  // Trainer ID at 0x2605 (2 bytes, big endian in Gen 1)
  const trainerId = options.trainerId ?? Math.floor(Math.random() * 65536);
  data[0x2605] = (trainerId >> 8) & 0xFF;
  data[0x2606] = trainerId & 0xFF;

  // Money at 0x25F3 (BCD encoded, 3 bytes)
  const money = options.money ?? 3000;
  const moneyBCD = Math.min(money, 999999);
  data[0x25F3] = Math.floor(moneyBCD / 10000) % 100;
  data[0x25F4] = Math.floor(moneyBCD / 100) % 100;
  data[0x25F5] = moneyBCD % 100;

  // Badges at 0x2602
  data[0x2602] = 0;

  // Options at 0x2601
  data[0x2601] = 0x40; // Default options

  // Party count at 0x2F2C
  data[0x2F2C] = 0;

  // Terminator for party
  data[0x2F2D] = 0xFF;

  // Play time at 0x2CED
  data[0x2CED] = 0; // Hours
  data[0x2CEE] = 0; // Minutes
  data[0x2CEF] = 0; // Seconds

  // Checksum calculation for Gen 1 (0x2598 to 0x3522)
  let checksum = 0;
  for (let i = 0x2598; i < 0x3523; i++) {
    checksum = (checksum + data[i]) & 0xFF;
  }
  data[0x3523] = (~checksum) & 0xFF;

  return data;
}

/**
 * Create a new Gen 2 save file from scratch
 */
function createGen2Save(template: GameTemplate, options: NewSaveOptions): Uint8Array {
  const data = new Uint8Array(template.fileSize);
  data.fill(0x00);

  // Player name at 0x200B (11 bytes for Crystal, different for Gold/Silver)
  const nameOffset = template.id === "crystal" ? 0x200B : 0x200B;
  const encodedName = encodeGen1String(options.trainerName, 11); // Gen 2 uses Gen 1 encoding
  for (let i = 0; i < 11; i++) {
    data[nameOffset + i] = encodedName[i];
  }

  // Trainer ID at 0x2009
  const trainerId = options.trainerId ?? Math.floor(Math.random() * 65536);
  writeU16LE(data, 0x2009, trainerId);

  // Money at 0x23DB (3 bytes)
  const money = options.money ?? 3000;
  data[0x23DB] = money & 0xFF;
  data[0x23DC] = (money >> 8) & 0xFF;
  data[0x23DD] = (money >> 16) & 0xFF;

  // Badges at 0x23E5-0x23E6 (Johto and Kanto)
  writeU16LE(data, 0x23E5, 0);

  // Gender at 0x3E3D (Crystal only)
  if (template.id === "crystal") {
    data[0x3E3D] = options.trainerGender ?? 0;
  }

  // Play time
  data[0x2054] = 0; // Hours
  data[0x2055] = 0; // Minutes
  data[0x2056] = 0; // Seconds

  // Party count
  data[0x2865] = 0;

  // Calculate checksums (Gen 2 has multiple checksums)
  // Main data checksum
  let checksum1 = 0;
  for (let i = 0x2009; i < 0x2D69; i++) {
    checksum1 = (checksum1 + data[i]) & 0xFFFF;
  }
  writeU16LE(data, 0x2D69, checksum1);

  return data;
}

/**
 * Create a new save file for the specified game
 */
export function createNewSave(options: NewSaveOptions): Uint8Array | null {
  const template = GAME_TEMPLATES.find(t => t.id === options.gameId);
  if (!template) return null;

  switch (template.generation) {
    case 1:
      return createGen1Save(template, options);
    case 2:
      return createGen2Save(template, options);
    case 3:
      return createGen3Save(template, options);
    default:
      return null;
  }
}

/**
 * Get file extension for save file
 */
export function getSaveFileExtension(gameId: string): string {
  const template = GAME_TEMPLATES.find(t => t.id === gameId);
  if (!template) return ".sav";

  switch (template.platform) {
    case "GB":
    case "GBC":
      return ".sav";
    case "GBA":
      return ".sav";
    default:
      return ".sav";
  }
}

/**
 * Starter Pokemon options for each game
 */
export const STARTER_OPTIONS: Record<string, { species: number; name: string }[]> = {
  ruby: [
    { species: 252, name: "Treecko" },
    { species: 255, name: "Torchic" },
    { species: 258, name: "Mudkip" },
  ],
  sapphire: [
    { species: 252, name: "Treecko" },
    { species: 255, name: "Torchic" },
    { species: 258, name: "Mudkip" },
  ],
  emerald: [
    { species: 252, name: "Treecko" },
    { species: 255, name: "Torchic" },
    { species: 258, name: "Mudkip" },
  ],
  firered: [
    { species: 1, name: "Bulbasaur" },
    { species: 4, name: "Charmander" },
    { species: 7, name: "Squirtle" },
  ],
  leafgreen: [
    { species: 1, name: "Bulbasaur" },
    { species: 4, name: "Charmander" },
    { species: 7, name: "Squirtle" },
  ],
  red: [
    { species: 1, name: "Bulbasaur" },
    { species: 4, name: "Charmander" },
    { species: 7, name: "Squirtle" },
  ],
  blue: [
    { species: 1, name: "Bulbasaur" },
    { species: 4, name: "Charmander" },
    { species: 7, name: "Squirtle" },
  ],
  yellow: [
    { species: 25, name: "Pikachu" },
  ],
  gold: [
    { species: 152, name: "Chikorita" },
    { species: 155, name: "Cyndaquil" },
    { species: 158, name: "Totodile" },
  ],
  silver: [
    { species: 152, name: "Chikorita" },
    { species: 155, name: "Cyndaquil" },
    { species: 158, name: "Totodile" },
  ],
  crystal: [
    { species: 152, name: "Chikorita" },
    { species: 155, name: "Cyndaquil" },
    { species: 158, name: "Totodile" },
  ],
};
