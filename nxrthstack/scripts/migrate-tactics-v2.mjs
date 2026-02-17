/**
 * Tactics v2 Migration Script
 * Adds: equipment leveling, win streak, first win, daily quests, achievements
 *
 * Usage: node scripts/migrate-tactics-v2.mjs
 * Requires: DATABASE_URL environment variable
 */

import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const migrations = [
  // Phase 1: Equipment leveling
  `ALTER TABLE tactics_equipment ADD COLUMN IF NOT EXISTS equipment_level integer DEFAULT 1 NOT NULL`,
  `ALTER TABLE tactics_equipment ADD COLUMN IF NOT EXISTS equipment_xp integer DEFAULT 0 NOT NULL`,

  // Phase 3: Win streak and first win of day
  `ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS win_streak integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS last_first_win_at timestamp`,

  // Phase 3: Daily quests table
  `CREATE TABLE IF NOT EXISTS tactics_daily_quests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES tactics_players(id) ON DELETE CASCADE,
    quest_type varchar(50) NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    target integer NOT NULL,
    reward integer NOT NULL,
    completed_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
  )`,

  // Phase 3: Achievements table
  `CREATE TABLE IF NOT EXISTS tactics_achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES tactics_players(id) ON DELETE CASCADE,
    achievement_id varchar(50) NOT NULL,
    unlocked_at timestamp DEFAULT now() NOT NULL,
    claimed boolean DEFAULT false NOT NULL
  )`,
];

async function runMigrations() {
  console.log("Running Tactics v2 migrations...\n");

  for (const migration of migrations) {
    const label = migration.split("\n")[0].trim().substring(0, 80);
    try {
      await sql.query(migration);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      console.error(`  ✗ ${label}`);
      console.error(`    ${error.message}\n`);
    }
  }

  console.log("\nDone!");
}

runMigrations().catch(console.error);
