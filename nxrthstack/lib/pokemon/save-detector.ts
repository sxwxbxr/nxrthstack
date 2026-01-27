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
  spAttack?: number; // Gen 2-3
  spDefense?: number; // Gen 2-3
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
  friendship?: number; // Gen 2-3
  pokerus?: number; // Gen 2-3
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

// Item names for Gen 1
export const GEN1_ITEM_NAMES: Record<number, string> = {
  0x00: "None",
  0x01: "Master Ball", 0x02: "Ultra Ball", 0x03: "Great Ball", 0x04: "Poké Ball",
  0x05: "Town Map", 0x06: "Bicycle", 0x07: "?????", 0x08: "Safari Ball",
  0x09: "Pokédex", 0x0A: "Moon Stone", 0x0B: "Antidote", 0x0C: "Burn Heal",
  0x0D: "Ice Heal", 0x0E: "Awakening", 0x0F: "Parlyz Heal", 0x10: "Full Restore",
  0x11: "Max Potion", 0x12: "Hyper Potion", 0x13: "Super Potion", 0x14: "Potion",
  0x15: "BoulderBadge", 0x16: "CascadeBadge", 0x17: "ThunderBadge", 0x18: "RainbowBadge",
  0x19: "SoulBadge", 0x1A: "MarshBadge", 0x1B: "VolcanoBadge", 0x1C: "EarthBadge",
  0x1D: "Escape Rope", 0x1E: "Repel", 0x1F: "Old Amber", 0x20: "Fire Stone",
  0x21: "Thunder Stone", 0x22: "Water Stone", 0x23: "HP Up", 0x24: "Protein",
  0x25: "Iron", 0x26: "Carbos", 0x27: "Calcium", 0x28: "Rare Candy",
  0x29: "Dome Fossil", 0x2A: "Helix Fossil", 0x2B: "Secret Key", 0x2C: "?????",
  0x2D: "Bike Voucher", 0x2E: "X Accuracy", 0x2F: "Leaf Stone", 0x30: "Card Key",
  0x31: "Nugget", 0x32: "PP Up", 0x33: "Poké Doll", 0x34: "Full Heal",
  0x35: "Revive", 0x36: "Max Revive", 0x37: "Guard Spec.", 0x38: "Super Repel",
  0x39: "Max Repel", 0x3A: "Dire Hit", 0x3B: "Coin", 0x3C: "Fresh Water",
  0x3D: "Soda Pop", 0x3E: "Lemonade", 0x3F: "S.S. Ticket", 0x40: "Gold Teeth",
  0x41: "X Attack", 0x42: "X Defend", 0x43: "X Speed", 0x44: "X Special",
  0x45: "Coin Case", 0x46: "Oak's Parcel", 0x47: "Itemfinder", 0x48: "Silph Scope",
  0x49: "Poké Flute", 0x4A: "Lift Key", 0x4B: "Exp. All", 0x4C: "Old Rod",
  0x4D: "Good Rod", 0x4E: "Super Rod", 0x4F: "PP Up", 0x50: "Ether",
  0x51: "Max Ether", 0x52: "Elixir", 0x53: "Max Elixir",
  // TMs/HMs
  0xC4: "HM01", 0xC5: "HM02", 0xC6: "HM03", 0xC7: "HM04", 0xC8: "HM05",
  0xC9: "TM01", 0xCA: "TM02", 0xCB: "TM03", 0xCC: "TM04", 0xCD: "TM05",
  0xCE: "TM06", 0xCF: "TM07", 0xD0: "TM08", 0xD1: "TM09", 0xD2: "TM10",
  0xD3: "TM11", 0xD4: "TM12", 0xD5: "TM13", 0xD6: "TM14", 0xD7: "TM15",
  0xD8: "TM16", 0xD9: "TM17", 0xDA: "TM18", 0xDB: "TM19", 0xDC: "TM20",
  0xDD: "TM21", 0xDE: "TM22", 0xDF: "TM23", 0xE0: "TM24", 0xE1: "TM25",
  0xE2: "TM26", 0xE3: "TM27", 0xE4: "TM28", 0xE5: "TM29", 0xE6: "TM30",
  0xE7: "TM31", 0xE8: "TM32", 0xE9: "TM33", 0xEA: "TM34", 0xEB: "TM35",
  0xEC: "TM36", 0xED: "TM37", 0xEE: "TM38", 0xEF: "TM39", 0xF0: "TM40",
  0xF1: "TM41", 0xF2: "TM42", 0xF3: "TM43", 0xF4: "TM44", 0xF5: "TM45",
  0xF6: "TM46", 0xF7: "TM47", 0xF8: "TM48", 0xF9: "TM49", 0xFA: "TM50",
};

// Item names for Gen 2 (similar to Gen 1 but with additions)
export const GEN2_ITEM_NAMES: Record<number, string> = {
  0x00: "None",
  0x01: "Master Ball", 0x02: "Ultra Ball", 0x03: "BrightPowder", 0x04: "Great Ball",
  0x05: "Poké Ball", 0x06: "Teru-sama", 0x07: "Bicycle", 0x08: "Moon Stone",
  0x09: "Antidote", 0x0A: "Burn Heal", 0x0B: "Ice Heal", 0x0C: "Awakening",
  0x0D: "Parlyz Heal", 0x0E: "Full Restore", 0x0F: "Max Potion", 0x10: "Hyper Potion",
  0x11: "Super Potion", 0x12: "Potion", 0x13: "Escape Rope", 0x14: "Repel",
  0x15: "Max Elixir", 0x16: "Fire Stone", 0x17: "Thunder Stone", 0x18: "Water Stone",
  0x19: "Teru-sama", 0x1A: "HP Up", 0x1B: "Protein", 0x1C: "Iron",
  0x1D: "Carbos", 0x1E: "Lucky Punch", 0x1F: "Calcium", 0x20: "Rare Candy",
  0x21: "X Accuracy", 0x22: "Leaf Stone", 0x23: "Metal Powder", 0x24: "Nugget",
  0x25: "Poké Doll", 0x26: "Full Heal", 0x27: "Revive", 0x28: "Max Revive",
  0x29: "Guard Spec.", 0x2A: "Super Repel", 0x2B: "Max Repel", 0x2C: "Dire Hit",
  0x2D: "Teru-sama", 0x2E: "Fresh Water", 0x2F: "Soda Pop", 0x30: "Lemonade",
  0x31: "X Attack", 0x32: "Teru-sama", 0x33: "X Defend", 0x34: "X Speed",
  0x35: "X Special", 0x36: "Coin Case", 0x37: "Itemfinder", 0x38: "Teru-sama",
  0x39: "Exp. Share", 0x3A: "Old Rod", 0x3B: "Good Rod", 0x3C: "Silver Leaf",
  0x3D: "Super Rod", 0x3E: "PP Up", 0x3F: "Ether", 0x40: "Max Ether",
  0x41: "Elixir", 0x42: "Red Scale", 0x43: "SecretPotion", 0x44: "S.S. Ticket",
  0x45: "Mystery Egg", 0x46: "Clear Bell", 0x47: "Silver Wing", 0x48: "Moomoo Milk",
  0x49: "Quick Claw", 0x4A: "PSNCureBerry", 0x4B: "Gold Leaf", 0x4C: "Soft Sand",
  0x4D: "Sharp Beak", 0x4E: "PRZCureBerry", 0x4F: "Burnt Berry", 0x50: "Ice Berry",
  0x51: "Poison Barb", 0x52: "King's Rock", 0x53: "Bitter Berry", 0x54: "Mint Berry",
  0x55: "Red Apricorn", 0x56: "TinyMushroom", 0x57: "Big Mushroom", 0x58: "SilverPowder",
  0x59: "Blu Apricorn", 0x5A: "Teru-sama", 0x5B: "Amulet Coin", 0x5C: "Ylw Apricorn",
  0x5D: "Grn Apricorn", 0x5E: "Cleanse Tag", 0x5F: "Mystic Water", 0x60: "TwistedSpoon",
  0x61: "Wht Apricorn", 0x62: "BlackBelt", 0x63: "Blk Apricorn", 0x64: "Teru-sama",
  0x65: "Pnk Apricorn", 0x66: "BlackGlasses", 0x67: "SlowpokeTail", 0x68: "Pink Bow",
  0x69: "Stick", 0x6A: "Smoke Ball", 0x6B: "NeverMeltIce", 0x6C: "Magnet",
  0x6D: "MiracleBerry", 0x6E: "Pearl", 0x6F: "Big Pearl", 0x70: "Everstone",
  0x71: "Spell Tag", 0x72: "RageCandyBar", 0x73: "GS Ball", 0x74: "Blue Card",
  0x75: "Miracle Seed", 0x76: "Thick Club", 0x77: "Focus Band", 0x78: "Teru-sama",
  0x79: "EnergyPowder", 0x7A: "Energy Root", 0x7B: "Heal Powder", 0x7C: "Revival Herb",
  0x7D: "Hard Stone", 0x7E: "Lucky Egg", 0x7F: "Card Key", 0x80: "Machine Part",
  0x81: "Egg Ticket", 0x82: "Lost Item", 0x83: "Stardust", 0x84: "Star Piece",
  0x85: "Basement Key", 0x86: "Pass", 0x87: "Teru-sama", 0x88: "Teru-sama",
  0x89: "Teru-sama", 0x8A: "Charcoal", 0x8B: "Berry Juice", 0x8C: "Scope Lens",
  0x8D: "Teru-sama", 0x8E: "Teru-sama", 0x8F: "Metal Coat", 0x90: "Dragon Fang",
  0x91: "Teru-sama", 0x92: "Leftovers",
  // TMs/HMs
  0xBF: "TM01", 0xC0: "TM02", 0xC1: "TM03", 0xC2: "TM04", 0xC3: "TM05",
  0xC4: "TM06", 0xC5: "TM07", 0xC6: "TM08", 0xC7: "TM09", 0xC8: "TM10",
  0xC9: "TM11", 0xCA: "TM12", 0xCB: "TM13", 0xCC: "TM14", 0xCD: "TM15",
  0xCE: "TM16", 0xCF: "TM17", 0xD0: "TM18", 0xD1: "TM19", 0xD2: "TM20",
  0xD3: "TM21", 0xD4: "TM22", 0xD5: "TM23", 0xD6: "TM24", 0xD7: "TM25",
  0xD8: "TM26", 0xD9: "TM27", 0xDA: "TM28", 0xDB: "TM29", 0xDC: "TM30",
  0xDD: "TM31", 0xDE: "TM32", 0xDF: "TM33", 0xE0: "TM34", 0xE1: "TM35",
  0xE2: "TM36", 0xE3: "TM37", 0xE4: "TM38", 0xE5: "TM39", 0xE6: "TM40",
  0xE7: "TM41", 0xE8: "TM42", 0xE9: "TM43", 0xEA: "TM44", 0xEB: "TM45",
  0xEC: "TM46", 0xED: "TM47", 0xEE: "TM48", 0xEF: "TM49", 0xF0: "TM50",
  0xF1: "HM01", 0xF2: "HM02", 0xF3: "HM03", 0xF4: "HM04", 0xF5: "HM05",
  0xF6: "HM06", 0xF7: "HM07",
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

  // Gen 3 save: 128KB or 64KB (some emulators add extra bytes)
  // Accept sizes from 64KB to 256KB to handle various emulator formats
  if (size >= 0x10000 && size <= 0x40000) {
    const gen3Result = detectGen3Save(data);
    if (gen3Result) return gen3Result;
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
  const game = "Pokemon Red/Blue";
  const gameCode = "POKEMON RED";

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

/**
 * Detect Gen 3 game type from save data
 * Returns: 'FRLG' for FireRed/LeafGreen, 'E' for Emerald, 'RS' for Ruby/Sapphire
 */
function detectGen3GameType(data: Uint8Array, section0Offset: number, section1Offset: number): 'FRLG' | 'E' | 'RS' {
  // FireRed/LeafGreen has security key at section 0, offset 0xAF8
  // and money at section 1, offset 0x290
  // Check if the security key location for FRLG has a plausible value
  const frlgSecurityKey = readU32LE(data, section0Offset + 0xAF8);
  const frlgMoney = readU32LE(data, section1Offset + 0x290);
  const frlgDecryptedMoney = frlgMoney ^ frlgSecurityKey;

  // Emerald has security key at section 0, offset 0xAC
  // and money at section 1, offset 0x490
  const emeraldSecurityKey = readU32LE(data, section0Offset + 0xAC);
  const rseMoney = readU32LE(data, section1Offset + 0x490);
  const emeraldDecryptedMoney = rseMoney ^ emeraldSecurityKey;

  // Ruby/Sapphire has money at section 1, offset 0x490 (no encryption)
  // The money value should be reasonable (0 to 999999)
  const maxMoney = 999999;

  // Check FRLG first - if decrypted money is reasonable, it's likely FRLG
  if (frlgDecryptedMoney >= 0 && frlgDecryptedMoney <= maxMoney) {
    // Additional check: FRLG security key should be non-zero for used saves
    // or the raw money value at 0x290 should look encrypted (large value)
    if (frlgSecurityKey !== 0 || frlgMoney <= maxMoney) {
      return 'FRLG';
    }
  }

  // Check Emerald - if decrypted money is reasonable and security key is non-zero
  if (emeraldSecurityKey !== 0 && emeraldDecryptedMoney >= 0 && emeraldDecryptedMoney <= maxMoney) {
    return 'E';
  }

  // Check Ruby/Sapphire - money at 0x490 without encryption
  if (rseMoney >= 0 && rseMoney <= maxMoney) {
    return 'RS';
  }

  // Default to FRLG if we can't determine (most common case)
  return 'FRLG';
}

function detectGen3Save(data: Uint8Array): SaveInfo | null {
  // Gen 3 saves have two save slots, each 57344 bytes (0xE000)
  // The active save is determined by the save index
  // Section 0 contains trainer info

  // Find the most recent save
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);

  const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

  // Build section map
  const sections: Record<number, number> = {};
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    // Validate section signature
    const signature = readU32LE(data, sectionOffset + 0xFF8);
    if (signature === 0x08012025) {
      sections[sectionId] = sectionOffset;
    }
  }

  const trainerSectionOffset = sections[0];
  if (trainerSectionOffset === undefined) return null;

  const trainerName = decodeGen3String(data, trainerSectionOffset, 7);
  if (!trainerName || trainerName.length === 0) return null;

  const trainerId = readU16LE(data, trainerSectionOffset + 0xA);
  const _secretId = readU16LE(data, trainerSectionOffset + 0xC); // Reserved for future use
  const hours = readU16LE(data, trainerSectionOffset + 0xE);
  const minutes = readU8(data, trainerSectionOffset + 0x10);
  const seconds = readU8(data, trainerSectionOffset + 0x11);

  // Get section 1 offset for money
  const section1Offset = sections[1];
  if (section1Offset === undefined) return null;

  // Detect game type
  const gameType = detectGen3GameType(data, trainerSectionOffset, section1Offset);

  // Read money based on game type
  let money = 0;
  let game = "Pokemon Ruby/Sapphire";
  let gameCodeStr = "AXVE";

  if (gameType === 'FRLG') {
    // FireRed/LeafGreen: money at 0x290, XOR with security key at section 0, offset 0xAF8
    const securityKey = readU32LE(data, trainerSectionOffset + 0xAF8);
    const encryptedMoney = readU32LE(data, section1Offset + 0x290);
    money = (encryptedMoney ^ securityKey) >>> 0; // Ensure unsigned
    game = "Pokemon FireRed/LeafGreen";
    gameCodeStr = "BPRE"; // FireRed code
  } else if (gameType === 'E') {
    // Emerald: money at 0x490, XOR with security key at section 0, offset 0xAC
    const securityKey = readU32LE(data, trainerSectionOffset + 0xAC);
    const encryptedMoney = readU32LE(data, section1Offset + 0x490);
    money = (encryptedMoney ^ securityKey) >>> 0;
    game = "Pokemon Emerald";
    gameCodeStr = "BPEE";
  } else {
    // Ruby/Sapphire: money at 0x490, no encryption
    money = readU32LE(data, section1Offset + 0x490);
    game = "Pokemon Ruby/Sapphire";
    gameCodeStr = "AXVE";
  }

  // Clamp money to valid range
  if (money > 999999) {
    money = 0; // Invalid, default to 0
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
  } else if (info.generation === 1) {
    return parseGen1Save(data, info);
  } else if (info.generation === 2) {
    return parseGen2Save(data, info);
  }

  return null;
}

