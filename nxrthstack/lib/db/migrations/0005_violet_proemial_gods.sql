CREATE TABLE "mc_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"label" varchar(100),
	"default_role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_by_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mc_access_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "mc_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"granted_via_code_id" uuid,
	"granted_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mc_dashboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"page" varchar(50) NOT NULL,
	"layouts" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mc_dashboard_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" varchar(30) DEFAULT 'gamehub' NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"console_font_size" integer DEFAULT 14 NOT NULL,
	"console_timestamps" boolean DEFAULT true NOT NULL,
	"console_auto_scroll" boolean DEFAULT true NOT NULL,
	"custom_colors" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mc_dashboard_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mc_server_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"category" varchar(30) NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mc_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"agent_url" varchar(500) NOT NULL,
	"agent_secret" varchar(255) NOT NULL,
	"game_port" integer DEFAULT 25565 NOT NULL,
	"rcon_port" integer DEFAULT 25575 NOT NULL,
	"max_players" integer DEFAULT 20,
	"server_type" varchar(20) DEFAULT 'paper' NOT NULL,
	"icon_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mc_servers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "mc_access_codes" ADD CONSTRAINT "mc_access_codes_server_id_mc_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mc_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_access_codes" ADD CONSTRAINT "mc_access_codes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_access_grants" ADD CONSTRAINT "mc_access_grants_server_id_mc_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mc_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_access_grants" ADD CONSTRAINT "mc_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_access_grants" ADD CONSTRAINT "mc_access_grants_granted_via_code_id_mc_access_codes_id_fk" FOREIGN KEY ("granted_via_code_id") REFERENCES "public"."mc_access_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_access_grants" ADD CONSTRAINT "mc_access_grants_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_dashboard_layouts" ADD CONSTRAINT "mc_dashboard_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_dashboard_layouts" ADD CONSTRAINT "mc_dashboard_layouts_server_id_mc_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mc_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_dashboard_preferences" ADD CONSTRAINT "mc_dashboard_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_server_events" ADD CONSTRAINT "mc_server_events_server_id_mc_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mc_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_server_events" ADD CONSTRAINT "mc_server_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;