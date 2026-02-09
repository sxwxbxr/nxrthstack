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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  productType: varchar("product_type", { length: 20 }).notNull(), // 'free' | 'paid' | 'subscription'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
});

// Product pricing tiers
export const productPrices = pgTable("product_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // e.g., 'Basic', 'Pro', 'Enterprise'
  priceCents: integer("price_cents").notNull(), // 0 for free
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  billingPeriod: varchar("billing_period", { length: 20 }), // NULL for one-time, 'monthly' | 'annual' | 'custom'
  billingIntervalCount: integer("billing_interval_count").default(1), // e.g., 3 for quarterly
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  features: jsonb("features").default([]), // array of feature strings
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Product images/gallery
export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

// Product files (downloadable assets)
export const productFiles = pgTable("product_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  priceId: uuid("price_id").references(() => productPrices.id, {
    onDelete: "set null",
  }), // NULL = available for all tiers
  name: varchar("name", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(), // NAS storage URL
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  fileType: varchar("file_type", { length: 100 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Purchases (one-time payments)
export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  priceId: uuid("price_id").references(() => productPrices.id, {
    onDelete: "set null",
  }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", {
    length: 255,
  }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'completed' | 'failed' | 'refunded'
  licenseKey: varchar("license_key", { length: 500 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  priceId: uuid("price_id").references(() => productPrices.id, {
    onDelete: "set null",
  }),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 255,
  }).unique(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'canceled' | 'past_due' | 'paused'
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// NxrthGuard Licenses
export const licenses = pgTable("licenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  licenseKey: varchar("license_key", { length: 100 }).notNull().unique(),
  tier: varchar("tier", { length: 20 }).notNull(), // 'free' | 'plus' | 'trial'
  features: jsonb("features").default([]).notNull(),
  maxDevices: integer("max_devices").default(5).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }), // NULL for lifetime
  isTrial: boolean("is_trial").default(false).notNull(),
  trialStartedAt: timestamp("trial_started_at", { mode: "date" }),
  purchaseId: uuid("purchase_id").references(() => purchases.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Device activations for NxrthGuard
export const deviceActivations = pgTable("device_activations", {
  id: uuid("id").defaultRandom().primaryKey(),
  licenseId: uuid("license_id")
    .notNull()
    .references(() => licenses.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 255 }),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  activatedAt: timestamp("activated_at", { mode: "date" }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }).defaultNow().notNull(),
});

// Refresh tokens for NxrthGuard API
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  deviceName: varchar("device_name", { length: 255 }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// NextAuth sessions
export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// NextAuth verification tokens
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ============================================================================
// GameHub Tables
// ============================================================================

// GameHub Announcements (Blackboard)
export const gamehubAnnouncements = pgTable("gamehub_announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }), // 'general' | 'r6' | 'minecraft'
  isPinned: boolean("is_pinned").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 1v1 Lobbies
export const r6Lobbies = pgTable("r6_lobbies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  opponentId: uuid("opponent_id").references(() => users.id, {
    onDelete: "set null",
  }),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open' | 'active' | 'completed'
  trackKills: boolean("track_kills").default(true).notNull(),
  deletionRequestedBy: uuid("deletion_requested_by").references(() => users.id, {
    onDelete: "set null",
  }), // User who requested deletion (other user must confirm)
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 1v1 Matches
export const r6Matches = pgTable("r6_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  lobbyId: uuid("lobby_id")
    .notNull()
    .references(() => r6Lobbies.id, { onDelete: "cascade" }),
  winnerId: uuid("winner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  player1Kills: integer("player1_kills"),
  player1Deaths: integer("player1_deaths"),
  player2Kills: integer("player2_kills"),
  player2Deaths: integer("player2_deaths"),
  player1RoundsWon: integer("player1_rounds_won"),
  player2RoundsWon: integer("player2_rounds_won"),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 Operators (Static Data for Randomizer)
export const r6Operators = pgTable("r6_operators", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull(), // 'attacker' | 'defender'
  iconUrl: varchar("icon_url", { length: 500 }),
  primaryWeapons: jsonb("primary_weapons").default([]).notNull(),
  secondaryWeapons: jsonb("secondary_weapons").default([]).notNull(),
  gadgets: jsonb("gadgets").default([]).notNull(),
  sights: jsonb("sights").default([]).notNull(),
  barrels: jsonb("barrels").default([]).notNull(),
  grips: jsonb("grips").default([]).notNull(),
  underbarrels: jsonb("underbarrels").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  sessions: many(sessions),
  licenses: many(licenses),
  deviceActivations: many(deviceActivations),
  refreshTokens: many(refreshTokens),
  hostedLobbies: many(r6Lobbies, { relationName: "host" }),
  joinedLobbies: many(r6Lobbies, { relationName: "opponent" }),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences),
}));

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(productPrices),
  images: many(productImages),
  files: many(productFiles),
  purchases: many(purchases),
  subscriptions: many(subscriptions),
}));

