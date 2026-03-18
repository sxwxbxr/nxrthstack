import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  jsonb,
  primaryKey,
  real,
  index,
} from "drizzle-orm/pg-core";

// === Users table (needed as FK target) ===
// Users table (customers and admins)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // Nullable for Neon Auth users
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("customer").notNull(), // 'customer' | 'admin'
  isFriend: boolean("is_friend").default(false).notNull(), // GameHub access
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  // Discord Integration
  discordId: varchar("discord_id", { length: 50 }).unique(),
  discordUsername: varchar("discord_username", { length: 100 }),
  discordAvatar: varchar("discord_avatar", { length: 255 }),
  discordConnectedAt: timestamp("discord_connected_at", { mode: "date" }),
  // Neon Auth Migration
  neonAuthUserId: varchar("neon_auth_user_id", { length: 255 }).unique(),
  legacyPasswordHash: varchar("legacy_password_hash", { length: 255 }),
  passwordMigratedAt: timestamp("password_migrated_at", { mode: "date" }),
  // GameHub Onboarding
  gamehubOnboardingComplete: boolean("gamehub_onboarding_complete").default(false).notNull(),
});

// === Gaming Sessions (used by scheduler) ===
export const gamingSessions = pgTable("gaming_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  game: varchar("game", { length: 50 }).notNull(), // 'r6' | 'minecraft' | 'pokemon' | 'valorant' | 'other'
  activityType: varchar("activity_type", { length: 50 }), // '1v1' | 'tournament' | 'casual' | 'ranked' | 'custom'
  scheduledAt: timestamp("scheduled_at", { mode: "date" }).notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  maxParticipants: integer("max_participants"), // NULL = unlimited
  isPrivate: boolean("is_private").default(false).notNull(), // Invite-only
  inviteCode: varchar("invite_code", { length: 20 }).unique(),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  // Integration with existing features
  linkedLobbyId: uuid("linked_lobby_id").references(() => r6Lobbies.id, { onDelete: "set null" }),
  linkedTournamentId: uuid("linked_tournament_id").references(() => r6Tournaments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Session RSVPs
export const sessionRsvps = pgTable("session_rsvps", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => gamingSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'going' | 'maybe' | 'not_going' | 'pending'
  respondedAt: timestamp("responded_at", { mode: "date" }),
  note: varchar("note", { length: 255 }), // Optional message
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Session Invites (for private sessions)
export const sessionInvites = pgTable("session_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => gamingSessions.id, { onDelete: "cascade" }),
  invitedUserId: uuid("invited_user_id").references(() => users.id, { onDelete: "cascade" }),
  invitedDiscordId: varchar("invited_discord_id", { length: 50 }), // Can invite by Discord ID
  invitedEmail: varchar("invited_email", { length: 255 }), // Can invite by email
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Gaming Session Relations
export const gamingSessionsRelations = relations(gamingSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [gamingSessions.hostId],
    references: [users.id],
    relationName: "sessionHost",
  }),
  linkedLobby: one(r6Lobbies, {
    fields: [gamingSessions.linkedLobbyId],
    references: [r6Lobbies.id],
  }),
  linkedTournament: one(r6Tournaments, {
    fields: [gamingSessions.linkedTournamentId],
    references: [r6Tournaments.id],
  }),
  rsvps: many(sessionRsvps),
  invites: many(sessionInvites),
}));

export const sessionRsvpsRelations = relations(sessionRsvps, ({ one }) => ({
  session: one(gamingSessions, {
    fields: [sessionRsvps.sessionId],
    references: [gamingSessions.id],
  }),
  user: one(users, {
    fields: [sessionRsvps.userId],
    references: [users.id],
  }),
}));


// === Minecraft Dashboard ===
