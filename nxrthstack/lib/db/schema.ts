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
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("customer").notNull(), // 'customer' | 'admin'
  isFriend: boolean("is_friend").default(false).notNull(), // GameHub access
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
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
  fileKey: varchar("file_key", { length: 500 }).notNull(), // Vercel Blob key
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
  trackKills: boolean("track_kills").default(false).notNull(),
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
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  sessions: many(sessions),
  licenses: many(licenses),
  deviceActivations: many(deviceActivations),
  refreshTokens: many(refreshTokens),
  hostedLobbies: many(r6Lobbies, { relationName: "host" }),
  joinedLobbies: many(r6Lobbies, { relationName: "opponent" }),
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
  fileKey: varchar("file_key", { length: 500 }).notNull(), // Vercel Blob key
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
