import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = neon(databaseUrl);
const db = drizzle(client);

async function migrateNotifications() {
  console.log("Creating notifications tables...");

  try {
    // Create notification_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "gamehub_achievements" boolean DEFAULT true NOT NULL,
        "gamehub_lobby_invites" boolean DEFAULT true NOT NULL,
        "gamehub_match_results" boolean DEFAULT true NOT NULL,
        "gamehub_tournaments" boolean DEFAULT true NOT NULL,
        "gamehub_announcements" boolean DEFAULT true NOT NULL,
        "product_updates" boolean DEFAULT true NOT NULL,
        "product_updates_email" boolean DEFAULT true NOT NULL,
        "system_announcements" boolean DEFAULT true NOT NULL,
        "system_announcements_email" boolean DEFAULT true NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
      )
    `);
    console.log("Created notification_preferences table");

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "category" varchar(30) NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "action_url" varchar(500),
        "action_label" varchar(100),
        "metadata" jsonb DEFAULT '{}'::jsonb,
        "is_read" boolean DEFAULT false NOT NULL,
        "read_at" timestamp,
        "email_sent" boolean DEFAULT false NOT NULL,
        "email_sent_at" timestamp,
        "email_enabled" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp
      )
    `);
    console.log("Created notifications table");

    // Add foreign key constraints
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "notification_preferences"
        ADD CONSTRAINT "notification_preferences_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);
    console.log("Added notification_preferences foreign key");

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "notifications"
        ADD CONSTRAINT "notifications_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);
    console.log("Added notifications foreign key");

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id")
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at" DESC)
    `);
    console.log("Created indexes");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateNotifications();
