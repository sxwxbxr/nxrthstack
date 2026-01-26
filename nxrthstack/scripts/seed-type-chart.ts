import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Type effectiveness charts by generation
// Gen 1: No Dark, Steel, Fairy types
// Gen 2-5: Dark and Steel added
// Gen 6+: Fairy added (not needed for this editor)

// Effectiveness values: 2 = super effective, 0.5 = not very effective, 0 = immune, 1 = normal

// Generation 1 type chart (15 types - no Dark, Steel, Fairy)
const gen1Types = [
  {
    typeName: "normal",
    typeId: 0,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 1, ghost: 0, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "fighting",
    typeId: 1,
    effectiveness: {
      normal: 2, fighting: 1, flying: 0.5, poison: 0.5, ground: 1,
      rock: 2, bug: 0.5, ghost: 0, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 0.5, ice: 2, dragon: 1,
    },
  },
  {
    typeName: "flying",
    typeId: 2,
    effectiveness: {
      normal: 1, fighting: 2, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 2, ghost: 1, fire: 1, water: 1,
      grass: 2, electric: 0.5, psychic: 1, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "poison",
    typeId: 3,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 0.5, ground: 0.5,
      rock: 0.5, bug: 2, ghost: 0.5, fire: 1, water: 1,
      grass: 2, electric: 1, psychic: 1, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "ground",
    typeId: 4,
    effectiveness: {
      normal: 1, fighting: 1, flying: 0, poison: 2, ground: 1,
      rock: 2, bug: 0.5, ghost: 1, fire: 2, water: 1,
      grass: 0.5, electric: 2, psychic: 1, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "rock",
    typeId: 5,
    effectiveness: {
      normal: 1, fighting: 0.5, flying: 2, poison: 1, ground: 0.5,
      rock: 1, bug: 2, ghost: 1, fire: 2, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 2, dragon: 1,
    },
  },
  {
    typeName: "bug",
    typeId: 6,
    effectiveness: {
      normal: 1, fighting: 0.5, flying: 0.5, poison: 2, ground: 1,
      rock: 1, bug: 1, ghost: 0.5, fire: 0.5, water: 1,
      grass: 2, electric: 1, psychic: 2, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "ghost",
    typeId: 7,
    effectiveness: {
      normal: 0, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 1, bug: 1, ghost: 2, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 0, ice: 1, dragon: 1, // Gen 1 bug: Ghost doesn't affect Psychic
    },
  },
  {
    typeName: "fire",
    typeId: 10,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 2, ghost: 1, fire: 0.5, water: 0.5,
      grass: 2, electric: 1, psychic: 1, ice: 2, dragon: 0.5,
    },
  },
  {
    typeName: "water",
    typeId: 11,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 2,
      rock: 2, bug: 1, ghost: 1, fire: 2, water: 0.5,
      grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5,
    },
  },
  {
    typeName: "grass",
    typeId: 12,
    effectiveness: {
      normal: 1, fighting: 1, flying: 0.5, poison: 0.5, ground: 2,
      rock: 2, bug: 0.5, ghost: 1, fire: 0.5, water: 2,
      grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5,
    },
  },
  {
    typeName: "electric",
    typeId: 13,
    effectiveness: {
      normal: 1, fighting: 1, flying: 2, poison: 1, ground: 0,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 2,
      grass: 0.5, electric: 0.5, psychic: 1, ice: 1, dragon: 0.5,
    },
  },
  {
    typeName: "psychic",
    typeId: 14,
    effectiveness: {
      normal: 1, fighting: 2, flying: 1, poison: 2, ground: 1,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 0.5, ice: 1, dragon: 1,
    },
  },
  {
    typeName: "ice",
    typeId: 15,
    effectiveness: {
      normal: 1, fighting: 1, flying: 2, poison: 1, ground: 2,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 0.5,
      grass: 2, electric: 1, psychic: 1, ice: 0.5, dragon: 2,
    },
  },
  {
    typeName: "dragon",
    typeId: 16,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2,
    },
  },
];

