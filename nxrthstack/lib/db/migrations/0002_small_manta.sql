CREATE TABLE "gaming_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"game" varchar(50) NOT NULL,
	"activity_type" varchar(50),
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"max_participants" integer,
	"is_private" boolean DEFAULT false NOT NULL,
	"invite_code" varchar(20),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"linked_lobby_id" uuid,
	"linked_tournament_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gaming_sessions_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "session_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"invited_user_id" uuid,
	"invited_discord_id" varchar(50),
	"invited_email" varchar(255),
	"invited_by" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"note" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_linked_lobby_id_r6_lobbies_id_fk" FOREIGN KEY ("linked_lobby_id") REFERENCES "public"."r6_lobbies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_linked_tournament_id_r6_tournaments_id_fk" FOREIGN KEY ("linked_tournament_id") REFERENCES "public"."r6_tournaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_invites" ADD CONSTRAINT "session_invites_session_id_gaming_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gaming_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_invites" ADD CONSTRAINT "session_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_invites" ADD CONSTRAINT "session_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_rsvps" ADD CONSTRAINT "session_rsvps_session_id_gaming_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gaming_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_rsvps" ADD CONSTRAINT "session_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;