import { db, tacticsGameConfig } from "@/lib/db";
import { eq } from "drizzle-orm";

// ============================================================================
// Tactics Game Config - DB-backed with in-memory cache
// ============================================================================

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/** Default config values - used when no DB entry exists */
export const DEFAULT_CONFIG: Record<string, { value: unknown; description: string }> = {
  wheel_rarity_weights: {
    value: [
      { rarity: "common", weight: 40 },
      { rarity: "uncommon", weight: 25 },
      { rarity: "rare", weight: 18 },
      { rarity: "epic", weight: 10 },
      { rarity: "legendary", weight: 5 },
      { rarity: "mythic", weight: 1.5 },
      { rarity: "secret", weight: 0.5 },
    ],
    description: "Wheel spin rarity weights (higher = more likely)",
  },
  enchant_success_rates: {
    value: [0.9, 0.75, 0.6, 0.45, 0.3, 0.15, 0.05],
    description: "Enchantment success rate per level (0→1, 1→2, etc.)",
  },
  enchant_failure_neutral_chance: {
    value: 0.10,
    description: "Chance that a failed enchant does nothing (vs downgrade)",
  },
  match_currency_rewards: {
    value: { attackWin: 75, attackLoss: 20, defendWin: 40, defendLoss: 10 },
    description: "Base currency rewards for PvP matches",
  },
  campaign_reward_multiplier: {
    value: 1.0,
    description: "Multiplier for campaign currency rewards",
  },
  loot_drop_chance_win: {
    value: 0.15,
    description: "Chance to drop loot after winning a match",
  },
  loot_drop_chance_loss: {
    value: 0.05,
    description: "Chance to drop loot after losing a match",
  },
  lucky_find_chance: {
    value: 0.10,
    description: "Chance for bonus currency after a match",
  },
  lucky_find_range: {
    value: { min: 25, max: 100 },
    description: "Random bonus currency range for lucky finds",
  },
};

/** Get a config value with caching */
export async function getConfig<T = unknown>(key: string): Promise<T> {
  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  // Query DB
  const row = await db.query.tacticsGameConfig.findFirst({
    where: eq(tacticsGameConfig.key, key),
  });

  const value = row ? row.value : DEFAULT_CONFIG[key]?.value ?? null;

  // Update cache
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

  return value as T;
}

/** Set a config value (admin only) - updates DB and clears cache */
export async function setConfig(key: string, value: unknown): Promise<void> {
  const existing = await db.query.tacticsGameConfig.findFirst({
    where: eq(tacticsGameConfig.key, key),
  });

  if (existing) {
    await db
      .update(tacticsGameConfig)
      .set({ value, updatedAt: new Date() })
      .where(eq(tacticsGameConfig.key, key));
  } else {
    const description = DEFAULT_CONFIG[key]?.description ?? "";
    await db.insert(tacticsGameConfig).values({ key, value, description });
  }

  // Clear cache for this key
  cache.delete(key);
}

/** Get all config entries (for admin panel) */
export async function getAllConfig(): Promise<
  { key: string; value: unknown; description: string | null; updatedAt: Date }[]
> {
  const rows = await db.select().from(tacticsGameConfig);

  // Merge with defaults to show all keys
  const result: { key: string; value: unknown; description: string | null; updatedAt: Date }[] = [];
  const dbKeys = new Set(rows.map((r) => r.key));

  for (const row of rows) {
    result.push({
      key: row.key,
      value: row.value,
      description: row.description,
      updatedAt: row.updatedAt,
    });
  }

  // Add defaults that aren't in DB yet
  for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
    if (!dbKeys.has(key)) {
      result.push({
        key,
        value: def.value,
        description: def.description,
        updatedAt: new Date(),
      });
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

/** Clear entire config cache */
export function clearConfigCache(): void {
  cache.clear();
}
