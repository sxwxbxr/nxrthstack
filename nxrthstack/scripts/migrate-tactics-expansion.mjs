import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running tactics expansion migration...\n");

  // 1. Add new columns to tactics_players
  try {
    console.log("[1/11] Adding wheel_spin_count to tactics_players...");
    await sql`ALTER TABLE "tactics_players" ADD COLUMN "wheel_spin_count" integer DEFAULT 0 NOT NULL`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[2/11] Adding total_xp_earned to tactics_players...");
    await sql`ALTER TABLE "tactics_players" ADD COLUMN "total_xp_earned" integer DEFAULT 0 NOT NULL`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 2. Create tactics_unit_instances
  try {
    console.log("[3/11] Creating tactics_unit_instances...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_unit_instances" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "player_id" uuid NOT NULL,
      "template_id" varchar(50) NOT NULL,
      "rarity" varchar(20) DEFAULT 'common' NOT NULL,
      "level" integer DEFAULT 1 NOT NULL,
      "xp" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 3. Create tactics_equipment
  try {
    console.log("[4/11] Creating tactics_equipment...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_equipment" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "player_id" uuid NOT NULL,
      "unit_instance_id" uuid,
      "slot" varchar(20) NOT NULL,
      "name" varchar(100) NOT NULL,
      "rarity" varchar(20) NOT NULL,
      "stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "enchant_level" integer DEFAULT 0 NOT NULL,
      "cursed" boolean DEFAULT false NOT NULL,
      "curse_stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 4. Create tactics_enchant_history
  try {
    console.log("[5/11] Creating tactics_enchant_history...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_enchant_history" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "player_id" uuid NOT NULL,
      "equipment_id" uuid NOT NULL,
      "result" varchar(20) NOT NULL,
      "cost_paid" integer NOT NULL,
      "details" jsonb DEFAULT '{}'::jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 5. Create tactics_wheel_spins
  try {
    console.log("[6/11] Creating tactics_wheel_spins...");
    await sql`CREATE TABLE IF NOT EXISTS "tactics_wheel_spins" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "player_id" uuid NOT NULL,
      "cost_paid" integer NOT NULL,
      "result_template_id" varchar(50) NOT NULL,
      "result_rarity" varchar(20) NOT NULL,
      "compensation_currency" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 6. Foreign keys
  try {
    console.log("[7/11] FK: tactics_unit_instances.player_id -> tactics_players...");
    await sql`ALTER TABLE "tactics_unit_instances" ADD CONSTRAINT "tactics_unit_instances_player_id_tactics_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."tactics_players"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[8/11] FK: tactics_equipment.player_id -> tactics_players...");
    await sql`ALTER TABLE "tactics_equipment" ADD CONSTRAINT "tactics_equipment_player_id_tactics_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."tactics_players"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[9/11] FK: tactics_equipment.unit_instance_id -> tactics_unit_instances...");
    await sql`ALTER TABLE "tactics_equipment" ADD CONSTRAINT "tactics_equipment_unit_instance_id_tactics_unit_instances_id_fk" FOREIGN KEY ("unit_instance_id") REFERENCES "public"."tactics_unit_instances"("id") ON DELETE set null ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[10/11] FK: tactics_enchant_history -> tactics_players + tactics_equipment...");
    await sql`ALTER TABLE "tactics_enchant_history" ADD CONSTRAINT "tactics_enchant_history_player_id_tactics_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."tactics_players"("id") ON DELETE cascade ON UPDATE no action`;
    await sql`ALTER TABLE "tactics_enchant_history" ADD CONSTRAINT "tactics_enchant_history_equipment_id_tactics_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."tactics_equipment"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  try {
    console.log("[11/11] FK: tactics_wheel_spins.player_id -> tactics_players...");
    await sql`ALTER TABLE "tactics_wheel_spins" ADD CONSTRAINT "tactics_wheel_spins_player_id_tactics_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."tactics_players"("id") ON DELETE cascade ON UPDATE no action`;
    console.log("  OK");
  } catch (err) {
    console.log(`  ${err.message.includes("already exists") ? "SKIP" : "FAIL"}: ${err.message}`);
  }

  // 7. Auto-create unit instances for existing players
  try {
    console.log("\n[Backfill] Creating unit instances for existing players...");
    const players = await sql`SELECT id, unlocked_unit_ids FROM tactics_players`;
    let created = 0;
    for (const player of players) {
      const unitIds = player.unlocked_unit_ids || [];
      for (const templateId of unitIds) {
        // Check if instance already exists
        const existing = await sql`SELECT id FROM tactics_unit_instances WHERE player_id = ${player.id} AND template_id = ${templateId} LIMIT 1`;
        if (existing.length === 0) {
          await sql`INSERT INTO tactics_unit_instances (player_id, template_id, rarity, level, xp) VALUES (${player.id}, ${templateId}, 'common', 1, 0)`;
          created++;
        }
      }
    }
    console.log(`  Created ${created} unit instances for ${players.length} players`);
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
  }

  console.log("\nTactics expansion migration complete!");
}

migrate();