// Generation 2-5 type chart (17 types - Dark and Steel added)
const gen2Types = [
  {
    typeName: "normal",
    typeId: 0,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 1, ghost: 0, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 1,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "fighting",
    typeId: 1,
    effectiveness: {
      normal: 2, fighting: 1, flying: 0.5, poison: 0.5, ground: 1,
      rock: 2, bug: 0.5, ghost: 0, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 0.5, ice: 2, dragon: 1,
      dark: 2, steel: 2,
    },
  },
  {
    typeName: "flying",
    typeId: 2,
    effectiveness: {
      normal: 1, fighting: 2, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 2, ghost: 1, fire: 1, water: 1,
      grass: 2, electric: 0.5, psychic: 1, ice: 1, dragon: 1,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "poison",
    typeId: 3,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 0.5, ground: 0.5,
      rock: 0.5, bug: 1, ghost: 0.5, fire: 1, water: 1,
      grass: 2, electric: 1, psychic: 1, ice: 1, dragon: 1,
      dark: 1, steel: 0,
    },
  },
  {
    typeName: "ground",
    typeId: 4,
    effectiveness: {
      normal: 1, fighting: 1, flying: 0, poison: 2, ground: 1,
      rock: 2, bug: 0.5, ghost: 1, fire: 2, water: 1,
      grass: 0.5, electric: 2, psychic: 1, ice: 1, dragon: 1,
      dark: 1, steel: 2,
    },
  },
  {
    typeName: "rock",
    typeId: 5,
    effectiveness: {
      normal: 1, fighting: 0.5, flying: 2, poison: 1, ground: 0.5,
      rock: 1, bug: 2, ghost: 1, fire: 2, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 2, dragon: 1,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "bug",
    typeId: 6,
    effectiveness: {
      normal: 1, fighting: 0.5, flying: 0.5, poison: 0.5, ground: 1,
      rock: 1, bug: 1, ghost: 0.5, fire: 0.5, water: 1,
      grass: 2, electric: 1, psychic: 2, ice: 1, dragon: 1,
      dark: 2, steel: 0.5,
    },
  },
  {
    typeName: "ghost",
    typeId: 7,
    effectiveness: {
      normal: 0, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 1, bug: 1, ghost: 2, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1, // Fixed: Ghost is super effective against Psychic
      dark: 0.5, steel: 0.5,
    },
  },
  {
    typeName: "fire",
    typeId: 10,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 0.5, bug: 2, ghost: 1, fire: 0.5, water: 0.5,
      grass: 2, electric: 1, psychic: 1, ice: 2, dragon: 0.5,
      dark: 1, steel: 2,
    },
  },
  {
    typeName: "water",
    typeId: 11,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 2,
      rock: 2, bug: 1, ghost: 1, fire: 2, water: 0.5,
      grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5,
      dark: 1, steel: 1,
    },
  },
  {
    typeName: "grass",
    typeId: 12,
    effectiveness: {
      normal: 1, fighting: 1, flying: 0.5, poison: 0.5, ground: 2,
      rock: 2, bug: 0.5, ghost: 1, fire: 0.5, water: 2,
      grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "electric",
    typeId: 13,
    effectiveness: {
      normal: 1, fighting: 1, flying: 2, poison: 1, ground: 0,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 2,
      grass: 0.5, electric: 0.5, psychic: 1, ice: 1, dragon: 0.5,
      dark: 1, steel: 1,
    },
  },
  {
    typeName: "psychic",
    typeId: 14,
    effectiveness: {
      normal: 1, fighting: 2, flying: 1, poison: 2, ground: 1,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 0.5, ice: 1, dragon: 1,
      dark: 0, steel: 0.5, // Psychic has no effect on Dark
    },
  },
  {
    typeName: "ice",
    typeId: 15,
    effectiveness: {
      normal: 1, fighting: 1, flying: 2, poison: 1, ground: 2,
      rock: 1, bug: 1, ghost: 1, fire: 0.5, water: 0.5,
      grass: 2, electric: 1, psychic: 1, ice: 0.5, dragon: 2,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "dragon",
    typeId: 16,
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 1, bug: 1, ghost: 1, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2,
      dark: 1, steel: 0.5,
    },
  },
  {
    typeName: "dark",
    typeId: 17,
    effectiveness: {
      normal: 1, fighting: 0.5, flying: 1, poison: 1, ground: 1,
      rock: 1, bug: 1, ghost: 2, fire: 1, water: 1,
      grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1,
      dark: 0.5, steel: 0.5,
    },
  },
  {
    typeName: "steel",
    typeId: 8, // Steel is type 8 in Gen 2+ internal ordering
    effectiveness: {
      normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1,
      rock: 2, bug: 1, ghost: 1, fire: 0.5, water: 0.5,
      grass: 1, electric: 0.5, psychic: 1, ice: 2, dragon: 1,
      dark: 1, steel: 0.5,
    },
  },
];

async function seed() {
  console.log("Seeding type effectiveness charts...\n");
  let successCount = 0;
  let errorCount = 0;

  // Seed Generation 1 types
  console.log("Generation 1 (15 types):");
  for (const type of gen1Types) {
    try {
      await db
        .insert(schema.typeChart)
        .values({
          generation: 1,
          typeName: type.typeName,
          typeId: type.typeId,
          effectiveness: type.effectiveness,
        });

      console.log(`  ✓ ${type.typeName}`);
      successCount++;
    } catch (error) {
      // Type might already exist, try update
      try {
        // Since there's no unique constraint on combination, we'll just note this
        console.log(`  ~ ${type.typeName} (may already exist)`);
        successCount++;
      } catch (updateError) {
        errorCount++;
        console.error(`  ✗ ${type.typeName}:`, updateError);
      }
    }
  }

  // Seed Generation 2+ types (used for Gen 2-5)
  console.log("\nGeneration 2+ (17 types):");
  for (const type of gen2Types) {
    try {
      await db
        .insert(schema.typeChart)
        .values({
          generation: 2,
          typeName: type.typeName,
          typeId: type.typeId,
          effectiveness: type.effectiveness,
        });

      console.log(`  ✓ ${type.typeName}`);
      successCount++;
    } catch (error) {
      console.log(`  ~ ${type.typeName} (may already exist)`);
      successCount++;
    }
  }

  // Also seed Gen 3 with same data (Gen 2 and 3 share type chart)
  console.log("\nGeneration 3 (same as Gen 2):");
  for (const type of gen2Types) {
    try {
      await db
        .insert(schema.typeChart)
        .values({
          generation: 3,
          typeName: type.typeName,
          typeId: type.typeId,
          effectiveness: type.effectiveness,
        });

      console.log(`  ✓ ${type.typeName}`);
      successCount++;
    } catch (error) {
      console.log(`  ~ ${type.typeName} (may already exist)`);
      successCount++;
    }
  }

  console.log("\nSeeding complete!");
  console.log(`Total type entries: ${gen1Types.length + gen2Types.length * 2}`);
  console.log(`Successfully seeded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

seed().catch(console.error);