export const productPricesRelations = relations(
  productPrices,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productPrices.productId],
      references: [products.id],
    }),
    files: many(productFiles),
    purchases: many(purchases),
    subscriptions: many(subscriptions),
  })
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productFilesRelations = relations(productFiles, ({ one }) => ({
  product: one(products, {
    fields: [productFiles.productId],
    references: [products.id],
  }),
  price: one(productPrices, {
    fields: [productFiles.priceId],
    references: [productPrices.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [purchases.productId],
    references: [products.id],
  }),
  price: one(productPrices, {
    fields: [purchases.priceId],
    references: [productPrices.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [subscriptions.productId],
    references: [products.id],
  }),
  price: one(productPrices, {
    fields: [subscriptions.priceId],
    references: [productPrices.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  purchase: one(purchases, {
    fields: [licenses.purchaseId],
    references: [purchases.id],
  }),
  deviceActivations: many(deviceActivations),
}));

export const deviceActivationsRelations = relations(deviceActivations, ({ one }) => ({
  license: one(licenses, {
    fields: [deviceActivations.licenseId],
    references: [licenses.id],
  }),
  user: one(users, {
    fields: [deviceActivations.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// GameHub Relations
export const gamehubAnnouncementsRelations = relations(
  gamehubAnnouncements,
  () => ({})
);

export const r6LobbiesRelations = relations(r6Lobbies, ({ one, many }) => ({
  host: one(users, {
    fields: [r6Lobbies.hostId],
    references: [users.id],
    relationName: "host",
  }),
  opponent: one(users, {
    fields: [r6Lobbies.opponentId],
    references: [users.id],
    relationName: "opponent",
  }),
  matches: many(r6Matches),
}));

export const r6MatchesRelations = relations(r6Matches, ({ one }) => ({
  lobby: one(r6Lobbies, {
    fields: [r6Matches.lobbyId],
    references: [r6Lobbies.id],
  }),
  winner: one(users, {
    fields: [r6Matches.winnerId],
    references: [users.id],
  }),
}));

export const r6OperatorsRelations = relations(r6Operators, () => ({}));

// R6 Tournaments
export const r6Tournaments = pgTable("r6_tournaments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  format: varchar("format", { length: 20 }).default("single_elimination").notNull(), // 'single_elimination' | 'double_elimination'
  size: integer("size").notNull(), // 4, 8, 16, 32
  status: varchar("status", { length: 20 }).default("registration").notNull(), // 'registration' | 'in_progress' | 'completed'
  trackKills: boolean("track_kills").default(true).notNull(),
  bestOf: integer("best_of").default(1).notNull(), // 1, 3, 5
  currentRound: integer("current_round").default(0).notNull(),
  winnerId: uuid("winner_id").references(() => users.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 Tournament Participants
export const r6TournamentParticipants = pgTable("r6_tournament_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => r6Tournaments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seed: integer("seed"), // Seeding position (1 = top seed)
  isEliminated: boolean("is_eliminated").default(false).notNull(),
  eliminatedAt: integer("eliminated_at"), // Round number when eliminated
  finalPlacement: integer("final_placement"), // Final ranking (1st, 2nd, 3rd, etc.)
  totalKills: integer("total_kills").default(0).notNull(),
  totalDeaths: integer("total_deaths").default(0).notNull(),
  totalRoundsWon: integer("total_rounds_won").default(0).notNull(),
  totalRoundsLost: integer("total_rounds_lost").default(0).notNull(),
  matchesWon: integer("matches_won").default(0).notNull(),
  matchesLost: integer("matches_lost").default(0).notNull(),
  joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 Tournament Matches (Bracket matches)
export const r6TournamentMatches = pgTable("r6_tournament_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => r6Tournaments.id, { onDelete: "cascade" }),
  round: integer("round").notNull(), // 1 = first round, increasing to finals
  matchNumber: integer("match_number").notNull(), // Position in the round (1, 2, 3, etc.)
  bracketSide: varchar("bracket_side", { length: 20 }).default("winners"), // 'winners' | 'losers' (for double elim)
  player1Id: uuid("player1_id").references(() => users.id, { onDelete: "set null" }),
  player2Id: uuid("player2_id").references(() => users.id, { onDelete: "set null" }),
  winnerId: uuid("winner_id").references(() => users.id, { onDelete: "set null" }),
  loserId: uuid("loser_id").references(() => users.id, { onDelete: "set null" }),
  player1Score: integer("player1_score").default(0).notNull(), // Games/maps won
  player2Score: integer("player2_score").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'in_progress' | 'completed' | 'bye'
  nextMatchId: uuid("next_match_id"), // Winner advances to this match
  nextMatchSlot: integer("next_match_slot"), // 1 or 2 (which slot in next match)
  loserNextMatchId: uuid("loser_next_match_id"), // For double elimination losers bracket
  scheduledAt: timestamp("scheduled_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// R6 Tournament Games (Individual games within a match, for best-of series)
export const r6TournamentGames = pgTable("r6_tournament_games", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => r6TournamentMatches.id, { onDelete: "cascade" }),
  gameNumber: integer("game_number").notNull(), // 1, 2, 3, etc.
  winnerId: uuid("winner_id").references(() => users.id, { onDelete: "set null" }),
  player1Kills: integer("player1_kills"),
  player1Deaths: integer("player1_deaths"),
  player2Kills: integer("player2_kills"),
  player2Deaths: integer("player2_deaths"),
  player1RoundsWon: integer("player1_rounds_won"),
  player2RoundsWon: integer("player2_rounds_won"),
  mapPlayed: varchar("map_played", { length: 100 }),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Tournament Relations
export const r6TournamentsRelations = relations(r6Tournaments, ({ one, many }) => ({
  host: one(users, {
    fields: [r6Tournaments.hostId],
    references: [users.id],
    relationName: "tournamentHost",
  }),
  winner: one(users, {
    fields: [r6Tournaments.winnerId],
    references: [users.id],
    relationName: "tournamentWinner",
  }),
  participants: many(r6TournamentParticipants),
  matches: many(r6TournamentMatches),
}));

export const r6TournamentParticipantsRelations = relations(r6TournamentParticipants, ({ one }) => ({
  tournament: one(r6Tournaments, {
    fields: [r6TournamentParticipants.tournamentId],
    references: [r6Tournaments.id],
  }),
  user: one(users, {
    fields: [r6TournamentParticipants.userId],
    references: [users.id],
  }),
}));

export const r6TournamentMatchesRelations = relations(r6TournamentMatches, ({ one, many }) => ({
  tournament: one(r6Tournaments, {
    fields: [r6TournamentMatches.tournamentId],
    references: [r6Tournaments.id],
  }),
  player1: one(users, {
    fields: [r6TournamentMatches.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [r6TournamentMatches.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
  winner: one(users, {
    fields: [r6TournamentMatches.winnerId],
    references: [users.id],
    relationName: "matchWinner",
  }),
  games: many(r6TournamentGames),
}));

export const r6TournamentGamesRelations = relations(r6TournamentGames, ({ one }) => ({
  match: one(r6TournamentMatches, {
    fields: [r6TournamentGames.matchId],
    references: [r6TournamentMatches.id],
  }),
  winner: one(users, {
    fields: [r6TournamentGames.winnerId],
    references: [users.id],
  }),
}));

// ============================================================================
// Pokemon ROM Editor Tables
// ============================================================================

// Pokemon Species Data (for randomization pools)
export const pokemonSpecies = pgTable("pokemon_species", {
  id: uuid("id").defaultRandom().primaryKey(),
  pokedexId: integer("pokedex_id").notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  generation: integer("generation").notNull(), // 1-3
  types: jsonb("types").notNull(), // ["grass", "poison"]
  hpBase: integer("hp_base").notNull(),
  attackBase: integer("attack_base").notNull(),
  defenseBase: integer("defense_base").notNull(),
  spAtkBase: integer("sp_atk_base").notNull(),
  spDefBase: integer("sp_def_base").notNull(),
  speedBase: integer("speed_base").notNull(),
  isLegendary: boolean("is_legendary").default(false).notNull(),
  isStarter: boolean("is_starter").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// ROM Configuration (offsets per game)
export const romConfigs = pgTable("rom_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameCode: varchar("game_code", { length: 20 }).notNull().unique(), // "POKEMON RED", "BPRE"
  gameName: varchar("game_name", { length: 100 }).notNull(),
  generation: integer("generation").notNull(),
  platform: varchar("platform", { length: 10 }).notNull(), // "GB", "GBC", "GBA"
  region: varchar("region", { length: 10 }).default("US").notNull(),
  pokemonCount: integer("pokemon_count").notNull(),
  offsets: jsonb("offsets").notNull(), // All ROM offsets
  structureSizes: jsonb("structure_sizes").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Type Effectiveness Chart
export const typeChart = pgTable("type_chart", {
  id: uuid("id").defaultRandom().primaryKey(),
  generation: integer("generation").notNull(), // 1, 2, or 3+
  typeName: varchar("type_name", { length: 15 }).notNull(),
  typeId: integer("type_id").notNull(),
  effectiveness: jsonb("effectiveness").notNull(), // {water: 2, fire: 0.5, ...}
});

// Stored ROMs (for preset selection)
export const storedRoms = pgTable("stored_roms", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameCode: varchar("game_code", { length: 20 }).notNull(), // Links to romConfigs.gameCode
  displayName: varchar("display_name", { length: 100 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(), // NAS storage URL
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
  checksum: varchar("checksum", { length: 64 }), // SHA-256 for verification
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Pokemon Relations
export const pokemonSpeciesRelations = relations(pokemonSpecies, () => ({}));
export const romConfigsRelations = relations(romConfigs, () => ({}));
export const typeChartRelations = relations(typeChart, () => ({}));
export const storedRomsRelations = relations(storedRoms, ({ one }) => ({
  uploader: one(users, {
    fields: [storedRoms.uploadedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Feature Requests & Bug Reports
// ============================================================================

// Feature Requests / Bug Reports
export const featureRequests = pgTable("feature_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'feature' | 'bug'
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  priority: varchar("priority", { length: 20 }), // 'low' | 'medium' | 'high' | 'critical' (admin set)
  adminNotes: text("admin_notes"), // Private notes from admin
  category: varchar("category", { length: 50 }), // 'gamehub' | 'shop' | 'dashboard' | 'general' | etc.
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Votes on Feature Requests
export const featureVotes = pgTable(
  "feature_votes",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => featureRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.requestId, table.userId] })]
);

// Feature Request Relations
export const featureRequestsRelations = relations(featureRequests, ({ one, many }) => ({
  author: one(users, {
    fields: [featureRequests.authorId],
    references: [users.id],
  }),
  votes: many(featureVotes),
}));

export const featureVotesRelations = relations(featureVotes, ({ one }) => ({
  request: one(featureRequests, {
    fields: [featureVotes.requestId],
    references: [featureRequests.id],
  }),
  user: one(users, {
    fields: [featureVotes.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Achievement System
// ============================================================================

// Achievement Definitions
export const gamehubAchievements = pgTable("gamehub_achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }), // Icon name from Icons component
  category: varchar("category", { length: 50 }).notNull(), // 'pokemon' | 'minecraft' | 'r6' | 'general'
  points: integer("points").default(10).notNull(),
  rarity: varchar("rarity", { length: 20 }).default("common"), // 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isSecret: boolean("is_secret").default(false).notNull(), // Hidden until unlocked
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// User Achievement Unlocks
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id")
    .notNull()
    .references(() => gamehubAchievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at", { mode: "date" }).defaultNow().notNull(),
});

// Achievement Relations
export const gamehubAchievementsRelations = relations(gamehubAchievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(gamehubAchievements, {
    fields: [userAchievements.achievementId],
    references: [gamehubAchievements.id],
  }),
}));

// ============================================================================
// Stream Overlays
// ============================================================================

// Stream Overlay Configurations
export const streamOverlays = pgTable("stream_overlays", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'shiny_counter' | 'r6_stats' | 'pokemon_team'
  name: varchar("name", { length: 100 }).notNull(),
  config: jsonb("config").default({}).notNull(), // Type-specific configuration
  accessToken: varchar("access_token", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Stream Overlay Relations
export const streamOverlaysRelations = relations(streamOverlays, ({ one }) => ({
  user: one(users, {
    fields: [streamOverlays.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Notifications System
// ============================================================================

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // e.g., 'achievement_unlocked', 'product_update_available'
  category: varchar("category", { length: 30 }).notNull(), // 'gamehub' | 'product' | 'system'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }), // Optional link
  actionLabel: varchar("action_label", { length: 100 }), // e.g., "View Achievement"
  metadata: jsonb("metadata").default({}), // Type-specific data (productId, achievementKey, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { mode: "date" }),
  // For future SMTP integration
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at", { mode: "date" }),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }), // Optional expiration
});

// Notification preferences per user
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  // GameHub notifications (website only)
  gamehubAchievements: boolean("gamehub_achievements").default(true).notNull(),
  gamehubLobbyInvites: boolean("gamehub_lobby_invites").default(true).notNull(),
  gamehubMatchResults: boolean("gamehub_match_results").default(true).notNull(),
  gamehubTournaments: boolean("gamehub_tournaments").default(true).notNull(),
  gamehubAnnouncements: boolean("gamehub_announcements").default(true).notNull(),
  // Product notifications (website + future email)
  productUpdates: boolean("product_updates").default(true).notNull(),
  productUpdatesEmail: boolean("product_updates_email").default(true).notNull(),
  // System notifications
  systemAnnouncements: boolean("system_announcements").default(true).notNull(),
  systemAnnouncementsEmail: boolean("system_announcements_email").default(true).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Notification Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Gaming Session Scheduler
// ============================================================================

// Gaming Sessions
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

export const sessionInvitesRelations = relations(sessionInvites, ({ one }) => ({
  session: one(gamingSessions, {
    fields: [sessionInvites.sessionId],
    references: [gamingSessions.id],
  }),
  invitedUser: one(users, {
    fields: [sessionInvites.invitedUserId],
    references: [users.id],
    relationName: "invitedUser",
  }),
  inviter: one(users, {
    fields: [sessionInvites.invitedBy],
    references: [users.id],
    relationName: "inviter",
  }),
}));

// ============================================================================
// Friends & Activity Feed
// ============================================================================

// Friendships
export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  friendId: uuid("friend_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'accepted' | 'blocked'
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { mode: "date" }),
});

// Activity Feed
export const activityFeed = pgTable("activity_feed", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'achievement_unlocked' | 'session_joined' | 'match_won' | 'rivalry_update' | 'clip_uploaded'
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  game: varchar("game", { length: 50 }),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Activity Likes
export const activityLikes = pgTable("activity_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  activityId: uuid("activity_id")
    .notNull()
    .references(() => activityFeed.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Activity Comments
export const activityComments = pgTable("activity_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  activityId: uuid("activity_id")
    .notNull()
    .references(() => activityFeed.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Friends & Activity Relations
export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "friendshipUser",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friendshipFriend",
  }),
}));

export const activityFeedRelations = relations(activityFeed, ({ one, many }) => ({
  user: one(users, {
    fields: [activityFeed.userId],
    references: [users.id],
  }),
  likes: many(activityLikes),
  comments: many(activityComments),
}));

export const activityLikesRelations = relations(activityLikes, ({ one }) => ({
  activity: one(activityFeed, {
    fields: [activityLikes.activityId],
    references: [activityFeed.id],
  }),
  user: one(users, {
    fields: [activityLikes.userId],
    references: [users.id],
  }),
}));

export const activityCommentsRelations = relations(activityComments, ({ one }) => ({
  activity: one(activityFeed, {
    fields: [activityComments.activityId],
    references: [activityFeed.id],
  }),
  user: one(users, {
    fields: [activityComments.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Rivalry System
// ============================================================================

// Rivalries
export const rivalries = pgTable("rivalries", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengerId: uuid("challenger_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  opponentId: uuid("opponent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'active' | 'ended'
  season: integer("season").default(1).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
});

// Rivalry Matches
export const rivalryMatches = pgTable("rivalry_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  rivalryId: uuid("rivalry_id")
    .notNull()
    .references(() => rivalries.id, { onDelete: "cascade" }),
  game: varchar("game", { length: 50 }).notNull(),
  winnerId: uuid("winner_id").references(() => users.id, { onDelete: "set null" }),
  loserId: uuid("loser_id").references(() => users.id, { onDelete: "set null" }),
  isDraw: boolean("is_draw").default(false).notNull(),
  metadata: jsonb("metadata").default({}),
  playedAt: timestamp("played_at", { mode: "date" }).defaultNow().notNull(),
});

// Rivalry Stats
export const rivalryStats = pgTable("rivalry_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  rivalryId: uuid("rivalry_id")
    .notNull()
    .references(() => rivalries.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Rivalry Relations
export const rivalriesRelations = relations(rivalries, ({ one, many }) => ({
  challenger: one(users, {
    fields: [rivalries.challengerId],
    references: [users.id],
    relationName: "rivalryChallenger",
  }),
  opponent: one(users, {
    fields: [rivalries.opponentId],
    references: [users.id],
    relationName: "rivalryOpponent",
  }),
  matches: many(rivalryMatches),
  stats: many(rivalryStats),
}));

export const rivalryMatchesRelations = relations(rivalryMatches, ({ one }) => ({
  rivalry: one(rivalries, {
    fields: [rivalryMatches.rivalryId],
    references: [rivalries.id],
  }),
  winner: one(users, {
    fields: [rivalryMatches.winnerId],
    references: [users.id],
    relationName: "matchWinnerRivalry",
  }),
  loser: one(users, {
    fields: [rivalryMatches.loserId],
    references: [users.id],
    relationName: "matchLoserRivalry",
  }),
}));

export const rivalryStatsRelations = relations(rivalryStats, ({ one }) => ({
  rivalry: one(rivalries, {
    fields: [rivalryStats.rivalryId],
    references: [rivalries.id],
  }),
  user: one(users, {
    fields: [rivalryStats.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Gaming Passport (Public Profile)
// ============================================================================

// User Profiles
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  usernameSlug: varchar("username_slug", { length: 50 }).unique(), // for /u/username URL
  bio: varchar("bio", { length: 500 }),
  bannerUrl: varchar("banner_url", { length: 500 }),
  featuredAchievements: jsonb("featured_achievements").default([]), // array of achievement IDs
  socialLinks: jsonb("social_links").default({}),
  isPublic: boolean("is_public").default(true).notNull(),
  showStats: boolean("show_stats").default(true).notNull(),
  showActivity: boolean("show_activity").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Profile Views
export const profileViews = pgTable("profile_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "set null" }),
  viewedAt: timestamp("viewed_at", { mode: "date" }).defaultNow().notNull(),
});

// Profile Relations
export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  views: many(profileViews),
}));

export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [profileViews.profileId],
    references: [userProfiles.id],
  }),
  viewer: one(users, {
    fields: [profileViews.viewerId],
    references: [users.id],
  }),
}));

// ============================================================================
// Global Leaderboards
// ============================================================================

// Leaderboard Entries
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(), // 'achievement_points' | 'r6_wins' | 'pokemon_shinies' | etc.
  score: integer("score").default(0).notNull(),
  rank: integer("rank"),
  period: varchar("period", { length: 20 }).default("all_time").notNull(), // 'weekly' | 'monthly' | 'all_time'
  periodStart: timestamp("period_start", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Leaderboard Relations
export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Clip Gallery
// ============================================================================

// Clips
export const clips = pgTable("clips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  game: varchar("game", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }), // 'funny' | 'clutch' | 'fail' | 'tutorial'
  blobUrl: varchar("blob_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  durationSeconds: integer("duration_seconds"),
  isPublic: boolean("is_public").default(true).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Clip Likes
export const clipLikes = pgTable("clip_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  clipId: uuid("clip_id")
    .notNull()
    .references(() => clips.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Clip Comments
export const clipComments = pgTable("clip_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clipId: uuid("clip_id")
    .notNull()
    .references(() => clips.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Clip Relations
export const clipsRelations = relations(clips, ({ one, many }) => ({
  user: one(users, {
    fields: [clips.userId],
    references: [users.id],
  }),
  likes: many(clipLikes),
  comments: many(clipComments),
}));

export const clipLikesRelations = relations(clipLikes, ({ one }) => ({
  clip: one(clips, {
    fields: [clipLikes.clipId],
    references: [clips.id],
  }),
  user: one(users, {
    fields: [clipLikes.userId],
    references: [users.id],
  }),
}));

export const clipCommentsRelations = relations(clipComments, ({ one }) => ({
  clip: one(clips, {
    fields: [clipComments.clipId],
    references: [clips.id],
  }),
  user: one(users, {
    fields: [clipComments.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Discord Bot Integration
// ============================================================================

// Webhook configurations per guild
export const webhookConfigs = pgTable("webhook_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  guildId: varchar("guild_id", { length: 20 }).notNull(),
  channelId: varchar("channel_id", { length: 20 }).notNull(),
  webhookUrl: varchar("webhook_url", { length: 300 }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'sessions' | 'achievements' | 'rivalries' | 'announcements'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Webhook Config Relations
export const webhookConfigsRelations = relations(webhookConfigs, () => ({}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductPrice = typeof productPrices.$inferSelect;
export type NewProductPrice = typeof productPrices.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductFile = typeof productFiles.$inferSelect;
export type NewProductFile = typeof productFiles.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;
export type DeviceActivation = typeof deviceActivations.$inferSelect;
export type NewDeviceActivation = typeof deviceActivations.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

// GameHub Types
export type GamehubAnnouncement = typeof gamehubAnnouncements.$inferSelect;
export type NewGamehubAnnouncement = typeof gamehubAnnouncements.$inferInsert;
export type R6Lobby = typeof r6Lobbies.$inferSelect;
export type NewR6Lobby = typeof r6Lobbies.$inferInsert;
export type R6Match = typeof r6Matches.$inferSelect;
export type NewR6Match = typeof r6Matches.$inferInsert;
export type R6Operator = typeof r6Operators.$inferSelect;
export type NewR6Operator = typeof r6Operators.$inferInsert;

// Pokemon Types
export type PokemonSpecies = typeof pokemonSpecies.$inferSelect;
export type NewPokemonSpecies = typeof pokemonSpecies.$inferInsert;
export type RomConfig = typeof romConfigs.$inferSelect;
export type NewRomConfig = typeof romConfigs.$inferInsert;
export type TypeChart = typeof typeChart.$inferSelect;
export type NewTypeChart = typeof typeChart.$inferInsert;
export type StoredRom = typeof storedRoms.$inferSelect;
export type NewStoredRom = typeof storedRoms.$inferInsert;

// Feature Request Types
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type NewFeatureRequest = typeof featureRequests.$inferInsert;
export type FeatureVote = typeof featureVotes.$inferSelect;
export type NewFeatureVote = typeof featureVotes.$inferInsert;

// Tournament Types
export type R6Tournament = typeof r6Tournaments.$inferSelect;
export type NewR6Tournament = typeof r6Tournaments.$inferInsert;
export type R6TournamentParticipant = typeof r6TournamentParticipants.$inferSelect;
export type NewR6TournamentParticipant = typeof r6TournamentParticipants.$inferInsert;
export type R6TournamentMatch = typeof r6TournamentMatches.$inferSelect;
export type NewR6TournamentMatch = typeof r6TournamentMatches.$inferInsert;
export type R6TournamentGame = typeof r6TournamentGames.$inferSelect;
export type NewR6TournamentGame = typeof r6TournamentGames.$inferInsert;

// Achievement Types
export type GamehubAchievement = typeof gamehubAchievements.$inferSelect;
export type NewGamehubAchievement = typeof gamehubAchievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

// Stream Overlay Types
export type StreamOverlay = typeof streamOverlays.$inferSelect;
export type NewStreamOverlay = typeof streamOverlays.$inferInsert;

// Notification Types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;

// Gaming Session Types
export type GamingSession = typeof gamingSessions.$inferSelect;
export type NewGamingSession = typeof gamingSessions.$inferInsert;
export type SessionRsvp = typeof sessionRsvps.$inferSelect;
export type NewSessionRsvp = typeof sessionRsvps.$inferInsert;
export type SessionInvite = typeof sessionInvites.$inferSelect;
export type NewSessionInvite = typeof sessionInvites.$inferInsert;

// Friends & Activity Types
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type Activity = typeof activityFeed.$inferSelect;
export type NewActivity = typeof activityFeed.$inferInsert;
export type ActivityLike = typeof activityLikes.$inferSelect;
export type NewActivityLike = typeof activityLikes.$inferInsert;
export type ActivityComment = typeof activityComments.$inferSelect;
export type NewActivityComment = typeof activityComments.$inferInsert;

// Rivalry Types
export type Rivalry = typeof rivalries.$inferSelect;
export type NewRivalry = typeof rivalries.$inferInsert;
export type RivalryMatch = typeof rivalryMatches.$inferSelect;
export type NewRivalryMatch = typeof rivalryMatches.$inferInsert;
export type RivalryStat = typeof rivalryStats.$inferSelect;
export type NewRivalryStat = typeof rivalryStats.$inferInsert;

// Gaming Passport Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type ProfileView = typeof profileViews.$inferSelect;
export type NewProfileView = typeof profileViews.$inferInsert;

// Leaderboard Types
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

// Clip Gallery Types
export type Clip = typeof clips.$inferSelect;
export type NewClip = typeof clips.$inferInsert;
export type ClipLike = typeof clipLikes.$inferSelect;
export type NewClipLike = typeof clipLikes.$inferInsert;
export type ClipComment = typeof clipComments.$inferSelect;
export type NewClipComment = typeof clipComments.$inferInsert;

// Discord Bot Types
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type NewWebhookConfig = typeof webhookConfigs.$inferInsert;
