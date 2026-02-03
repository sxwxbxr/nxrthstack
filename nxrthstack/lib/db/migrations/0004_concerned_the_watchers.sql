CREATE TABLE "webhook_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"webhook_url" varchar(300),
	"event_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "neon_auth_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legacy_password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_migrated_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gamehub_onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_neon_auth_user_id_unique" UNIQUE("neon_auth_user_id");