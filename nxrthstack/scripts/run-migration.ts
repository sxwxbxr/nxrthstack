import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "friendships" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "friend_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "accepted_at" timestamp
  )`,
  `CREATE TABLE IF NOT EXISTS "activity_feed" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "activity_type" varchar(50) NOT NULL,
    "title" varchar(200) NOT NULL,
    "description" text,
    "metadata" jsonb DEFAULT '{}',
    "game" varchar(50),
    "is_public" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "activity_likes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "activity_id" uuid NOT NULL REFERENCES "activity_feed"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "activity_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "activity_id" uuid NOT NULL REFERENCES "activity_feed"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" varchar(500) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rivalries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "challenger_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "opponent_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "season" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "accepted_at" timestamp,
    "ended_at" timestamp
  )`,
  `CREATE TABLE IF NOT EXISTS "rivalry_matches" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "rivalry_id" uuid NOT NULL REFERENCES "rivalries"("id") ON DELETE CASCADE,
    "game" varchar(50) NOT NULL,
    "winner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "loser_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "is_draw" boolean DEFAULT false NOT NULL,
    "metadata" jsonb DEFAULT '{}',
    "played_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rivalry_stats" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "rivalry_id" uuid NOT NULL REFERENCES "rivalries"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "draws" integer DEFAULT 0 NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "best_streak" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "username_slug" varchar(50) UNIQUE,
    "bio" varchar(500),
    "banner_url" varchar(500),
    "featured_achievements" jsonb DEFAULT '[]',
    "social_links" jsonb DEFAULT '{}',
    "is_public" boolean DEFAULT true NOT NULL,
    "show_stats" boolean DEFAULT true NOT NULL,
    "show_activity" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "profile_views" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "profile_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
    "viewer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "viewed_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "category" varchar(50) NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "rank" integer,
    "period" varchar(20) DEFAULT 'all_time' NOT NULL,
    "period_start" timestamp,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "clips" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" varchar(100) NOT NULL,
    "description" varchar(500),
    "game" varchar(50) NOT NULL,
    "category" varchar(50),
    "blob_url" varchar(500) NOT NULL,
    "thumbnail_url" varchar(500),
    "duration_seconds" integer,
    "is_public" boolean DEFAULT true NOT NULL,
    "view_count" integer DEFAULT 0 NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "clip_likes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "clip_id" uuid NOT NULL REFERENCES "clips"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "clip_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "clip_id" uuid NOT NULL REFERENCES "clips"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" varchar(500) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "gaming_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "host_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" varchar(100) NOT NULL,
    "description" text,
    "game" varchar(50) NOT NULL,
    "activity_type" varchar(50),
    "scheduled_at" timestamp NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "max_participants" integer,
    "is_private" boolean DEFAULT false NOT NULL,
    "invite_code" varchar(20) UNIQUE,
    "status" varchar(20) DEFAULT 'scheduled' NOT NULL,
    "linked_lobby_id" uuid,
    "linked_tournament_id" uuid,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "session_rsvps" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "session_id" uuid NOT NULL REFERENCES "gaming_sessions"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "responded_at" timestamp,
    "note" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "session_invites" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "session_id" uuid NOT NULL REFERENCES "gaming_sessions"("id") ON DELETE CASCADE,
    "invited_user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
    "invited_discord_id" varchar(50),
    "invited_email" varchar(255),
    "invited_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
];

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Running " + STATEMENTS.length + " CREATE TABLE statements...");

  for (let i = 0; i < STATEMENTS.length; i++) {
    const statement = STATEMENTS[i];
    const tableName = statement.match(/"(\w+)"/)?.[1] || "unknown";

    try {
      await sql.query(statement);
      console.log("Created table: " + tableName);
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("Table already exists: " + tableName);
      } else {
        console.error("Failed to create " + tableName + ":", error.message);
      }
    }
  }

  console.log("\nMigration complete!");
}

runMigration().catch(console.error);