/**
 * Gen 1 internal species index to National Pokedex mapping
 */
const GEN1_INDEX_TO_SPECIES: Record<number, number> = {
  0x01: 112, // Rhydon
  0x02: 115, // Kangaskhan
  0x03: 32,  // Nidoran♂
  0x04: 35,  // Clefairy
  0x05: 21,  // Spearow
  0x06: 100, // Voltorb
  0x07: 34,  // Nidoking
  0x08: 80,  // Slowbro
  0x09: 2,   // Ivysaur
  0x0A: 103, // Exeggutor
  0x0B: 108, // Lickitung
  0x0C: 102, // Exeggcute
  0x0D: 88,  // Grimer
  0x0E: 94,  // Gengar
  0x0F: 29,  // Nidoran♀
  0x10: 31,  // Nidoqueen
  0x11: 104, // Cubone
  0x12: 111, // Rhyhorn
  0x13: 131, // Lapras
  0x14: 59,  // Arcanine
  0x15: 151, // Mew
  0x16: 130, // Gyarados
  0x17: 90,  // Shellder
  0x18: 72,  // Tentacool
  0x19: 92,  // Gastly
  0x1A: 123, // Scyther
  0x1B: 120, // Staryu
  0x1C: 9,   // Blastoise
  0x1D: 127, // Pinsir
  0x1E: 114, // Tangela
  0x21: 58,  // Growlithe
  0x22: 95,  // Onix
  0x23: 22,  // Fearow
  0x24: 16,  // Pidgey
  0x25: 79,  // Slowpoke
  0x26: 64,  // Kadabra
  0x27: 75,  // Graveler
  0x28: 113, // Chansey
  0x29: 67,  // Machoke
  0x2A: 122, // Mr. Mime
  0x2B: 106, // Hitmonlee
  0x2C: 107, // Hitmonchan
  0x2D: 24,  // Arbok
  0x2E: 47,  // Parasect
  0x2F: 54,  // Psyduck
  0x30: 96,  // Drowzee
  0x31: 76,  // Golem
  0x33: 126, // Magmar
  0x35: 125, // Electabuzz
  0x36: 82,  // Magneton
  0x37: 109, // Koffing
  0x39: 56,  // Mankey
  0x3A: 86,  // Seel
  0x3B: 50,  // Diglett
  0x3C: 128, // Tauros
  0x40: 83,  // Farfetch'd
  0x41: 48,  // Venonat
  0x42: 149, // Dragonite
  0x46: 84,  // Doduo
  0x47: 60,  // Poliwag
  0x48: 124, // Jynx
  0x49: 146, // Moltres
  0x4A: 144, // Articuno
  0x4B: 145, // Zapdos
  0x4C: 132, // Ditto
  0x4D: 52,  // Meowth
  0x4E: 98,  // Krabby
  0x52: 37,  // Vulpix
  0x53: 38,  // Ninetales
  0x54: 25,  // Pikachu
  0x55: 26,  // Raichu
  0x58: 147, // Dratini
  0x59: 148, // Dragonair
  0x5A: 140, // Kabuto
  0x5B: 141, // Kabutops
  0x5C: 116, // Horsea
  0x5D: 117, // Seadra
  0x60: 27,  // Sandshrew
  0x61: 28,  // Sandslash
  0x62: 138, // Omanyte
  0x63: 139, // Omastar
  0x64: 39,  // Jigglypuff
  0x65: 40,  // Wigglytuff
  0x66: 133, // Eevee
  0x67: 136, // Flareon
  0x68: 135, // Jolteon
  0x69: 134, // Vaporeon
  0x6A: 66,  // Machop
  0x6B: 41,  // Zubat
  0x6C: 23,  // Ekans
  0x6D: 46,  // Paras
  0x6E: 61,  // Poliwhirl
  0x6F: 62,  // Poliwrath
  0x70: 13,  // Weedle
  0x71: 14,  // Kakuna
  0x72: 15,  // Beedrill
  0x74: 85,  // Dodrio
  0x75: 57,  // Primeape
  0x76: 51,  // Dugtrio
  0x77: 49,  // Venomoth
  0x78: 87,  // Dewgong
  0x7B: 10,  // Caterpie
  0x7C: 11,  // Metapod
  0x7D: 12,  // Butterfree
  0x7E: 68,  // Machamp
  0x80: 55,  // Golduck
  0x81: 97,  // Hypno
  0x82: 42,  // Golbat
  0x83: 150, // Mewtwo
  0x84: 143, // Snorlax
  0x85: 129, // Magikarp
  0x88: 89,  // Muk
  0x8A: 99,  // Kingler
  0x8B: 91,  // Cloyster
  0x8D: 101, // Electrode
  0x8E: 36,  // Clefable
  0x8F: 110, // Weezing
  0x90: 53,  // Persian
  0x91: 105, // Marowak
  0x93: 93,  // Haunter
  0x94: 63,  // Abra
  0x95: 65,  // Alakazam
  0x96: 17,  // Pidgeotto
  0x97: 18,  // Pidgeot
  0x98: 121, // Starmie
  0x99: 1,   // Bulbasaur
  0x9A: 3,   // Venusaur
  0x9B: 73,  // Tentacruel
  0x9D: 118, // Goldeen
  0x9E: 119, // Seaking
  0xA3: 77,  // Ponyta
  0xA4: 78,  // Rapidash
  0xA5: 19,  // Rattata
  0xA6: 20,  // Raticate
  0xA7: 33,  // Nidorino
  0xA8: 30,  // Nidorina
  0xA9: 74,  // Geodude
  0xAA: 137, // Porygon
  0xAB: 142, // Aerodactyl
  0xAD: 81,  // Magnemite
  0xB0: 4,   // Charmander
  0xB1: 7,   // Squirtle
  0xB2: 5,   // Charmeleon
  0xB3: 8,   // Wartortle
  0xB4: 6,   // Charizard
  0xB9: 43,  // Oddish
  0xBA: 44,  // Gloom
  0xBB: 45,  // Vileplume
  0xBC: 69,  // Bellsprout
  0xBD: 70,  // Weepinbell
  0xBE: 71,  // Victreebel
};

/**
 * Parse Gen 1 Pokemon from party data
 */
function parseGen1Pokemon(data: Uint8Array, partyOffset: number, index: number): Pokemon | null {
  // Party structure:
  // 0x2F2C: count
  // 0x2F2D-0x2F33: species list (7 bytes including terminator)
  // 0x2F34: Pokemon data (44 bytes × 6)
  // 0x303C: OT names (11 bytes × 6)
  // 0x307E: Nicknames (11 bytes × 6)

  const pokemonDataOffset = partyOffset + 8 + (index * 44); // 8 = 1 count + 7 species list
  const otNameOffset = partyOffset + 8 + (44 * 6) + (index * 11);
  const nicknameOffset = partyOffset + 8 + (44 * 6) + (11 * 6) + (index * 11);

  const internalSpecies = data[pokemonDataOffset];
  if (internalSpecies === 0) return null;

  const species = GEN1_INDEX_TO_SPECIES[internalSpecies] || internalSpecies;

  const currentHp = readU16BE(data, pokemonDataOffset + 1);
  const level = data[pokemonDataOffset + 33]; // Party level at offset 0x21
  const _status = data[pokemonDataOffset + 4]; // Status condition (reserved)

  const move1 = data[pokemonDataOffset + 8];
  const move2 = data[pokemonDataOffset + 9];
  const move3 = data[pokemonDataOffset + 10];
  const move4 = data[pokemonDataOffset + 11];

  const otId = readU16BE(data, pokemonDataOffset + 12);

  const exp = (data[pokemonDataOffset + 14] << 16) |
              (data[pokemonDataOffset + 15] << 8) |
              data[pokemonDataOffset + 16];

  // EVs (16-bit each, big endian)
  const hpEV = readU16BE(data, pokemonDataOffset + 17);
  const attackEV = readU16BE(data, pokemonDataOffset + 19);
  const defenseEV = readU16BE(data, pokemonDataOffset + 21);
  const speedEV = readU16BE(data, pokemonDataOffset + 23);
  const specialEV = readU16BE(data, pokemonDataOffset + 25);

  // IVs packed in 2 bytes
  const ivByte1 = data[pokemonDataOffset + 27];
  const ivByte2 = data[pokemonDataOffset + 28];
  // IVs: AAAA DDDD SSSS PPPP (Attack, Defense, Speed, Special)
  const attackIV = (ivByte1 >> 4) & 0x0F;
  const defenseIV = ivByte1 & 0x0F;
  const speedIV = (ivByte2 >> 4) & 0x0F;
  const specialIV = ivByte2 & 0x0F;
  // HP IV is derived from other IVs
  const hpIV = ((attackIV & 1) << 3) | ((defenseIV & 1) << 2) | ((speedIV & 1) << 1) | (specialIV & 1);

  // PP values
  const pp1 = data[pokemonDataOffset + 29] & 0x3F;
  const pp2 = data[pokemonDataOffset + 30] & 0x3F;
  const pp3 = data[pokemonDataOffset + 31] & 0x3F;
  const pp4 = data[pokemonDataOffset + 32] & 0x3F;

  // Stats (party Pokemon only)
  const maxHp = readU16BE(data, pokemonDataOffset + 34);
  const attack = readU16BE(data, pokemonDataOffset + 36);
  const defense = readU16BE(data, pokemonDataOffset + 38);
  const speed = readU16BE(data, pokemonDataOffset + 40);
  const special = readU16BE(data, pokemonDataOffset + 42);

  const nickname = decodeGen1String(data, nicknameOffset, 11);
  const otName = decodeGen1String(data, otNameOffset, 11);

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
    special, // Gen 1 has single Special stat
    moves: [move1, move2, move3, move4].filter(m => m > 0),
    movePP: [pp1, pp2, pp3, pp4],
    exp,
    evs: {
      hp: hpEV,
      attack: attackEV,
      defense: defenseEV,
      speed: speedEV,
      special: specialEV,
    },
    ivs: {
      hp: hpIV,
      attack: attackIV,
      defense: defenseIV,
      speed: speedIV,
      special: specialIV,
    },
    otId,
    otName,
  };
}

/**
 * Read 16-bit big endian value (Gen 1/2 use big endian)
 */
function readU16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

/**
 * Parse Gen 2 Pokemon from party data
 * Gen 2 party structure is similar to Gen 1 but with held items and 48 bytes per Pokemon
 */
