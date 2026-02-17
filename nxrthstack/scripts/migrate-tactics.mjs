import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running tactics migration...\n");

  try {
    console.log("[1/8] Creating tactics_match_cooldowns...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_match_cooldowns" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "attacker_id" uuid NOT NULL,
      "defender_id" uuid NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[2/8] Creating tactics_matches...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_matches" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "attacker_id" uuid NOT NULL,
      "defender_id" uuid NOT NULL,
      "attacker_rating_before" integer NOT NULL,
      "defender_rating_before" integer NOT NULL,
      "attacker_rating_change" integer NOT NULL,
      "defender_rating_change" integer NOT NULL,
      "attacker_squad_snapshot" jsonb NOT NULL,
      "defender_squad_snapshot" jsonb NOT NULL,
      "map_id" varchar(50) NOT NULL,
      "seed" integer NOT NULL,
      "winner" varchar(20) NOT NULL,
      "duration_ticks" integer NOT NULL,
      "duration_seconds" integer NOT NULL,
      "stats" jsonb NOT NULL,
      "events" jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[3/8] Creating tactics_players...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_players" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "rating" integer DEFAULT 1000 NOT NULL,
      "rating_deviation" integer DEFAULT 350 NOT NULL,
      "currency" integer DEFAULT 0 NOT NULL,
      "unlocked_unit_ids" jsonb DEFAULT '["knight","archer","cleric","shadow"]'::jsonb NOT NULL,
      "attack_squad" jsonb,
      "defense_squad" jsonb,
      "total_wins" integer DEFAULT 0 NOT NULL,
      "total_losses" integer DEFAULT 0 NOT NULL,
      "season_id" integer DEFAULT 1 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "tactics_players_user_id_unique" UNIQUE("user_id")
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[4/8] FK: tactics_match_cooldowns.attacker_id -> users...");
    await sql`ALTER TABLE "tactics_match_cooldowns" ADD CONSTRAINT "tactics_match_cooldowns_attacker_id_users_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[5/8] FK: tactics_match_cooldowns.defender_id -> users...");
    await sql`ALTER TABLE "tactics_match_cooldowns" ADD CONSTRAINT "tactics_match_cooldowns_defender_id_users_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[6/8] FK: tactics_matches.attacker_id -> users...");
    await sql`ALTER TABLE "tactics_matches" ADD CONSTRAINT "tactics_matches_attacker_id_users_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[7/8] FK: tactics_matches.defender_id -> users...");
    await sql`ALTER TABLE "tactics_matches" ADD CONSTRAINT "tactics_matches_defender_id_users_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[8/8] FK: tactics_players.user_id -> users...");
    await sql`ALTER TABLE "tactics_players" ADD CONSTRAINT "tactics_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  console.log("\nMigration complete!");
}

migrate();
