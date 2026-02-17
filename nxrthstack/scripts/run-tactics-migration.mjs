import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Adding columns to tactics_players...");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS campaign_level integer DEFAULT 0 NOT NULL`;
    console.log("  OK: campaign_level");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_attack_squad jsonb`;
    console.log("  OK: warfare_attack_squad");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_defense_squad jsonb`;
    console.log("  OK: warfare_defense_squad");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_rating integer DEFAULT 1000 NOT NULL`;
    console.log("  OK: warfare_rating");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_wins integer DEFAULT 0 NOT NULL`;
    console.log("  OK: warfare_wins");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_losses integer DEFAULT 0 NOT NULL`;
    console.log("  OK: warfare_losses");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0 NOT NULL`;
    console.log("  OK: login_streak");
    await sql`ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS last_login_date varchar(10)`;
    console.log("  OK: last_login_date");

    console.log("\nAdding column to tactics_matches...");
    await sql`ALTER TABLE tactics_matches ADD COLUMN IF NOT EXISTS match_type varchar(20) DEFAULT 'standard' NOT NULL`;
    console.log("  OK: match_type");

    console.log("\nCreating tactics_campaign_attempts table...");
    await sql`CREATE TABLE IF NOT EXISTS tactics_campaign_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES tactics_players(id) ON DELETE CASCADE,
      level integer NOT NULL,
      won boolean NOT NULL,
      stars integer DEFAULT 0 NOT NULL,
      currency_earned integer DEFAULT 0 NOT NULL,
      duration_ticks integer NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK: tactics_campaign_attempts");

    console.log("\nCreating tactics_game_config table...");
    await sql`CREATE TABLE IF NOT EXISTS tactics_game_config (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key varchar(100) NOT NULL UNIQUE,
      value jsonb NOT NULL,
      description text,
      updated_at timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK: tactics_game_config");

    console.log("\nMigration complete!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

run();