function parseGen2Pokemon(data: Uint8Array, partyOffset: number, index: number): Pokemon | null {
  // Party structure (Gold/Silver/Crystal):
  // partyOffset: count
  // partyOffset+1 to partyOffset+7: species list (7 bytes including terminator)
  // partyOffset+8: Pokemon data (48 bytes × 6)
  // partyOffset+296: OT names (11 bytes × 6)
  // partyOffset+362: Nicknames (11 bytes × 6)

  const pokemonDataOffset = partyOffset + 8 + (index * 48); // 8 = 1 count + 7 species list
  const otNameOffset = partyOffset + 8 + (48 * 6) + (index * 11);
  const nicknameOffset = partyOffset + 8 + (48 * 6) + (11 * 6) + (index * 11);

  const species = data[pokemonDataOffset];
  if (species === 0) return null;

  const heldItem = data[pokemonDataOffset + 1];
  const move1 = data[pokemonDataOffset + 2];
  const move2 = data[pokemonDataOffset + 3];
  const move3 = data[pokemonDataOffset + 4];
  const move4 = data[pokemonDataOffset + 5];
  const otId = readU16BE(data, pokemonDataOffset + 6);

  const exp = (data[pokemonDataOffset + 8] << 16) |
              (data[pokemonDataOffset + 9] << 8) |
              data[pokemonDataOffset + 10];

  // EVs (16-bit each, big endian)
  const hpEV = readU16BE(data, pokemonDataOffset + 11);
  const attackEV = readU16BE(data, pokemonDataOffset + 13);
  const defenseEV = readU16BE(data, pokemonDataOffset + 15);
  const speedEV = readU16BE(data, pokemonDataOffset + 17);
  const specialEV = readU16BE(data, pokemonDataOffset + 19); // Used for both SpAtk/SpDef in Gen 2

  // IVs packed in 2 bytes (same as Gen 1)
  const ivByte1 = data[pokemonDataOffset + 21];
  const ivByte2 = data[pokemonDataOffset + 22];
  const attackIV = (ivByte1 >> 4) & 0x0F;
  const defenseIV = ivByte1 & 0x0F;
  const speedIV = (ivByte2 >> 4) & 0x0F;
  const specialIV = ivByte2 & 0x0F;
  const hpIV = ((attackIV & 1) << 3) | ((defenseIV & 1) << 2) | ((speedIV & 1) << 1) | (specialIV & 1);

  // PP values
  const pp1 = data[pokemonDataOffset + 23] & 0x3F;
  const pp2 = data[pokemonDataOffset + 24] & 0x3F;
  const pp3 = data[pokemonDataOffset + 25] & 0x3F;
  const pp4 = data[pokemonDataOffset + 26] & 0x3F;

  // Friendship/Happiness
  const friendship = data[pokemonDataOffset + 27];

  // Pokerus
  const pokerus = data[pokemonDataOffset + 28];

  // Level
  const level = data[pokemonDataOffset + 31];

  // Current HP
  const currentHp = readU16BE(data, pokemonDataOffset + 34);

  // Stats (party Pokemon only)
  const maxHp = readU16BE(data, pokemonDataOffset + 36);
  const attack = readU16BE(data, pokemonDataOffset + 38);
  const defense = readU16BE(data, pokemonDataOffset + 40);
  const speed = readU16BE(data, pokemonDataOffset + 42);
  const spAttack = readU16BE(data, pokemonDataOffset + 44);
  const spDefense = readU16BE(data, pokemonDataOffset + 46);

  const nickname = decodeGen1String(data, nicknameOffset, 11); // Gen 2 uses same encoding
  const otName = decodeGen1String(data, otNameOffset, 11);

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
    heldItem,
    moves: [move1, move2, move3, move4].filter(m => m > 0),
    movePP: [pp1, pp2, pp3, pp4],
    exp,
    evs: {
      hp: hpEV,
      attack: attackEV,
      defense: defenseEV,
      speed: speedEV,
      special: specialEV, // Gen 2 EV system still uses single Special EV
    },
    ivs: {
      hp: hpIV,
      attack: attackIV,
      defense: defenseIV,
      speed: speedIV,
      special: specialIV, // Gen 2 IV system still uses single Special IV
    },
    otId,
    otName,
    friendship,
    pokerus,
  };
}

/**
 * Parse Gen 1 save data
 */
function parseGen1Save(data: Uint8Array, info: SaveInfo): SaveData {
  // Parse party Pokemon
  const party: Pokemon[] = [];
  const partyCount = data[0x2F2C];
  for (let i = 0; i < Math.min(partyCount, 6); i++) {
    const pokemon = parseGen1Pokemon(data, 0x2F2C, i);
    if (pokemon) party.push(pokemon);
  }

  // Parse inventory
  const inventory = {
    items: [] as InventoryItem[],
    keyItems: [] as InventoryItem[],
    pokeballs: [] as InventoryItem[],
    tmHm: [] as InventoryItem[],
  };

  // Items bag at 0x25C9 (count), items at 0x25CA
  const itemCount = data[0x25C9];
  for (let i = 0; i < Math.min(itemCount, 20); i++) {
    const slotOffset = 0x25CA + (i * 2);
    const itemId = data[slotOffset];
    const quantity = data[slotOffset + 1];
    if (itemId > 0 && itemId !== 0xFF) {
      inventory.items.push({
        itemId,
        itemName: GEN1_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity,
      });
    }
  }

  // PC items at 0x27E6
  const pcItemCount = data[0x27E6];
  for (let i = 0; i < Math.min(pcItemCount, 50); i++) {
    const slotOffset = 0x27E7 + (i * 2);
    const itemId = data[slotOffset];
    const quantity = data[slotOffset + 1];
    if (itemId > 0 && itemId !== 0xFF) {
      // Add to key items as "PC Storage"
      inventory.keyItems.push({
        itemId,
        itemName: GEN1_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity,
      });
    }
  }

  // Parse boxes and pokedex
  const boxes = parseGen1Boxes(data);
  const pokedex = parseGen1Pokedex(data);

  return {
    info,
    party,
    boxes,
    inventory,
    pokedex,
  };
}

/**
 * Parse Gen 2 save data
 */
function parseGen2Save(data: Uint8Array, info: SaveInfo): SaveData {
  // Parse party Pokemon
  // Gen 2 party offset: 0x288A for Gold/Silver/Crystal
  const party: Pokemon[] = [];
  const partyCount = data[0x288A];
  for (let i = 0; i < Math.min(partyCount, 6); i++) {
    const pokemon = parseGen2Pokemon(data, 0x288A, i);
    if (pokemon) party.push(pokemon);
  }

  // Parse inventory
  const inventory = {
    items: [] as InventoryItem[],
    keyItems: [] as InventoryItem[],
    pokeballs: [] as InventoryItem[],
    tmHm: [] as InventoryItem[],
  };

  // Items pocket at 0x23E7 (count), items at 0x23E8
  const itemCount = data[0x23E7];
  for (let i = 0; i < Math.min(itemCount, 20); i++) {
    const slotOffset = 0x23E8 + (i * 2);
    const itemId = data[slotOffset];
    const quantity = data[slotOffset + 1];
    if (itemId > 0 && itemId !== 0xFF) {
      inventory.items.push({
        itemId,
        itemName: GEN2_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity,
      });
    }
  }

  // Key items at 0x241F
  const keyItemCount = data[0x241F];
  for (let i = 0; i < Math.min(keyItemCount, 26); i++) {
    const itemId = data[0x2420 + i];
    if (itemId > 0 && itemId !== 0xFF) {
      inventory.keyItems.push({
        itemId,
        itemName: GEN2_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity: 1,
      });
    }
  }

  // Poke balls at 0x2439
  const ballCount = data[0x2439];
  for (let i = 0; i < Math.min(ballCount, 12); i++) {
    const slotOffset = 0x243A + (i * 2);
    const itemId = data[slotOffset];
    const quantity = data[slotOffset + 1];
    if (itemId > 0 && itemId !== 0xFF) {
      inventory.pokeballs.push({
        itemId,
        itemName: GEN2_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity,
      });
    }
  }

  // TM/HM pocket at 0x244F
  const tmCount = data[0x244F];
  for (let i = 0; i < Math.min(tmCount, 57); i++) {
    const slotOffset = 0x2450 + (i * 2);
    const itemId = data[slotOffset];
    const quantity = data[slotOffset + 1];
    if (itemId > 0 && itemId !== 0xFF) {
      inventory.tmHm.push({
        itemId,
        itemName: GEN2_ITEM_NAMES[itemId] || `Item ${itemId}`,
        quantity,
      });
    }
  }

  // Parse boxes and pokedex
  const boxes = parseGen2Boxes(data);
  const pokedex = parseGen2Pokedex(data);

  return {
    info,
    party,
    boxes,
    inventory,
    pokedex,
  };
}

/**
 * Get Gen 3 game-specific offsets
 * FireRed/LeafGreen uses different offsets than Ruby/Sapphire/Emerald
 */
function getGen3Offsets(data: Uint8Array, section0Offset: number, section1Offset: number): {
  partyCount: number;
  partyData: number;
  money: number;
  securityKey: number;
  items: number;
  keyItems: number;
  pokeballs: number;
  gameType: 'FRLG' | 'E' | 'RS';
} {
  const gameType = detectGen3GameType(data, section0Offset, section1Offset);

  if (gameType === 'FRLG') {
    // FireRed/LeafGreen offsets
    return {
      partyCount: 0x034,
      partyData: 0x038,
      money: 0x290,
      securityKey: 0xAF8, // In section 0
      items: 0x310,
      keyItems: 0x3B8,
      pokeballs: 0x430,
      gameType,
    };
  } else {
    // Ruby/Sapphire/Emerald offsets
    return {
      partyCount: 0x234,
      partyData: 0x238,
      money: 0x490,
      securityKey: 0xAC, // In section 0 (Emerald only)
      items: 0x560,
      keyItems: 0x5D8,
      pokeballs: 0x650,
      gameType,
    };
  }
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
    const signature = readU32LE(data, sectionOffset + 0xFF8);
    if (signature === 0x08012025) {
      sections[sectionId] = sectionOffset;
    }
  }

  // Get game-specific offsets
  const offsets = sections[0] !== undefined && sections[1] !== undefined
    ? getGen3Offsets(data, sections[0], sections[1])
    : { partyCount: 0x234, partyData: 0x238, items: 0x560, keyItems: 0x5D8, pokeballs: 0x650, gameType: 'RS' as const, money: 0x490, securityKey: 0xAC };

  // Parse party Pokemon (section 1)
  const party: Pokemon[] = [];
  if (sections[1] !== undefined) {
    const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
    for (let i = 0; i < Math.min(partyCount, 6); i++) {
      const pokemon = parseGen3Pokemon(data, sections[1] + offsets.partyData + (i * 100));
      if (pokemon) party.push(pokemon);
    }
  }

  // Parse PC boxes (sections 5-13)
  const boxes = parseGen3Boxes(data);

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
      const itemId = readU16LE(data, sections[1] + offsets.items + (i * 4));
      const quantity = readU16LE(data, sections[1] + offsets.items + 2 + (i * 4));
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
      const itemId = readU16LE(data, sections[1] + offsets.keyItems + (i * 4));
      const quantity = readU16LE(data, sections[1] + offsets.keyItems + 2 + (i * 4));
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
      const itemId = readU16LE(data, sections[1] + offsets.pokeballs + (i * 4));
      const quantity = readU16LE(data, sections[1] + offsets.pokeballs + 2 + (i * 4));
      if (itemId > 0) {
        inventory.pokeballs.push({
          itemId,
          itemName: ITEM_NAMES[itemId] || `Item ${itemId}`,
          quantity,
        });
      }
    }
  }

  // Parse pokedex
  const pokedex = parseGen3Pokedex(data);

  return {
    info,
    party,
    boxes,
    inventory,
    pokedex,
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
  // order[i] tells us what TYPE is at position i
  // order.indexOf(type) tells us what POSITION the type is at
  const order = getSubstructOrder(substructOrder);

  // Growth substructure (type 0)
  const growthOffset = order.indexOf(0) * 12;
  const species = readU16LE(encryptedData, growthOffset);
  const heldItem = readU16LE(encryptedData, growthOffset + 2);
  const exp = readU32LE(encryptedData, growthOffset + 4);

  // Attacks substructure (type 1)
  const attacksOffset = order.indexOf(1) * 12;
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

  // EVs & Condition substructure (type 2)
  const evsOffset = order.indexOf(2) * 12;
  const evs = {
    hp: readU8(encryptedData, evsOffset),
    attack: readU8(encryptedData, evsOffset + 1),
    defense: readU8(encryptedData, evsOffset + 2),
    speed: readU8(encryptedData, evsOffset + 3),
    spAttack: readU8(encryptedData, evsOffset + 4),
    spDefense: readU8(encryptedData, evsOffset + 5),
  };

  // Misc substructure (type 3)
  const miscOffset = order.indexOf(3) * 12;
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
  } else if (generation === 1) {
    // Gen 1: Trainer name at 0x2598 (max 7 chars + terminator)
    const encoded = encodeGen1String(name, 11);
    for (let i = 0; i < 11; i++) {
      data[0x2598 + i] = encoded[i];
    }
    updateGen1Checksum(data);
  } else if (generation === 2) {
    // Gen 2: Trainer name at 0x200B (max 7 chars + terminator)
    const encoded = encodeGen1String(name, 11); // Gen 2 uses Gen 1 encoding
    for (let i = 0; i < 11; i++) {
      data[0x200B + i] = encoded[i];
    }
    updateGen2Checksum(data);
  }
}

