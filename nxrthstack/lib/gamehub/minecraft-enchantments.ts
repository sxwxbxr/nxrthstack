export type ItemType =
  | "sword"
  | "axe"
  | "pickaxe"
  | "shovel"
  | "hoe"
  | "bow"
  | "crossbow"
  | "trident"
  | "helmet"
  | "chestplate"
  | "leggings"
  | "boots"
  | "elytra"
  | "shield"
  | "fishing_rod"
  | "shears"
  | "book";

export interface Enchantment {
  id: string;
  name: string;
  maxLevel: number;
  applicableTo: ItemType[];
  incompatibleWith: string[];
  isTreasure: boolean;
  isCurse: boolean;
  description: string;
}

export const ENCHANTMENTS: Enchantment[] = [
  // Armor (All)
  {
    id: "protection",
    name: "Protection",
    maxLevel: 4,
    applicableTo: ["helmet", "chestplate", "leggings", "boots"],
    incompatibleWith: ["blast_protection", "fire_protection", "projectile_protection"],
    isTreasure: false,
    isCurse: false,
    description: "Reduces most damage",
  },
  {
    id: "fire_protection",
    name: "Fire Protection",
    maxLevel: 4,
    applicableTo: ["helmet", "chestplate", "leggings", "boots"],
    incompatibleWith: ["protection", "blast_protection", "projectile_protection"],
    isTreasure: false,
    isCurse: false,
    description: "Reduces fire damage and burn time",
  },
  {
    id: "blast_protection",
    name: "Blast Protection",
    maxLevel: 4,
    applicableTo: ["helmet", "chestplate", "leggings", "boots"],
    incompatibleWith: ["protection", "fire_protection", "projectile_protection"],
    isTreasure: false,
    isCurse: false,
    description: "Reduces explosion damage and knockback",
  },
  {
    id: "projectile_protection",
    name: "Projectile Protection",
    maxLevel: 4,
    applicableTo: ["helmet", "chestplate", "leggings", "boots"],
    incompatibleWith: ["protection", "fire_protection", "blast_protection"],
    isTreasure: false,
    isCurse: false,
    description: "Reduces projectile damage",
  },
  {
    id: "thorns",
    name: "Thorns",
    maxLevel: 3,
    applicableTo: ["helmet", "chestplate", "leggings", "boots"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Reflects damage back to attackers",
  },
  {
    id: "unbreaking",
    name: "Unbreaking",
    maxLevel: 3,
    applicableTo: ["helmet", "chestplate", "leggings", "boots", "sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident", "elytra", "shield", "fishing_rod", "shears"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases durability",
  },
  {
    id: "mending",
    name: "Mending",
    maxLevel: 1,
    applicableTo: ["helmet", "chestplate", "leggings", "boots", "sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident", "elytra", "shield", "fishing_rod", "shears"],
    incompatibleWith: ["infinity"],
    isTreasure: true,
    isCurse: false,
    description: "Repairs item using XP",
  },
  {
    id: "curse_of_binding",
    name: "Curse of Binding",
    maxLevel: 1,
    applicableTo: ["helmet", "chestplate", "leggings", "boots", "elytra"],
    incompatibleWith: [],
    isTreasure: true,
    isCurse: true,
    description: "Cannot be removed once equipped",
  },
  {
    id: "curse_of_vanishing",
    name: "Curse of Vanishing",
    maxLevel: 1,
    applicableTo: ["helmet", "chestplate", "leggings", "boots", "sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident", "elytra", "shield", "fishing_rod", "shears"],
    incompatibleWith: [],
    isTreasure: true,
    isCurse: true,
    description: "Disappears on death",
  },

  // Helmet
  {
    id: "aqua_affinity",
    name: "Aqua Affinity",
    maxLevel: 1,
    applicableTo: ["helmet"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases underwater mining speed",
  },
  {
    id: "respiration",
    name: "Respiration",
    maxLevel: 3,
    applicableTo: ["helmet"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Extends underwater breathing time",
  },

  // Boots
  {
    id: "feather_falling",
    name: "Feather Falling",
    maxLevel: 4,
    applicableTo: ["boots"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Reduces fall damage",
  },
  {
    id: "depth_strider",
    name: "Depth Strider",
    maxLevel: 3,
    applicableTo: ["boots"],
    incompatibleWith: ["frost_walker"],
    isTreasure: false,
    isCurse: false,
    description: "Increases underwater movement speed",
  },
  {
    id: "frost_walker",
    name: "Frost Walker",
    maxLevel: 2,
    applicableTo: ["boots"],
    incompatibleWith: ["depth_strider"],
    isTreasure: true,
    isCurse: false,
    description: "Freezes water beneath you",
  },
  {
    id: "soul_speed",
    name: "Soul Speed",
    maxLevel: 3,
    applicableTo: ["boots"],
    incompatibleWith: [],
    isTreasure: true,
    isCurse: false,
    description: "Increases speed on soul sand",
  },

  // Sword
  {
    id: "sharpness",
    name: "Sharpness",
    maxLevel: 5,
    applicableTo: ["sword", "axe"],
    incompatibleWith: ["smite", "bane_of_arthropods"],
    isTreasure: false,
    isCurse: false,
    description: "Increases damage",
  },
  {
    id: "smite",
    name: "Smite",
    maxLevel: 5,
    applicableTo: ["sword", "axe"],
    incompatibleWith: ["sharpness", "bane_of_arthropods"],
    isTreasure: false,
    isCurse: false,
    description: "Extra damage to undead",
  },
  {
    id: "bane_of_arthropods",
    name: "Bane of Arthropods",
    maxLevel: 5,
    applicableTo: ["sword", "axe"],
    incompatibleWith: ["sharpness", "smite"],
    isTreasure: false,
    isCurse: false,
    description: "Extra damage to arthropods",
  },
  {
    id: "knockback",
    name: "Knockback",
    maxLevel: 2,
    applicableTo: ["sword"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases knockback",
  },
  {
    id: "fire_aspect",
    name: "Fire Aspect",
    maxLevel: 2,
    applicableTo: ["sword"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Sets target on fire",
  },
  {
    id: "looting",
    name: "Looting",
    maxLevel: 3,
    applicableTo: ["sword"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases loot drops",
  },
  {
    id: "sweeping_edge",
    name: "Sweeping Edge",
    maxLevel: 3,
    applicableTo: ["sword"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases sweeping attack damage",
  },

  // Tools
  {
    id: "efficiency",
    name: "Efficiency",
    maxLevel: 5,
    applicableTo: ["pickaxe", "shovel", "axe", "hoe", "shears"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases mining speed",
  },
  {
    id: "silk_touch",
    name: "Silk Touch",
    maxLevel: 1,
    applicableTo: ["pickaxe", "shovel", "axe", "hoe", "shears"],
    incompatibleWith: ["fortune"],
    isTreasure: false,
    isCurse: false,
    description: "Mined blocks drop themselves",
  },
  {
    id: "fortune",
    name: "Fortune",
    maxLevel: 3,
    applicableTo: ["pickaxe", "shovel", "axe", "hoe"],
    incompatibleWith: ["silk_touch"],
    isTreasure: false,
    isCurse: false,
    description: "Increases block drops",
  },

  // Bow
  {
    id: "power",
    name: "Power",
    maxLevel: 5,
    applicableTo: ["bow"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases arrow damage",
  },
  {
    id: "punch",
    name: "Punch",
    maxLevel: 2,
    applicableTo: ["bow"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases arrow knockback",
  },
  {
    id: "flame",
    name: "Flame",
    maxLevel: 1,
    applicableTo: ["bow"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Arrows set targets on fire",
  },
  {
    id: "infinity",
    name: "Infinity",
    maxLevel: 1,
    applicableTo: ["bow"],
    incompatibleWith: ["mending"],
    isTreasure: false,
    isCurse: false,
    description: "Shooting doesn't consume arrows",
  },

  // Crossbow
  {
    id: "quick_charge",
    name: "Quick Charge",
    maxLevel: 3,
    applicableTo: ["crossbow"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Decreases reload time",
  },
  {
    id: "multishot",
    name: "Multishot",
    maxLevel: 1,
    applicableTo: ["crossbow"],
    incompatibleWith: ["piercing"],
    isTreasure: false,
    isCurse: false,
    description: "Shoots 3 arrows at once",
  },
  {
    id: "piercing",
    name: "Piercing",
    maxLevel: 4,
    applicableTo: ["crossbow"],
    incompatibleWith: ["multishot"],
    isTreasure: false,
    isCurse: false,
    description: "Arrows pass through entities",
  },

  // Trident
  {
    id: "impaling",
    name: "Impaling",
    maxLevel: 5,
    applicableTo: ["trident"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Extra damage to aquatic mobs",
  },
  {
    id: "riptide",
    name: "Riptide",
    maxLevel: 3,
    applicableTo: ["trident"],
    incompatibleWith: ["loyalty", "channeling"],
    isTreasure: false,
    isCurse: false,
    description: "Propels player when thrown in water",
  },
  {
    id: "loyalty",
    name: "Loyalty",
    maxLevel: 3,
    applicableTo: ["trident"],
    incompatibleWith: ["riptide"],
    isTreasure: false,
    isCurse: false,
    description: "Trident returns after being thrown",
  },
  {
    id: "channeling",
    name: "Channeling",
    maxLevel: 1,
    applicableTo: ["trident"],
    incompatibleWith: ["riptide"],
    isTreasure: false,
    isCurse: false,
    description: "Summons lightning during storms",
  },

  // Fishing Rod
  {
    id: "luck_of_the_sea",
    name: "Luck of the Sea",
    maxLevel: 3,
    applicableTo: ["fishing_rod"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Increases treasure catch rate",
  },
  {
    id: "lure",
    name: "Lure",
    maxLevel: 3,
    applicableTo: ["fishing_rod"],
    incompatibleWith: [],
    isTreasure: false,
    isCurse: false,
    description: "Decreases wait time",
  },
];

export const ITEM_TYPES: { id: ItemType; name: string; icon: string }[] = [
  { id: "sword", name: "Sword", icon: "swords" },
  { id: "axe", name: "Axe", icon: "axe" },
  { id: "pickaxe", name: "Pickaxe", icon: "pickaxe" },
  { id: "shovel", name: "Shovel", icon: "shovel" },
  { id: "hoe", name: "Hoe", icon: "hoe" },
  { id: "bow", name: "Bow", icon: "bow" },
  { id: "crossbow", name: "Crossbow", icon: "crossbow" },
  { id: "trident", name: "Trident", icon: "trident" },
  { id: "helmet", name: "Helmet", icon: "helmet" },
  { id: "chestplate", name: "Chestplate", icon: "chestplate" },
  { id: "leggings", name: "Leggings", icon: "leggings" },
  { id: "boots", name: "Boots", icon: "boots" },
  { id: "elytra", name: "Elytra", icon: "elytra" },
  { id: "shield", name: "Shield", icon: "shield" },
  { id: "fishing_rod", name: "Fishing Rod", icon: "fishing" },
  { id: "shears", name: "Shears", icon: "scissors" },
];

// Calculate anvil cost for combining enchantments
export function calculateAnvilCost(
  enchantments: { id: string; level: number }[],
  priorWorkPenalty: number = 0
): number {
  let cost = 0;

  enchantments.forEach((ench) => {
    const enchantment = ENCHANTMENTS.find((e) => e.id === ench.id);
    if (!enchantment) return;

    // Base cost per level (simplified)
    const multiplier = enchantment.isTreasure ? 4 : 2;
    cost += ench.level * multiplier;
  });

  // Prior work penalty (doubles each time)
  cost += Math.pow(2, priorWorkPenalty) - 1;

  return cost;
}

export function getAvailableEnchantments(itemType: ItemType): Enchantment[] {
  return ENCHANTMENTS.filter(
    (e) => e.applicableTo.includes(itemType) || e.applicableTo.includes("book" as ItemType)
  );
}

export function checkIncompatibility(
  selectedIds: string[],
  newEnchantmentId: string
): string[] {
  const newEnchantment = ENCHANTMENTS.find((e) => e.id === newEnchantmentId);
  if (!newEnchantment) return [];

  const conflicts: string[] = [];

  selectedIds.forEach((selectedId) => {
    const selected = ENCHANTMENTS.find((e) => e.id === selectedId);
    if (!selected) return;

    // Check if new enchantment conflicts with selected
    if (newEnchantment.incompatibleWith.includes(selectedId)) {
      conflicts.push(selected.name);
    }

    // Check if selected conflicts with new enchantment
    if (selected.incompatibleWith.includes(newEnchantmentId)) {
      conflicts.push(selected.name);
    }
  });

  return [...new Set(conflicts)];
}