export function setMoney(data: Uint8Array, amount: number, generation: number): void {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    const section0Offset = sections[0];
    const section1Offset = sections[1];

    if (section0Offset === undefined || section1Offset === undefined) return;

    // Clamp amount to valid range
    const clampedAmount = Math.min(Math.max(0, amount), 999999);

    // Detect game type to determine offsets and encryption
    const gameType = detectGen3GameType(data, section0Offset, section1Offset);

    if (gameType === 'FRLG') {
      // FireRed/LeafGreen: money at 0x290, XOR with security key at section 0, offset 0xAF8
      const securityKey = readU32LE(data, section0Offset + 0xAF8);
      const encryptedMoney = (clampedAmount ^ securityKey) >>> 0;
      writeU32LE(data, section1Offset + 0x290, encryptedMoney);
      updateGen3SectionChecksum(data, section1Offset);
    } else if (gameType === 'E') {
      // Emerald: money at 0x490, XOR with security key at section 0, offset 0xAC
      const securityKey = readU32LE(data, section0Offset + 0xAC);
      const encryptedMoney = (clampedAmount ^ securityKey) >>> 0;
      writeU32LE(data, section1Offset + 0x490, encryptedMoney);
      updateGen3SectionChecksum(data, section1Offset);
    } else {
      // Ruby/Sapphire: money at 0x490, no encryption
      writeU32LE(data, section1Offset + 0x490, clampedAmount);
      updateGen3SectionChecksum(data, section1Offset);
    }
  } else if (generation === 1) {
    // Gen 1: Money at 0x25F3 in BCD format (3 bytes)
    const moneyBCD = Math.min(amount, 999999);
    // Convert to BCD: each byte stores two decimal digits
    const digit1 = Math.floor(moneyBCD / 10000);
    const digit2 = Math.floor((moneyBCD % 10000) / 100);
    const digit3 = moneyBCD % 100;
    data[0x25F3] = ((Math.floor(digit1 / 10) & 0xF) << 4) | (digit1 % 10);
    data[0x25F4] = ((Math.floor(digit2 / 10) & 0xF) << 4) | (digit2 % 10);
    data[0x25F5] = ((Math.floor(digit3 / 10) & 0xF) << 4) | (digit3 % 10);
    updateGen1Checksum(data);
  } else if (generation === 2) {
    // Gen 2: Money at 0x23DB (3 bytes, little endian)
    const money = Math.min(amount, 999999);
    data[0x23DB] = money & 0xFF;
    data[0x23DC] = (money >> 8) & 0xFF;
    data[0x23DD] = (money >> 16) & 0xFF;
    updateGen2Checksum(data);
  }
}

/**
 * Set badges for Gen 3 save
 */
export function setBadges(data: Uint8Array, badges: number, generation: number): void {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    if (sections[0] !== undefined) {
      // Badges are stored at offset 0x100 in section 0 for Ruby/Sapphire/Emerald
      // and at offset 0xEE for FireRed/LeafGreen
      // Using a common offset that works for most games
      writeU16LE(data, sections[0] + 0x100, badges & 0xFF);
      updateGen3SectionChecksum(data, sections[0]);
    }
  } else if (generation === 1) {
    data[0x2602] = badges & 0xFF;
    // Update Gen 1 checksum
    let checksum = 0;
    for (let i = 0x2598; i < 0x3523; i++) {
      checksum = (checksum + data[i]) & 0xFF;
    }
    data[0x3523] = (~checksum) & 0xFF;
  } else if (generation === 2) {
    writeU16LE(data, 0x23E5, badges & 0xFFFF);
    // Update Gen 2 checksum
    let checksum1 = 0;
    for (let i = 0x2009; i < 0x2D69; i++) {
      checksum1 = (checksum1 + data[i]) & 0xFFFF;
    }
    writeU16LE(data, 0x2D69, checksum1);
  }
}

/**
 * Set play time for Gen 3 save
 */
export function setPlayTime(
  data: Uint8Array,
  hours: number,
  minutes: number,
  seconds: number,
  generation: number
): void {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    if (sections[0] !== undefined) {
      writeU16LE(data, sections[0] + 0x0E, Math.min(999, Math.max(0, hours)));
      data[sections[0] + 0x10] = Math.min(59, Math.max(0, minutes));
      data[sections[0] + 0x11] = Math.min(59, Math.max(0, seconds));
      data[sections[0] + 0x12] = 0; // Frames
      updateGen3SectionChecksum(data, sections[0]);
    }
  } else if (generation === 1) {
    data[0x2CED] = Math.min(255, Math.max(0, hours));
    data[0x2CEE] = Math.min(59, Math.max(0, minutes));
    data[0x2CEF] = Math.min(59, Math.max(0, seconds));
    // Update Gen 1 checksum
    let checksum = 0;
    for (let i = 0x2598; i < 0x3523; i++) {
      checksum = (checksum + data[i]) & 0xFF;
    }
    data[0x3523] = (~checksum) & 0xFF;
  } else if (generation === 2) {
    data[0x2054] = Math.min(255, Math.max(0, hours));
    data[0x2055] = Math.min(59, Math.max(0, minutes));
    data[0x2056] = Math.min(59, Math.max(0, seconds));
    // Update Gen 2 checksum
    let checksum1 = 0;
    for (let i = 0x2009; i < 0x2D69; i++) {
      checksum1 = (checksum1 + data[i]) & 0xFFFF;
    }
    writeU16LE(data, 0x2D69, checksum1);
  }
}

/**
 * Add an item to inventory
 */
export function addItem(
  data: Uint8Array,
  itemId: number,
  quantity: number,
  pocket: "items" | "keyItems" | "pokeballs" | "tmHm",
  generation: number
): boolean {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    if (sections[1] === undefined) return false;

    // Pocket offsets and max slots for Gen 3
    const pocketInfo = {
      items: { offset: 0x560, maxSlots: 30 },
      keyItems: { offset: 0x5D8, maxSlots: 30 },
      pokeballs: { offset: 0x650, maxSlots: 16 },
      tmHm: { offset: 0x690, maxSlots: 64 },
    };

    const { offset, maxSlots } = pocketInfo[pocket];
    const baseOffset = sections[1] + offset;

    // Find first empty slot or existing item
    for (let i = 0; i < maxSlots; i++) {
      const slotOffset = baseOffset + (i * 4);
      const existingItemId = readU16LE(data, slotOffset);
      const existingQty = readU16LE(data, slotOffset + 2);

      if (existingItemId === itemId) {
        // Add to existing stack
        const newQty = Math.min(99, existingQty + quantity);
        writeU16LE(data, slotOffset + 2, newQty);
        updateGen3SectionChecksum(data, sections[1]);
        return true;
      }

      if (existingItemId === 0) {
        // Empty slot found
        writeU16LE(data, slotOffset, itemId);
        writeU16LE(data, slotOffset + 2, Math.min(99, quantity));
        updateGen3SectionChecksum(data, sections[1]);
        return true;
      }
    }
    return false;
  } else if (generation === 1) {
    // Gen 1: Items bag at 0x25C9 (count), items at 0x25CA
    // Only one pocket in Gen 1, all items go to main bag
    const countOffset = 0x25C9;
    const itemsOffset = 0x25CA;
    const maxItems = 20;

    const currentCount = data[countOffset];

    // Check if item already exists and add to it
    for (let i = 0; i < currentCount; i++) {
      const slotOffset = itemsOffset + (i * 2);
      if (data[slotOffset] === itemId) {
        data[slotOffset + 1] = Math.min(99, data[slotOffset + 1] + quantity);
        updateGen1Checksum(data);
        return true;
      }
    }

    // Add new item if space available
    if (currentCount < maxItems) {
      const newSlotOffset = itemsOffset + (currentCount * 2);
      data[newSlotOffset] = itemId;
      data[newSlotOffset + 1] = Math.min(99, quantity);
      data[countOffset] = currentCount + 1;
      // Add terminator
      data[newSlotOffset + 2] = 0xFF;
      updateGen1Checksum(data);
      return true;
    }
    return false;
  } else if (generation === 2) {
    // Gen 2: Items bag at 0x23E7 (count), items at 0x23E8
    // Gen 2 has separate pockets but we'll use main items for simplicity
    const countOffset = 0x23E7;
    const itemsOffset = 0x23E8;
    const maxItems = 20;

    const currentCount = data[countOffset];

    // Check if item already exists
    for (let i = 0; i < currentCount; i++) {
      const slotOffset = itemsOffset + (i * 2);
      if (data[slotOffset] === itemId) {
        data[slotOffset + 1] = Math.min(99, data[slotOffset + 1] + quantity);
        updateGen2Checksum(data);
        return true;
      }
    }

    // Add new item if space available
    if (currentCount < maxItems) {
      const newSlotOffset = itemsOffset + (currentCount * 2);
      data[newSlotOffset] = itemId;
      data[newSlotOffset + 1] = Math.min(99, quantity);
      data[countOffset] = currentCount + 1;
      // Add terminator
      data[newSlotOffset + 2] = 0xFF;
      updateGen2Checksum(data);
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Remove an item from inventory
 */
export function removeItem(
  data: Uint8Array,
  slotIndex: number,
  pocket: "items" | "keyItems" | "pokeballs" | "tmHm",
  generation: number
): boolean {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    if (sections[1] === undefined) return false;

    const pocketInfo = {
      items: { offset: 0x560, maxSlots: 30 },
      keyItems: { offset: 0x5D8, maxSlots: 30 },
      pokeballs: { offset: 0x650, maxSlots: 16 },
      tmHm: { offset: 0x690, maxSlots: 64 },
    };

    const { offset, maxSlots } = pocketInfo[pocket];
    if (slotIndex >= maxSlots) return false;

    const baseOffset = sections[1] + offset;
    const slotOffset = baseOffset + (slotIndex * 4);

    // Clear the slot
    writeU16LE(data, slotOffset, 0);
    writeU16LE(data, slotOffset + 2, 0);

    // Shift remaining items up
    for (let i = slotIndex; i < maxSlots - 1; i++) {
      const currentOffset = baseOffset + (i * 4);
      const nextOffset = baseOffset + ((i + 1) * 4);

      const nextItemId = readU16LE(data, nextOffset);
      const nextQty = readU16LE(data, nextOffset + 2);

      writeU16LE(data, currentOffset, nextItemId);
      writeU16LE(data, currentOffset + 2, nextQty);

      if (nextItemId === 0) break;
    }

    // Clear last slot
    const lastOffset = baseOffset + ((maxSlots - 1) * 4);
    writeU16LE(data, lastOffset, 0);
    writeU16LE(data, lastOffset + 2, 0);

    updateGen3SectionChecksum(data, sections[1]);
    return true;
  } else if (generation === 1) {
    const countOffset = 0x25C9;
    const itemsOffset = 0x25CA;
    const currentCount = data[countOffset];

    if (slotIndex >= currentCount) return false;

    // Shift remaining items up
    for (let i = slotIndex; i < currentCount - 1; i++) {
      const currentSlot = itemsOffset + (i * 2);
      const nextSlot = itemsOffset + ((i + 1) * 2);
      data[currentSlot] = data[nextSlot];
      data[currentSlot + 1] = data[nextSlot + 1];
    }

    // Decrease count and add terminator
    data[countOffset] = currentCount - 1;
    data[itemsOffset + ((currentCount - 1) * 2)] = 0xFF;

    updateGen1Checksum(data);
    return true;
  } else if (generation === 2) {
    const countOffset = 0x23E7;
    const itemsOffset = 0x23E8;
    const currentCount = data[countOffset];

    if (slotIndex >= currentCount) return false;

    // Shift remaining items up
    for (let i = slotIndex; i < currentCount - 1; i++) {
      const currentSlot = itemsOffset + (i * 2);
      const nextSlot = itemsOffset + ((i + 1) * 2);
      data[currentSlot] = data[nextSlot];
      data[currentSlot + 1] = data[nextSlot + 1];
    }

    // Decrease count and add terminator
    data[countOffset] = currentCount - 1;
    data[itemsOffset + ((currentCount - 1) * 2)] = 0xFF;

    updateGen2Checksum(data);
    return true;
  }

  return false;
}

/**
 * Set item quantity
 */
export function setItemQuantity(
  data: Uint8Array,
  slotIndex: number,
  quantity: number,
  pocket: "items" | "keyItems" | "pokeballs" | "tmHm",
  generation: number
): boolean {
  if (generation === 3) {
    const { sections } = getGen3SaveInfo(data);
    if (sections[1] === undefined) return false;

    const pocketInfo = {
      items: { offset: 0x560, maxSlots: 30 },
      keyItems: { offset: 0x5D8, maxSlots: 30 },
      pokeballs: { offset: 0x650, maxSlots: 16 },
      tmHm: { offset: 0x690, maxSlots: 64 },
    };

    const { offset, maxSlots } = pocketInfo[pocket];
    if (slotIndex >= maxSlots) return false;

    const slotOffset = sections[1] + offset + (slotIndex * 4);
    const itemId = readU16LE(data, slotOffset);

    if (itemId === 0) return false; // No item in slot

    writeU16LE(data, slotOffset + 2, Math.min(99, Math.max(1, quantity)));
    updateGen3SectionChecksum(data, sections[1]);
    return true;
  } else if (generation === 1) {
    const countOffset = 0x25C9;
    const itemsOffset = 0x25CA;
    const currentCount = data[countOffset];

    if (slotIndex >= currentCount) return false;

    const slotOffset = itemsOffset + (slotIndex * 2);
    if (data[slotOffset] === 0 || data[slotOffset] === 0xFF) return false;

    data[slotOffset + 1] = Math.min(99, Math.max(1, quantity));
    updateGen1Checksum(data);
    return true;
  } else if (generation === 2) {
    const countOffset = 0x23E7;
    const itemsOffset = 0x23E8;
    const currentCount = data[countOffset];

    if (slotIndex >= currentCount) return false;

    const slotOffset = itemsOffset + (slotIndex * 2);
    if (data[slotOffset] === 0 || data[slotOffset] === 0xFF) return false;

    data[slotOffset + 1] = Math.min(99, Math.max(1, quantity));
    updateGen2Checksum(data);
    return true;
  }

  return false;
}

function updateGen3SectionChecksum(data: Uint8Array, sectionOffset: number): void {
  let checksum = 0;
  for (let i = 0; i < 0xFF4; i += 4) {
    checksum = (checksum + readU32LE(data, sectionOffset + i)) >>> 0;
  }
  checksum = ((checksum & 0xFFFF) + (checksum >>> 16)) & 0xFFFF;
  writeU16LE(data, sectionOffset + 0xFF6, checksum);
}

/**
 * Update Gen 1 save checksum
 * Checksum is complement of sum of bytes from 0x2598 to 0x3522
 */
function updateGen1Checksum(data: Uint8Array): void {
  let checksum = 0;
  for (let i = 0x2598; i < 0x3523; i++) {
    checksum = (checksum + data[i]) & 0xFF;
  }
  data[0x3523] = (~checksum) & 0xFF;
}

/**
 * Update Gen 2 save checksums
 * Gen 2 has two checksums: main data and box data
 */
function updateGen2Checksum(data: Uint8Array): void {
  // Main data checksum (0x2009 to 0x2D68)
  let checksum1 = 0;
  for (let i = 0x2009; i < 0x2D69; i++) {
    checksum1 = (checksum1 + data[i]) & 0xFFFF;
  }
  writeU16LE(data, 0x2D69, checksum1);

  // Box data checksum (0x2D6B to 0x2F2C for Crystal, varies by game)
  // For simplicity, using a common range
  let checksum2 = 0;
  for (let i = 0x2D6B; i < 0x2F2D; i++) {
    checksum2 = (checksum2 + data[i]) & 0xFFFF;
  }
  writeU16LE(data, 0x2F2D, checksum2);
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
 * Get active save offset, section map, and game-specific offsets for Gen 3 save
 */
function getGen3SaveInfo(data: Uint8Array): {
  activeSaveOffset: number;
  sections: Record<number, number>;
  offsets: {
    partyCount: number;
    partyData: number;
    money: number;
    securityKey: number;
    items: number;
    keyItems: number;
    pokeballs: number;
    gameType: 'FRLG' | 'E' | 'RS';
  };
} {
  const save1Index = readU32LE(data, 0x0FFC);
  const save2Index = readU32LE(data, 0xEFFC);
  const activeSaveOffset = save2Index > save1Index ? 0xE000 : 0;

  const sections: Record<number, number> = {};
  for (let i = 0; i < 14; i++) {
    const sectionOffset = activeSaveOffset + (i * 0x1000);
    const sectionId = readU16LE(data, sectionOffset + 0xFF4);
    sections[sectionId] = sectionOffset;
  }

  // Get game-specific offsets
  const offsets = sections[0] !== undefined && sections[1] !== undefined
    ? getGen3Offsets(data, sections[0], sections[1])
    : { partyCount: 0x234, partyData: 0x238, items: 0x560, keyItems: 0x5D8, pokeballs: 0x650, gameType: 'RS' as const, money: 0x490, securityKey: 0xAC };

  return { activeSaveOffset, sections, offsets };
}

/**
 * Encrypt/decrypt Gen 3 Pokemon substructure data
 */
function cryptGen3Substructure(data: Uint8Array, pokemonOffset: number, _action: 'encrypt' | 'decrypt'): Uint8Array {
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
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Misc substructure contains IVs (type 3)
  const miscOffset = order.indexOf(3) * 12;

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
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // EVs & Condition substructure (type 2)
  const evsOffset = order.indexOf(2) * 12;

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
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const nature = personality % 25;
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Decrypt to read species, IVs, EVs
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Read species from growth substructure (type 0)
  const growthOffset = order.indexOf(0) * 12;
  const species = readU16LE(substructure, growthOffset);

  // Read EVs (type 2)
  const evsOffset = order.indexOf(2) * 12;
  const evs = {
    hp: readU8(substructure, evsOffset),
    attack: readU8(substructure, evsOffset + 1),
    defense: readU8(substructure, evsOffset + 2),
    speed: readU8(substructure, evsOffset + 3),
    spAttack: readU8(substructure, evsOffset + 4),
    spDefense: readU8(substructure, evsOffset + 5),
  };

  // Read IVs (type 3)
  const miscOffset = order.indexOf(3) * 12;
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
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
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
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
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

// ============================================
// GEN 1 POKEMON STAT EDITING
// ============================================

/**
 * Write 16-bit big endian value (Gen 1/2 use big endian)
 */
function writeU16BE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 8) & 0xFF;
  data[offset + 1] = value & 0xFF;
}

/**
 * Set Pokemon IVs for Gen 1
 * Gen 1 IVs are 4 bits each, packed into 2 bytes: AAAA DDDD SSSS PPPP
 * HP IV is derived from other IVs (LSBs)
 */
export function setGen1PokemonIVs(
  data: Uint8Array,
  partyIndex: number,
  ivs: { attack: number; defense: number; speed: number; special: number }
): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 44);

  // Clamp IVs to 0-15 (Gen 1/2 use 4-bit IVs)
  const attackIV = Math.min(15, Math.max(0, ivs.attack));
  const defenseIV = Math.min(15, Math.max(0, ivs.defense));
  const speedIV = Math.min(15, Math.max(0, ivs.speed));
  const specialIV = Math.min(15, Math.max(0, ivs.special));

  // Pack IVs: byte1 = AAAA DDDD, byte2 = SSSS PPPP
  const ivByte1 = ((attackIV & 0x0F) << 4) | (defenseIV & 0x0F);
  const ivByte2 = ((speedIV & 0x0F) << 4) | (specialIV & 0x0F);

  data[pokemonDataOffset + 27] = ivByte1;
  data[pokemonDataOffset + 28] = ivByte2;

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon EVs for Gen 1
 * Gen 1/2 EVs are 16-bit values (0-65535), stored in big endian
 */
export function setGen1PokemonEVs(
  data: Uint8Array,
  partyIndex: number,
  evs: { hp: number; attack: number; defense: number; speed: number; special: number }
): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 44);

  // Gen 1/2 EVs can go up to 65535, but typically 0-65535 is used
  // Most trainers set them to 65535 for max stats
  writeU16BE(data, pokemonDataOffset + 17, Math.min(65535, Math.max(0, evs.hp)));
  writeU16BE(data, pokemonDataOffset + 19, Math.min(65535, Math.max(0, evs.attack)));
  writeU16BE(data, pokemonDataOffset + 21, Math.min(65535, Math.max(0, evs.defense)));
  writeU16BE(data, pokemonDataOffset + 23, Math.min(65535, Math.max(0, evs.speed)));
  writeU16BE(data, pokemonDataOffset + 25, Math.min(65535, Math.max(0, evs.special)));

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon level for Gen 1 and recalculate stats
 */
export function setGen1PokemonLevel(data: Uint8Array, partyIndex: number, level: number): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 44);
  const clampedLevel = Math.min(100, Math.max(1, level));

  // Set level at offset 33
  data[pokemonDataOffset + 33] = clampedLevel;

  // Note: Recalculating stats would require base stats data
  // For now, just update the level - stats will update when loaded in-game

  updateGen1Checksum(data);
  return true;
}

/**
 * Heal Gen 1 Pokemon to full HP
 */
export function healGen1Pokemon(data: Uint8Array, partyIndex: number): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 44);
  const maxHp = readU16BE(data, pokemonDataOffset + 34);
  writeU16BE(data, pokemonDataOffset + 1, maxHp);

  // Clear status condition
  data[pokemonDataOffset + 4] = 0;

  updateGen1Checksum(data);
  return true;
}

/**
 * Set perfect IVs and max EVs for Gen 1 Pokemon
 */
export function setPerfectGen1Pokemon(data: Uint8Array, partyIndex: number): boolean {
  // Max Gen 1 IVs (15 each)
  const maxIVs = { attack: 15, defense: 15, speed: 15, special: 15 };

  // Max Gen 1 EVs (65535 each)
  const maxEVs = { hp: 65535, attack: 65535, defense: 65535, speed: 65535, special: 65535 };

  if (!setGen1PokemonIVs(data, partyIndex, maxIVs)) return false;
  if (!setGen1PokemonEVs(data, partyIndex, maxEVs)) return false;
  if (!setGen1PokemonLevel(data, partyIndex, 100)) return false;
  healGen1Pokemon(data, partyIndex);

  return true;
}

// ============================================
// GEN 2 POKEMON STAT EDITING
// ============================================

/**
 * Set Pokemon IVs for Gen 2
 * Gen 2 IVs are identical format to Gen 1
 */
export function setGen2PokemonIVs(
  data: Uint8Array,
  partyIndex: number,
  ivs: { attack: number; defense: number; speed: number; special: number }
): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 48);

  // Clamp IVs to 0-15
  const attackIV = Math.min(15, Math.max(0, ivs.attack));
  const defenseIV = Math.min(15, Math.max(0, ivs.defense));
  const speedIV = Math.min(15, Math.max(0, ivs.speed));
  const specialIV = Math.min(15, Math.max(0, ivs.special));

  // Pack IVs: byte1 = AAAA DDDD, byte2 = SSSS PPPP
  const ivByte1 = ((attackIV & 0x0F) << 4) | (defenseIV & 0x0F);
  const ivByte2 = ((speedIV & 0x0F) << 4) | (specialIV & 0x0F);

  data[pokemonDataOffset + 21] = ivByte1;
  data[pokemonDataOffset + 22] = ivByte2;

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon EVs for Gen 2
 */
export function setGen2PokemonEVs(
  data: Uint8Array,
  partyIndex: number,
  evs: { hp: number; attack: number; defense: number; speed: number; special: number }
): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 48);

  writeU16BE(data, pokemonDataOffset + 11, Math.min(65535, Math.max(0, evs.hp)));
  writeU16BE(data, pokemonDataOffset + 13, Math.min(65535, Math.max(0, evs.attack)));
  writeU16BE(data, pokemonDataOffset + 15, Math.min(65535, Math.max(0, evs.defense)));
  writeU16BE(data, pokemonDataOffset + 17, Math.min(65535, Math.max(0, evs.speed)));
  writeU16BE(data, pokemonDataOffset + 19, Math.min(65535, Math.max(0, evs.special)));

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon level for Gen 2
 */
export function setGen2PokemonLevel(data: Uint8Array, partyIndex: number, level: number): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 48);
  const clampedLevel = Math.min(100, Math.max(1, level));

  // Set level at offset 31
  data[pokemonDataOffset + 31] = clampedLevel;

  updateGen2Checksum(data);
  return true;
}

/**
 * Heal Gen 2 Pokemon to full HP
 */
export function healGen2Pokemon(data: Uint8Array, partyIndex: number): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 48);
  const maxHp = readU16BE(data, pokemonDataOffset + 36);
  writeU16BE(data, pokemonDataOffset + 34, maxHp);

  // Clear status condition (offset varies but typically 0)
  data[pokemonDataOffset + 29] = 0;

  updateGen2Checksum(data);
  return true;
}

/**
 * Set perfect IVs and max EVs for Gen 2 Pokemon
 */
export function setPerfectGen2Pokemon(data: Uint8Array, partyIndex: number): boolean {
  const maxIVs = { attack: 15, defense: 15, speed: 15, special: 15 };
  const maxEVs = { hp: 65535, attack: 65535, defense: 65535, speed: 65535, special: 65535 };

  if (!setGen2PokemonIVs(data, partyIndex, maxIVs)) return false;
  if (!setGen2PokemonEVs(data, partyIndex, maxEVs)) return false;
  if (!setGen2PokemonLevel(data, partyIndex, 100)) return false;
  healGen2Pokemon(data, partyIndex);

  return true;
}

// ============================================
// POKEMON NICKNAME EDITING
// ============================================

/**
 * Set Pokemon nickname for Gen 1
 */
export function setGen1PokemonNickname(
  data: Uint8Array,
  partyIndex: number,
  nickname: string
): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  // Nickname offset: partyOffset + 8 + (44*6) + (11*6) + (partyIndex * 11)
  const nicknameOffset = partyOffset + 8 + (44 * 6) + (11 * 6) + (partyIndex * 11);
  const encoded = encodeGen1String(nickname.toUpperCase(), 11);
  data.set(encoded, nicknameOffset);

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon nickname for Gen 2
 */
export function setGen2PokemonNickname(
  data: Uint8Array,
  partyIndex: number,
  nickname: string
): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  // Nickname offset: partyOffset + 8 + (48*6) + (11*6) + (partyIndex * 11)
  const nicknameOffset = partyOffset + 8 + (48 * 6) + (11 * 6) + (partyIndex * 11);
  const encoded = encodeGen1String(nickname.toUpperCase(), 11); // Gen 2 uses same encoding
  data.set(encoded, nicknameOffset);

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon nickname for Gen 3
 */
export function setGen3PokemonNickname(
  data: Uint8Array,
  partyIndex: number,
  nickname: string
): boolean {
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  // Nickname is at offset 8 in the Pokemon structure (10 bytes)
  const encoded = encodeGen3String(nickname, 10);
  data.set(encoded, pokemonOffset + 8);

  updateGen3SectionChecksum(data, sections[1]);
  return true;
}

// ============================================
// POKEMON SPECIES CHANGING
// ============================================

// Reverse mapping for Gen 1 species (National Dex to Internal Index)
const SPECIES_TO_GEN1_INDEX: Record<number, number> = Object.fromEntries(
  Object.entries(GEN1_INDEX_TO_SPECIES).map(([k, v]) => [v, parseInt(k)])
);

/**
 * Set Pokemon species for Gen 1
 * Note: This only changes the species ID, stats won't be recalculated
 */
export function setGen1PokemonSpecies(
  data: Uint8Array,
  partyIndex: number,
  species: number
): boolean {
  const partyOffset = 0x2F2C;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  // Convert National Dex number to Gen 1 internal index
  const internalIndex = SPECIES_TO_GEN1_INDEX[species] || species;
  if (internalIndex === undefined || internalIndex > 190) return false;

  // Update species in species list
  data[partyOffset + 1 + partyIndex] = internalIndex;

  // Update species in Pokemon data
  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 44);
  data[pokemonDataOffset] = internalIndex;

  // Update nickname to species name
  const speciesName = POKEMON_NAMES[species] || `POKEMON`;
  setGen1PokemonNickname(data, partyIndex, speciesName);

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon species for Gen 2
 */
export function setGen2PokemonSpecies(
  data: Uint8Array,
  partyIndex: number,
  species: number
): boolean {
  const partyOffset = 0x288A;
  const partyCount = data[partyOffset];
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  if (species < 1 || species > 251) return false; // Gen 2 has 251 Pokemon

  // Update species in species list
  data[partyOffset + 1 + partyIndex] = species;

  // Update species in Pokemon data
  const pokemonDataOffset = partyOffset + 8 + (partyIndex * 48);
  data[pokemonDataOffset] = species;

  // Update nickname to species name
  const speciesName = POKEMON_NAMES[species] || `POKEMON`;
  setGen2PokemonNickname(data, partyIndex, speciesName);

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon species for Gen 3
 */
export function setGen3PokemonSpecies(
  data: Uint8Array,
  partyIndex: number,
  species: number
): boolean {
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  if (species < 1 || species > 386) return false; // Gen 3 has 386 Pokemon

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Species is in growth substructure (type 0)
  const growthOffset = order.indexOf(0) * 12;
  writeU16LE(substructure, growthOffset, species);

  // Write back encrypted
  writeGen3Substructure(data, pokemonOffset, substructure);

  // Update species in party data (offset 32)
  writeU16LE(data, pokemonOffset + 32, species);

  // Update nickname
  const speciesName = POKEMON_NAMES[species] || `POKEMON`;
  setGen3PokemonNickname(data, partyIndex, speciesName);

  updateGen3SectionChecksum(data, sections[1]);
  return true;
}

/**
 * Set Pokemon moves for Gen 3
 */
export function setGen3PokemonMoves(
  data: Uint8Array,
  partyIndex: number,
  moves: [number, number, number, number],
  pp?: [number, number, number, number]
): boolean {
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);
  const personality = readU32LE(data, pokemonOffset);
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Decrypt substructure
  const substructure = cryptGen3Substructure(data, pokemonOffset, 'decrypt');

  // Attacks substructure contains moves (type 1)
  const attacksOffset = order.indexOf(1) * 12;

  // Write moves (2 bytes each, 4 moves)
  for (let i = 0; i < 4; i++) {
    writeU16LE(substructure, attacksOffset + (i * 2), moves[i] || 0);
  }

  // Write PP (1 byte each, 4 PP values)
  const defaultPP = [35, 35, 35, 35]; // Default PP if not specified
  const ppValues = pp || defaultPP;
  for (let i = 0; i < 4; i++) {
    writeU8(substructure, attacksOffset + 8 + i, ppValues[i] || 0);
  }

  // Write back encrypted
  writeGen3Substructure(data, pokemonOffset, substructure);

  updateGen3SectionChecksum(data, sections[1]);
  return true;
}

/**
 * Toggle shiny status for Gen 3 Pokemon
 * Shiny is determined by: (trainerId XOR secretId XOR (personality upper 16 bits) XOR (personality lower 16 bits)) < 8
 * To make shiny, we modify the personality to achieve this
 */
export function toggleGen3Shiny(data: Uint8Array, partyIndex: number): boolean {
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);

  // Read current values
  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  const trainerId = otId & 0xFFFF;
  const secretId = (otId >> 16) & 0xFFFF;

  const p1 = personality & 0xFFFF;
  const p2 = (personality >> 16) & 0xFFFF;

  // Check if currently shiny
  const shinyValue = trainerId ^ secretId ^ p1 ^ p2;
  const isShiny = shinyValue < 8;

  if (isShiny) {
    // Make non-shiny: Set p2 to make shinyValue >= 8
    // We modify the upper 16 bits of personality while preserving nature/ability
    const newP2 = (trainerId ^ secretId ^ p1 ^ 8) & 0xFFFF;
    const newPersonality = (newP2 << 16) | p1;
    writeU32LE(data, pokemonOffset, newPersonality);
  } else {
    // Make shiny: Set p2 to make shinyValue < 8 (we'll use 0)
    const newP2 = (trainerId ^ secretId ^ p1) & 0xFFFF;
    const newPersonality = (newP2 << 16) | p1;
    writeU32LE(data, pokemonOffset, newPersonality);
  }

  // Re-encrypt the substructure with new personality
  // Decrypt with old key, encrypt with new key
  const oldKey = personality ^ otId;
  const newPersonality = readU32LE(data, pokemonOffset);
  const newKey = newPersonality ^ otId;

  // Read encrypted data
  const encryptedData = new Uint8Array(48);
  for (let i = 0; i < 48; i++) {
    encryptedData[i] = data[pokemonOffset + 32 + i];
  }

  // Decrypt with old key
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(encryptedData, i);
    writeU32LE(encryptedData, i, value ^ oldKey);
  }

  // Encrypt with new key
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(encryptedData, i);
    writeU32LE(encryptedData, i, value ^ newKey);
  }

  // Write back
  for (let i = 0; i < 48; i++) {
    data[pokemonOffset + 32 + i] = encryptedData[i];
  }

  updateGen3SectionChecksum(data, sections[1]);
  return true;
}

/**
 * Check if a Gen 3 Pokemon is shiny
 */
export function isGen3PokemonShiny(data: Uint8Array, partyIndex: number): boolean {
  const { sections, offsets } = getGen3SaveInfo(data);
  if (sections[1] === undefined) return false;

  const partyCount = readU32LE(data, sections[1] + offsets.partyCount);
  if (partyIndex >= partyCount || partyIndex < 0) return false;

  const pokemonOffset = sections[1] + offsets.partyData + (partyIndex * 100);

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  const trainerId = otId & 0xFFFF;
  const secretId = (otId >> 16) & 0xFFFF;

  const p1 = personality & 0xFFFF;
  const p2 = (personality >> 16) & 0xFFFF;

  const shinyValue = trainerId ^ secretId ^ p1 ^ p2;
  return shinyValue < 8;
}

/**
 * Add a new Pokemon to the PC Box for Gen 3
 * PC Pokemon are 80 bytes (no party stats like the 100-byte party format)
 * PC data spans sections 5-13
 */
export function addGen3Pokemon(
  data: Uint8Array,
  species: number,
  level: number,
  options?: {
    nickname?: string;
    moves?: [number, number, number, number];
    shiny?: boolean;
    ivs?: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number };
    evs?: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number };
    boxIndex?: number; // Which box (0-13), defaults to 0
    slotIndex?: number; // Which slot (0-29), defaults to first empty slot
  }
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[0] === undefined || sections[5] === undefined) return false;

  if (species < 1 || species > 386) return false;

  // Read trainer info from section 0
  const trainerId = readU16LE(data, sections[0] + 0x0A);
  const secretId = readU16LE(data, sections[0] + 0x0C);
  const fullOtId = (secretId << 16) | trainerId;

  // Determine box and slot
  const targetBox = options?.boxIndex ?? 0;
  const targetSlot = options?.slotIndex ?? findFirstEmptyPCSlot(data, sections, targetBox);

  if (targetBox < 0 || targetBox > 13) return false;
  if (targetSlot < 0 || targetSlot > 29) return false;
  if (targetSlot === -1) return false; // Box is full

  // Calculate the Pokemon offset in PC storage
  // PC data structure:
  // - Offset 0-3: Current box index (in section 5)
  // - Offset 4+: Box Pokemon data (each Pokemon = 80 bytes, each box = 30 Pokemon)
  // - Box data spans sections 5-13
  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, targetBox, targetSlot);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  // Generate personality value
  let personality = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;

  // If shiny is requested, adjust personality
  if (options?.shiny) {
    const p1 = personality & 0xFFFF;
    const targetP2 = (trainerId ^ secretId ^ p1) & 0xFFFF;
    personality = (targetP2 << 16) | p1;
  }

  // Write Pokemon structure (80 bytes for PC)
  writeU32LE(data, pokemonOffset, personality); // Personality
  writeU32LE(data, pokemonOffset + 4, fullOtId); // OT ID

  // Nickname (offset 8, 10 bytes)
  const pokemonName = options?.nickname || POKEMON_NAMES[species] || "POKEMON";
  const encodedNickname = encodeGen3String(pokemonName.toUpperCase(), 10);
  for (let i = 0; i < 10; i++) {
    data[pokemonOffset + 8 + i] = encodedNickname[i];
  }

  // Language (offset 18, single byte: 1=JP, 2=EN, 3=FR, 4=IT, 5=DE, 7=ES)
  data[pokemonOffset + 18] = 2; // English

  // Flags byte (offset 19) - bit 7 = has species, other bits unused
  data[pokemonOffset + 19] = 0;

  // OT Name (offset 20, 7 bytes)
  const trainerName = decodeGen3String(data, sections[0], 7);
  const encodedOtName = encodeGen3String(trainerName, 7);
  for (let i = 0; i < 7; i++) {
    data[pokemonOffset + 20 + i] = encodedOtName[i];
  }

  // Markings (offset 27)
  data[pokemonOffset + 27] = 0;

  // Checksum placeholder (offset 28)
  writeU16LE(data, pokemonOffset + 28, 0);

  // Padding (offset 30)
  writeU16LE(data, pokemonOffset + 30, 0);

  // Create substructure data (48 bytes)
  const substructure = new Uint8Array(48);
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Find the POSITION of each substructure type (0=Growth, 1=Attacks, 2=EVs, 3=Misc)
  const growthOffset = order.indexOf(0) * 12;
  const attacksOffset = order.indexOf(1) * 12;
  const evsOffset = order.indexOf(2) * 12;
  const miscOffset = order.indexOf(3) * 12;

  // Growth substructure (type 0)
  writeU16LE(substructure, growthOffset, species); // Species
  writeU16LE(substructure, growthOffset + 2, 0); // Held item
  const exp = Math.pow(level, 3); // Simplified exp calculation
  writeU32LE(substructure, growthOffset + 4, exp); // Experience
  substructure[growthOffset + 8] = 0; // PP bonuses
  substructure[growthOffset + 9] = 70; // Friendship
  substructure[growthOffset + 10] = 0; // Unused
  substructure[growthOffset + 11] = 0; // Unused

  // Attacks substructure (type 1)
  const defaultMoves = options?.moves || [33, 0, 0, 0]; // Tackle as default
  for (let i = 0; i < 4; i++) {
    writeU16LE(substructure, attacksOffset + (i * 2), defaultMoves[i]);
  }
  // PP values
  const ppValues = [35, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    substructure[attacksOffset + 8 + i] = ppValues[i];
  }

  // EVs & Condition substructure (type 2)
  const evs = options?.evs || { hp: 0, attack: 0, defense: 0, speed: 0, spAttack: 0, spDefense: 0 };
  substructure[evsOffset] = Math.min(255, evs.hp);
  substructure[evsOffset + 1] = Math.min(255, evs.attack);
  substructure[evsOffset + 2] = Math.min(255, evs.defense);
  substructure[evsOffset + 3] = Math.min(255, evs.speed);
  substructure[evsOffset + 4] = Math.min(255, evs.spAttack);
  substructure[evsOffset + 5] = Math.min(255, evs.spDefense);
  // Contest conditions (offset 6-11)
  for (let i = 6; i < 12; i++) {
    substructure[evsOffset + i] = 0;
  }

  // Misc substructure (type 3)
  substructure[miscOffset] = 0; // Pokerus
  substructure[miscOffset + 1] = 88; // Met location (88 = Pallet Town for FRLG)
  // Origins info (offset 2-3): bits 0-6 = level met, 7-10 = game of origin, 11-14 = ball, 15 = OT gender
  const pokeBall = 4; // Poke Ball
  const gameOfOrigin = 4; // FireRed
  const originsInfo = (level & 0x7F) | ((gameOfOrigin & 0xF) << 7) | ((pokeBall & 0xF) << 11);
  writeU16LE(substructure, miscOffset + 2, originsInfo);
  // IVs, Egg, and Ability (offset 4-7)
  const ivs = options?.ivs || { hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31 };
  const ivData =
    (ivs.hp & 0x1F) |
    ((ivs.attack & 0x1F) << 5) |
    ((ivs.defense & 0x1F) << 10) |
    ((ivs.speed & 0x1F) << 15) |
    ((ivs.spAttack & 0x1F) << 20) |
    ((ivs.spDefense & 0x1F) << 25);
  writeU32LE(substructure, miscOffset + 4, ivData);
  // Ribbons (offset 8-11)
  writeU32LE(substructure, miscOffset + 8, 0);

  // Calculate substructure checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Encrypt and write substructure
  const encryptKey = personality ^ fullOtId;
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // PC Pokemon don't have party data (bytes 80-99) - they're only 80 bytes

  // Update the section checksum for the section containing this Pokemon
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Find the first empty slot in a PC box
 * Returns slot index (0-29) or -1 if box is full
 */
function findFirstEmptyPCSlot(
  data: Uint8Array,
  sections: Record<number, number>,
  boxIndex: number
): number {
  for (let slot = 0; slot < 30; slot++) {
    const offset = getPCPokemonOffset(data, sections, boxIndex, slot);
    if (offset === -1) continue;

    const personality = readU32LE(data, offset);
    const otId = readU32LE(data, offset + 4);

    // Empty slot if both PID and OT ID are 0
    if (personality === 0 && otId === 0) {
      return slot;
    }
  }
  return -1; // Box is full
}

/**
 * Get the absolute offset for a Pokemon in PC storage along with the section info
 * PC data starts at section 5, offset 4 (after current box index)
 * Each Pokemon is 80 bytes, each box has 30 Pokemon
 * Returns { pokemonOffset, sectionOffset, sectionId } or null if invalid
 */
function getPCPokemonOffsetWithSection(
  data: Uint8Array,
  sections: Record<number, number>,
  boxIndex: number,
  slotIndex: number
): { pokemonOffset: number; sectionOffset: number; sectionId: number } | null {
  if (boxIndex < 0 || boxIndex > 13) return null;
  if (slotIndex < 0 || slotIndex > 29) return null;

  // Calculate the global byte offset within PC data
  // PC data layout: 4 bytes header + (box * 30 * 80) + (slot * 80)
  const pcDataOffset = 4 + (boxIndex * 30 * 80) + (slotIndex * 80);

  // PC data spans sections 5-13
  // Each section has 0x0F80 (3968) bytes of usable data for sections 5-12
  // Section 13 has 0x07D0 (2000) bytes
  const sectionSizes = [3968, 3968, 3968, 3968, 3968, 3968, 3968, 3968, 2000]; // Sections 5-13

  let remainingOffset = pcDataOffset;
  let sectionIdx = 5;

  while (sectionIdx <= 13) {
    const sectionSize = sectionSizes[sectionIdx - 5];
    if (remainingOffset < sectionSize) {
      // Pokemon is in this section
      if (sections[sectionIdx] === undefined) return null;
      return {
        pokemonOffset: sections[sectionIdx] + remainingOffset,
        sectionOffset: sections[sectionIdx],
        sectionId: sectionIdx,
      };
    }
    remainingOffset -= sectionSize;
    sectionIdx++;
  }

  return null; // Offset out of range
}

/**
 * Legacy function for backwards compatibility
 */
function getPCPokemonOffset(
  data: Uint8Array,
  sections: Record<number, number>,
  boxIndex: number,
  slotIndex: number
): number {
  const result = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  return result ? result.pokemonOffset : -1;
}

/**
 * Remove a Pokemon from a PC box for Gen 3
 * Clears the 80-byte slot (sets all bytes to 0)
 */
export function removeGen3Pokemon(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  if (boxIndex < 0 || boxIndex > 13) return false;
  if (slotIndex < 0 || slotIndex > 29) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  // Check if slot has a Pokemon
  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false; // Slot already empty

  // Clear the 80-byte Pokemon data
  for (let i = 0; i < 80; i++) {
    data[pokemonOffset + i] = 0;
  }

  // Update the section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set IVs for a Pokemon in PC box (Gen 3)
 */
export function setGen3BoxPokemonIVs(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  ivs: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number }
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Decrypt substructure
  const encryptKey = personality ^ otId;
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ encryptKey);
  }

  // Find misc substructure offset
  const order = getSubstructOrder(personality % 24);
  const miscOffset = order.indexOf(3) * 12;

  // Read current IV data to preserve egg/ability flags
  const currentIVData = readU32LE(substructure, miscOffset + 4);
  const eggFlag = currentIVData & 0x40000000;
  const abilityFlag = currentIVData & 0x80000000;

  // Set new IVs
  const ivData =
    (ivs.hp & 0x1F) |
    ((ivs.attack & 0x1F) << 5) |
    ((ivs.defense & 0x1F) << 10) |
    ((ivs.speed & 0x1F) << 15) |
    ((ivs.spAttack & 0x1F) << 20) |
    ((ivs.spDefense & 0x1F) << 25) |
    eggFlag |
    abilityFlag;

  writeU32LE(substructure, miscOffset + 4, ivData);

  // Recalculate checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Re-encrypt and write substructure
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set EVs for a Pokemon in PC box (Gen 3)
 */
export function setGen3BoxPokemonEVs(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  evs: { hp: number; attack: number; defense: number; speed: number; spAttack: number; spDefense: number }
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Decrypt substructure
  const encryptKey = personality ^ otId;
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ encryptKey);
  }

  // Find EVs substructure offset
  const order = getSubstructOrder(personality % 24);
  const evsOffset = order.indexOf(2) * 12;

  // Set EVs (clamped to 0-255, total max 510)
  const total = evs.hp + evs.attack + evs.defense + evs.speed + evs.spAttack + evs.spDefense;
  if (total > 510) return false;

  substructure[evsOffset] = Math.min(255, Math.max(0, evs.hp));
  substructure[evsOffset + 1] = Math.min(255, Math.max(0, evs.attack));
  substructure[evsOffset + 2] = Math.min(255, Math.max(0, evs.defense));
  substructure[evsOffset + 3] = Math.min(255, Math.max(0, evs.speed));
  substructure[evsOffset + 4] = Math.min(255, Math.max(0, evs.spAttack));
  substructure[evsOffset + 5] = Math.min(255, Math.max(0, evs.spDefense));

  // Recalculate checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Re-encrypt and write substructure
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set level for a Pokemon in PC box (Gen 3)
 * Note: PC Pokemon don't store level directly, only EXP. We update EXP based on level.
 */
export function setGen3BoxPokemonLevel(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  level: number
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Decrypt substructure
  const encryptKey = personality ^ otId;
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ encryptKey);
  }

  // Find growth substructure offset
  const order = getSubstructOrder(personality % 24);
  const growthOffset = order.indexOf(0) * 12;

  // Calculate EXP for level (using medium-fast growth rate as default)
  const clampedLevel = Math.min(100, Math.max(1, level));
  const exp = Math.pow(clampedLevel, 3);

  writeU32LE(substructure, growthOffset + 4, exp);

  // Recalculate checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Re-encrypt and write substructure
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set nickname for a Pokemon in PC box (Gen 3)
 */
export function setGen3BoxPokemonNickname(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  nickname: string
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Encode and write nickname (offset 8, 10 bytes)
  const encoded = encodeGen3String(nickname.toUpperCase(), 10);
  for (let i = 0; i < 10; i++) {
    data[pokemonOffset + 8 + i] = encoded[i];
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set species for a Pokemon in PC box (Gen 3)
 */
export function setGen3BoxPokemonSpecies(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  species: number
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  if (species < 1 || species > 386) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Decrypt substructure
  const encryptKey = personality ^ otId;
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ encryptKey);
  }

  // Find growth substructure offset
  const order = getSubstructOrder(personality % 24);
  const growthOffset = order.indexOf(0) * 12;

  // Set species
  writeU16LE(substructure, growthOffset, species);

  // Update nickname to match new species
  const speciesName = POKEMON_NAMES[species] || "POKEMON";
  const encoded = encodeGen3String(speciesName.toUpperCase(), 10);
  for (let i = 0; i < 10; i++) {
    data[pokemonOffset + 8 + i] = encoded[i];
  }

  // Recalculate checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Re-encrypt and write substructure
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Set moves for a Pokemon in PC box (Gen 3)
 */
export function setGen3BoxPokemonMoves(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number,
  moves: [number, number, number, number]
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  const personality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (personality === 0 && otId === 0) return false;

  // Decrypt substructure
  const encryptKey = personality ^ otId;
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ encryptKey);
  }

  // Find attacks substructure offset
  const order = getSubstructOrder(personality % 24);
  const attacksOffset = order.indexOf(1) * 12;

  // Set moves
  for (let i = 0; i < 4; i++) {
    writeU16LE(substructure, attacksOffset + (i * 2), moves[i]);
  }

  // Set default PP values based on moves
  const defaultPP = [35, 35, 35, 35]; // Default PP
  for (let i = 0; i < 4; i++) {
    substructure[attacksOffset + 8 + i] = moves[i] > 0 ? defaultPP[i] : 0;
  }

  // Recalculate checksum
  let checksum = 0;
  for (let i = 0; i < 48; i += 2) {
    checksum = (checksum + readU16LE(substructure, i)) & 0xFFFF;
  }
  writeU16LE(data, pokemonOffset + 28, checksum);

  // Re-encrypt and write substructure
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ encryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

/**
 * Toggle shiny status for a Pokemon in PC box (Gen 3)
 * This is a complex operation because changing personality requires re-encryption
 */
export function toggleGen3BoxShiny(
  data: Uint8Array,
  boxIndex: number,
  slotIndex: number
): boolean {
  const { sections } = getGen3SaveInfo(data);
  if (sections[0] === undefined || sections[5] === undefined) return false;

  const offsetInfo = getPCPokemonOffsetWithSection(data, sections, boxIndex, slotIndex);
  if (!offsetInfo) return false;
  const { pokemonOffset, sectionOffset } = offsetInfo;

  // Read current personality and OT ID
  const oldPersonality = readU32LE(data, pokemonOffset);
  const otId = readU32LE(data, pokemonOffset + 4);
  if (oldPersonality === 0 && otId === 0) return false;

  const trainerId = otId & 0xFFFF;
  const secretId = (otId >> 16) & 0xFFFF;

  // Calculate old encryption key BEFORE changing personality
  const oldEncryptKey = oldPersonality ^ otId;

  // Check current shiny status
  const p1 = oldPersonality & 0xFFFF;
  const p2 = (oldPersonality >> 16) & 0xFFFF;
  const shinyValue = trainerId ^ secretId ^ p1 ^ p2;
  const isCurrentlyShiny = shinyValue < 8;

  // Calculate new personality
  let newPersonality: number;
  if (isCurrentlyShiny) {
    // Make non-shiny by adjusting p2 to produce shinyValue >= 8
    const targetP2 = (trainerId ^ secretId ^ p1 ^ 8) & 0xFFFF;
    newPersonality = (targetP2 << 16) | p1;
  } else {
    // Make shiny by adjusting p2 to produce shinyValue = 0
    const targetP2 = (trainerId ^ secretId ^ p1) & 0xFFFF;
    newPersonality = (targetP2 << 16) | p1;
  }

  const newEncryptKey = newPersonality ^ otId;

  // Decrypt substructure with OLD key
  const substructure = new Uint8Array(48);
  for (let i = 0; i < 48; i += 4) {
    const encrypted = readU32LE(data, pokemonOffset + 32 + i);
    writeU32LE(substructure, i, encrypted ^ oldEncryptKey);
  }

  // Write new personality
  writeU32LE(data, pokemonOffset, newPersonality);

  // Re-encrypt substructure with NEW key
  for (let i = 0; i < 48; i += 4) {
    const value = readU32LE(substructure, i);
    writeU32LE(data, pokemonOffset + 32 + i, value ^ newEncryptKey);
  }

  // Update section checksum
  updateGen3SectionChecksum(data, sectionOffset);

  return true;
}

// ============================================
// PC BOX PARSING
// ============================================

/**
 * Parse Gen 1 PC boxes
 * Gen 1 has 12 boxes, each holding 20 Pokemon
 */
export function parseGen1Boxes(data: Uint8Array): Pokemon[][] {
  const boxes: Pokemon[][] = [];

  // Current box is at 0x30C0
  // Box data is stored in banks, need to check which box is active
  // For simplicity, we'll parse the current box only initially

  // Current box Pokemon count at 0x30C0
  const currentBoxOffset = 0x30C0;
  const currentBoxCount = data[currentBoxOffset];

  if (currentBoxCount > 0 && currentBoxCount <= 20) {
    const box: Pokemon[] = [];
    for (let i = 0; i < Math.min(currentBoxCount, 20); i++) {
      const pokemon = parseGen1BoxPokemon(data, currentBoxOffset, i);
      if (pokemon) box.push(pokemon);
    }
    boxes.push(box);
  }

  return boxes;
}

/**
 * Parse a Gen 1 Pokemon from box storage
 * Box Pokemon are 33 bytes each (no party stats)
 */
function parseGen1BoxPokemon(data: Uint8Array, boxOffset: number, index: number): Pokemon | null {
  // Box structure: count (1) + species list (21) + Pokemon data (33*20) + OT names (11*20) + nicknames (11*20)
  const pokemonDataOffset = boxOffset + 1 + 21 + (index * 33);
  const otNameOffset = boxOffset + 1 + 21 + (33 * 20) + (index * 11);
  const nicknameOffset = boxOffset + 1 + 21 + (33 * 20) + (11 * 20) + (index * 11);

  const internalSpecies = data[pokemonDataOffset];
  if (internalSpecies === 0) return null;

  const species = GEN1_INDEX_TO_SPECIES[internalSpecies] || internalSpecies;
  const level = data[pokemonDataOffset + 3]; // Box level is at different offset

  const nickname = decodeGen1String(data, nicknameOffset, 11);
  const otName = decodeGen1String(data, otNameOffset, 11);
  const otId = readU16BE(data, pokemonDataOffset + 6);

  // EVs (box Pokemon store these)
  const hpEV = readU16BE(data, pokemonDataOffset + 11);
  const attackEV = readU16BE(data, pokemonDataOffset + 13);
  const defenseEV = readU16BE(data, pokemonDataOffset + 15);
  const speedEV = readU16BE(data, pokemonDataOffset + 17);
  const specialEV = readU16BE(data, pokemonDataOffset + 19);

  // IVs
  const ivByte1 = data[pokemonDataOffset + 21];
  const ivByte2 = data[pokemonDataOffset + 22];
  const attackIV = (ivByte1 >> 4) & 0x0F;
  const defenseIV = ivByte1 & 0x0F;
  const speedIV = (ivByte2 >> 4) & 0x0F;
  const specialIV = ivByte2 & 0x0F;
  const hpIV = ((attackIV & 1) << 3) | ((defenseIV & 1) << 2) | ((speedIV & 1) << 1) | (specialIV & 1);

  return {
    species,
    speciesName: POKEMON_NAMES[species] || `Pokemon ${species}`,
    nickname: nickname || POKEMON_NAMES[species] || "???",
    level,
    currentHp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    special: 0,
    moves: [
      data[pokemonDataOffset + 8],
      data[pokemonDataOffset + 9],
      data[pokemonDataOffset + 10],
      data[pokemonDataOffset + 11],
    ].filter(m => m > 0),
    movePP: [0, 0, 0, 0],
    exp: (data[pokemonDataOffset + 14] << 16) | (data[pokemonDataOffset + 15] << 8) | data[pokemonDataOffset + 16],
    evs: { hp: hpEV, attack: attackEV, defense: defenseEV, speed: speedEV, special: specialEV },
    ivs: { hp: hpIV, attack: attackIV, defense: defenseIV, speed: speedIV, special: specialIV },
    otId,
    otName,
  };
}

/**
 * Parse Gen 2 PC boxes
 * Gen 2 has 14 boxes, each holding 20 Pokemon
 */
export function parseGen2Boxes(data: Uint8Array): Pokemon[][] {
  const boxes: Pokemon[][] = [];

  // Current box at 0x2D6C
  const currentBoxOffset = 0x2D6C;
  const currentBoxCount = data[currentBoxOffset];

  if (currentBoxCount > 0 && currentBoxCount <= 20) {
    const box: Pokemon[] = [];
    for (let i = 0; i < Math.min(currentBoxCount, 20); i++) {
      const pokemon = parseGen2BoxPokemon(data, currentBoxOffset, i);
      if (pokemon) box.push(pokemon);
    }
    boxes.push(box);
  }

  return boxes;
}

/**
 * Parse a Gen 2 Pokemon from box storage
 */
function parseGen2BoxPokemon(data: Uint8Array, boxOffset: number, index: number): Pokemon | null {
  // Box structure similar to Gen 1 but 32 bytes per Pokemon
  const pokemonDataOffset = boxOffset + 1 + 21 + (index * 32);
  const otNameOffset = boxOffset + 1 + 21 + (32 * 20) + (index * 11);
  const nicknameOffset = boxOffset + 1 + 21 + (32 * 20) + (11 * 20) + (index * 11);

  const species = data[pokemonDataOffset];
  if (species === 0) return null;

  const heldItem = data[pokemonDataOffset + 1];
  const level = data[pokemonDataOffset + 31] || 5;

  const nickname = decodeGen1String(data, nicknameOffset, 11);
  const otName = decodeGen1String(data, otNameOffset, 11);
  const otId = readU16BE(data, pokemonDataOffset + 6);

  return {
    species,
    speciesName: POKEMON_NAMES[species] || `Pokemon ${species}`,
    nickname: nickname || POKEMON_NAMES[species] || "???",
    level,
    currentHp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    heldItem,
    moves: [
      data[pokemonDataOffset + 2],
      data[pokemonDataOffset + 3],
      data[pokemonDataOffset + 4],
      data[pokemonDataOffset + 5],
    ].filter(m => m > 0),
    movePP: [0, 0, 0, 0],
    exp: 0,
    evs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
    ivs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
    otId,
    otName,
  };
}

/**
 * Parse Gen 3 PC boxes
 * Gen 3 has 14 boxes, each holding 30 Pokemon
 * PC data spans sections 5-13
 */
export function parseGen3Boxes(data: Uint8Array): Pokemon[][] {
  const boxes: Pokemon[][] = [];
  const { sections } = getGen3SaveInfo(data);

  // PC data starts in section 5
  // Each box Pokemon is 80 bytes (encrypted)
  // We need to combine data from multiple sections

  // For simplicity, parse first box from section 5
  if (sections[5] !== undefined) {
    const box: Pokemon[] = [];
    // Box data starts at offset 4 in section 5
    for (let i = 0; i < 30; i++) {
      const pokemonOffset = sections[5] + 4 + (i * 80);
      const pokemon = parseGen3BoxPokemon(data, pokemonOffset);
      if (pokemon) box.push(pokemon);
    }
    if (box.length > 0) boxes.push(box);
  }

  return boxes;
}

/**
 * Parse a Gen 3 Pokemon from PC box (80 bytes, no party data)
 */
function parseGen3BoxPokemon(data: Uint8Array, offset: number): Pokemon | null {
  const personality = readU32LE(data, offset);
  const otId = readU32LE(data, offset + 4);

  if (personality === 0 && otId === 0) return null;

  // Decrypt substructure
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Create a temporary 100-byte buffer with box data
  const tempData = new Uint8Array(100);
  tempData.set(data.slice(offset, offset + 80));

  const substructure = cryptGen3Substructure(tempData, 0, 'decrypt');

  // Find the POSITION of each substructure type (0=Growth, 1=Attacks, 2=EVs, 3=Misc)
  // order[i] tells us what TYPE is at position i
  // order.indexOf(type) tells us what POSITION the type is at
  const growthOffset = order.indexOf(0) * 12;
  const species = readU16LE(substructure, growthOffset);

  if (species === 0 || species > 386) return null;

  // Read other data from substructures
  const attacksOffset = order.indexOf(1) * 12;
  const evsOffset = order.indexOf(2) * 12;
  const miscOffset = order.indexOf(3) * 12;

  const exp = readU32LE(substructure, growthOffset + 4);

  const move1 = readU16LE(substructure, attacksOffset);
  const move2 = readU16LE(substructure, attacksOffset + 2);
  const move3 = readU16LE(substructure, attacksOffset + 4);
  const move4 = readU16LE(substructure, attacksOffset + 6);

  const hpEV = substructure[evsOffset];
  const attackEV = substructure[evsOffset + 1];
  const defenseEV = substructure[evsOffset + 2];
  const speedEV = substructure[evsOffset + 3];
  const spAtkEV = substructure[evsOffset + 4];
  const spDefEV = substructure[evsOffset + 5];

  const ivData = readU32LE(substructure, miscOffset + 4);
  const hpIV = ivData & 0x1F;
  const attackIV = (ivData >> 5) & 0x1F;
  const defenseIV = (ivData >> 10) & 0x1F;
  const speedIV = (ivData >> 15) & 0x1F;
  const spAtkIV = (ivData >> 20) & 0x1F;
  const spDefIV = (ivData >> 25) & 0x1F;

  const nickname = decodeGen3String(tempData, 8, 10);
  const level = tempData[84] || 5;

  return {
    species,
    speciesName: POKEMON_NAMES[species] || `Pokemon ${species}`,
    nickname: nickname || POKEMON_NAMES[species] || "???",
    level,
    currentHp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    spAttack: 0,
    spDefense: 0,
    moves: [move1, move2, move3, move4].filter(m => m > 0),
    movePP: [0, 0, 0, 0],
    exp,
    evs: {
      hp: hpEV,
      attack: attackEV,
      defense: defenseEV,
      speed: speedEV,
      spAttack: spAtkEV,
      spDefense: spDefEV,
    },
    ivs: {
      hp: hpIV,
      attack: attackIV,
      defense: defenseIV,
      speed: speedIV,
      spAttack: spAtkIV,
      spDefense: spDefIV,
    },
    otId: otId & 0xFFFF,
    otName: "",
  };
}

// ============================================
// POKEDEX EDITING
// ============================================

/**
 * Parse Gen 1 Pokedex
 */
export function parseGen1Pokedex(data: Uint8Array): { seen: number[]; caught: number[] } {
  const seen: number[] = [];
  const caught: number[] = [];

  // Pokedex owned at 0x25A3 (19 bytes for 151 Pokemon, 1 bit each)
  // Pokedex seen at 0x25B6 (19 bytes)
  const ownedOffset = 0x25A3;
  const seenOffset = 0x25B6;

  for (let i = 0; i < 151; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;

    if (data[seenOffset + byteIndex] & (1 << bitIndex)) {
      seen.push(i + 1);
    }
    if (data[ownedOffset + byteIndex] & (1 << bitIndex)) {
      caught.push(i + 1);
    }
  }

  return { seen, caught };
}

/**
 * Parse Gen 2 Pokedex
 */
export function parseGen2Pokedex(data: Uint8Array): { seen: number[]; caught: number[] } {
  const seen: number[] = [];
  const caught: number[] = [];

  // Pokedex owned at 0x2A4C (32 bytes for 251 Pokemon)
  // Pokedex seen at 0x2A6C (32 bytes)
  const ownedOffset = 0x2A4C;
  const seenOffset = 0x2A6C;

  for (let i = 0; i < 251; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;

    if (data[seenOffset + byteIndex] & (1 << bitIndex)) {
      seen.push(i + 1);
    }
    if (data[ownedOffset + byteIndex] & (1 << bitIndex)) {
      caught.push(i + 1);
    }
  }

  return { seen, caught };
}

/**
 * Parse Gen 3 Pokedex
 */
export function parseGen3Pokedex(data: Uint8Array): { seen: number[]; caught: number[] } {
  const seen: number[] = [];
  const caught: number[] = [];
  const { sections } = getGen3SaveInfo(data);

  if (sections[0] === undefined) return { seen, caught };

  // Pokedex owned at section 0 + 0x28 (49 bytes for 386 Pokemon)
  // Pokedex seen at section 0 + 0x5C (49 bytes)
  const ownedOffset = sections[0] + 0x28;
  const seenOffset = sections[0] + 0x5C;

  for (let i = 0; i < 386; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;

    if (data[seenOffset + byteIndex] & (1 << bitIndex)) {
      seen.push(i + 1);
    }
    if (data[ownedOffset + byteIndex] & (1 << bitIndex)) {
      caught.push(i + 1);
    }
  }

  return { seen, caught };
}

/**
 * Set Pokemon as seen in Gen 1 Pokedex
 */
export function setGen1PokedexSeen(data: Uint8Array, species: number, seen: boolean): boolean {
  if (species < 1 || species > 151) return false;

  const seenOffset = 0x25B6;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (seen) {
    data[seenOffset + byteIndex] |= (1 << bitIndex);
  } else {
    data[seenOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon as caught in Gen 1 Pokedex
 */
export function setGen1PokedexCaught(data: Uint8Array, species: number, caught: boolean): boolean {
  if (species < 1 || species > 151) return false;

  const ownedOffset = 0x25A3;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (caught) {
    data[ownedOffset + byteIndex] |= (1 << bitIndex);
    // Also mark as seen
    setGen1PokedexSeen(data, species, true);
  } else {
    data[ownedOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen1Checksum(data);
  return true;
}

/**
 * Set Pokemon as seen in Gen 2 Pokedex
 */
export function setGen2PokedexSeen(data: Uint8Array, species: number, seen: boolean): boolean {
  if (species < 1 || species > 251) return false;

  const seenOffset = 0x2A6C;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (seen) {
    data[seenOffset + byteIndex] |= (1 << bitIndex);
  } else {
    data[seenOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon as caught in Gen 2 Pokedex
 */
export function setGen2PokedexCaught(data: Uint8Array, species: number, caught: boolean): boolean {
  if (species < 1 || species > 251) return false;

  const ownedOffset = 0x2A4C;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (caught) {
    data[ownedOffset + byteIndex] |= (1 << bitIndex);
    setGen2PokedexSeen(data, species, true);
  } else {
    data[ownedOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen2Checksum(data);
  return true;
}

/**
 * Set Pokemon as seen in Gen 3 Pokedex
 */
export function setGen3PokedexSeen(data: Uint8Array, species: number, seen: boolean): boolean {
  if (species < 1 || species > 386) return false;

  const { sections } = getGen3SaveInfo(data);
  if (sections[0] === undefined) return false;

  const seenOffset = sections[0] + 0x5C;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (seen) {
    data[seenOffset + byteIndex] |= (1 << bitIndex);
  } else {
    data[seenOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen3SectionChecksum(data, sections[0]);
  return true;
}

/**
 * Set Pokemon as caught in Gen 3 Pokedex
 */
export function setGen3PokedexCaught(data: Uint8Array, species: number, caught: boolean): boolean {
  if (species < 1 || species > 386) return false;

  const { sections } = getGen3SaveInfo(data);
  if (sections[0] === undefined) return false;

  const ownedOffset = sections[0] + 0x28;
  const index = species - 1;
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (caught) {
    data[ownedOffset + byteIndex] |= (1 << bitIndex);
    setGen3PokedexSeen(data, species, true);
  } else {
    data[ownedOffset + byteIndex] &= ~(1 << bitIndex);
  }

  updateGen3SectionChecksum(data, sections[0]);
  return true;
}

/**
 * Complete the Pokedex for Gen 1 (mark all 151 as seen and caught)
 */
export function completeGen1Pokedex(data: Uint8Array): boolean {
  for (let i = 1; i <= 151; i++) {
    setGen1PokedexCaught(data, i, true);
  }
  return true;
}

/**
 * Complete the Pokedex for Gen 2 (mark all 251 as seen and caught)
 */
export function completeGen2Pokedex(data: Uint8Array): boolean {
  for (let i = 1; i <= 251; i++) {
    setGen2PokedexCaught(data, i, true);
  }
  return true;
}

/**
 * Complete the Pokedex for Gen 3 (mark all 386 as seen and caught)
 */
export function completeGen3Pokedex(data: Uint8Array): boolean {
  for (let i = 1; i <= 386; i++) {
    setGen3PokedexCaught(data, i, true);
  }
  return true;
}

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
  // order[i] tells us what TYPE is at position i
  // order.indexOf(type) tells us what POSITION the type is at
  const substructOrder = personality % 24;
  const order = getSubstructOrder(substructOrder);

  // Growth substructure (type 0, 12 bytes)
  const growthOffset = order.indexOf(0) * 12;
  writeU16LE(substructure, growthOffset, species); // Species
  writeU16LE(substructure, growthOffset + 2, 0); // Held item (none)
  writeU32LE(substructure, growthOffset + 4, 125); // Experience (level 5 medium slow)
  substructure[growthOffset + 8] = 0; // PP bonuses
  substructure[growthOffset + 9] = 70; // Friendship

  // Attacks substructure (type 1, 12 bytes)
  const attacksOffset = order.indexOf(1) * 12;
  // Give starter moves based on species (simplified - just Tackle and Growl for now)
  writeU16LE(substructure, attacksOffset, 33); // Tackle
  writeU16LE(substructure, attacksOffset + 2, 45); // Growl
  writeU16LE(substructure, attacksOffset + 4, 0); // No move
  writeU16LE(substructure, attacksOffset + 6, 0); // No move
  substructure[attacksOffset + 8] = 35; // Tackle PP
  substructure[attacksOffset + 9] = 40; // Growl PP
  substructure[attacksOffset + 10] = 0;
  substructure[attacksOffset + 11] = 0;

  // EVs & Condition substructure (type 2, 12 bytes)
  const evsOffset = order.indexOf(2) * 12;
  // All EVs start at 0, condition values at 0

  // Misc substructure (type 3, 12 bytes)
  const miscOffset = order.indexOf(3) * 12;
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
