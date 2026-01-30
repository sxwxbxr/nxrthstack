/**
 * Custom License Provider Example
 *
 * This is a template for implementing a custom license provider.
 * Copy this file, rename it, and modify it for your application.
 *
 * To use:
 * 1. Copy this file to: lib/license-providers/myapp-provider.ts
 * 2. Update the constants and implementation
 * 3. Register the provider in lib/license-providers/index.ts
 */

import * as crypto from "crypto";
import {
  LicenseProvider,
  LicenseValidationResult,
  LicenseGenerationOptions,
  LicenseGenerationResult,
} from "./types";

// ============================================================================
// CONFIGURATION - Update these for your application
// ============================================================================

/**
 * Unique provider ID (lowercase, no spaces)
 */
const PROVIDER_ID = "myapp";

/**
 * Human-readable name
 */
const PROVIDER_NAME = "My Application";

/**
 * License key prefix (2-4 uppercase characters)
 * All license keys will start with: PREFIX-...
 */
const KEY_PREFIX = "MYAP";

/**
 * Character set for license key generation
 * Excludes ambiguous characters: 0, O, 1, I, L
 */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Secret key for HMAC signing (store in environment variable!)
 */
const SIGNING_SECRET = process.env.MYAPP_LICENSE_SECRET || "change-this-secret";

/**
 * Available tiers for this provider
 */
const TIERS = ["basic", "pro", "enterprise"];

/**
 * Features available for each tier
 */
const TIER_FEATURES: Record<string, string[]> = {
  basic: ["core_feature"],
  pro: ["core_feature", "advanced_feature", "priority_support"],
  enterprise: [
    "core_feature",
    "advanced_feature",
    "priority_support",
    "sso",
    "audit_logs",
    "custom_branding",
  ],
};

/**
 * Trial period in days
 */
const TRIAL_DAYS = 14;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate random characters from the charset
 */
function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

/**
 * Get tier code from tier name
 */
function getTierCode(tier: string): string {
  switch (tier.toLowerCase()) {
    case "enterprise":
      return "E";
    case "pro":
      return "P";
    case "basic":
    default:
      return "B";
  }
}

/**
 * Get tier name from tier code
 */
function getTierFromCode(code: string): string {
  switch (code.toUpperCase()) {
    case "E":
      return "enterprise";
    case "P":
      return "pro";
    case "B":
    default:
      return "basic";
  }
}

/**
 * Create HMAC signature for the given data
 */
function createSignature(data: string): string {
  return crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(data)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const CustomProvider: LicenseProvider = {
  id: PROVIDER_ID,
  name: PROVIDER_NAME,
  prefix: KEY_PREFIX,
  tiers: TIERS,

  /**
   * Generate a new license key
   *
   * Format: PREFIX-TIERRRRR-TTTTTTTT-SSSSSSSS
   * - PREFIX: Your key prefix (e.g., MYAP)
   * - TIER: Single character tier code (B/P/E)
   * - RRRR: 4 random characters (unique identifier)
   * - TTTTTTTT: 8 character timestamp (base36 encoded)
   * - SSSSSSSS: 8 character HMAC signature
   */
  async generate(
    options: LicenseGenerationOptions
  ): Promise<LicenseGenerationResult> {
    const tier = options.tier.toLowerCase();
    const tierCode = getTierCode(tier);
    const randomPart = randomChars(4);

    // Base36 encoded timestamp for compactness
    const timestamp = Date.now().toString(36).toUpperCase().padStart(8, "0");

    // Create the payload to sign
    const payload = `${KEY_PREFIX}-${tierCode}${randomPart}-${timestamp}`;

    // Generate signature
    const signature = createSignature(payload);

    // Final key format
    const key = `${payload}-${signature}`;

    // Calculate expiration
    let expiresAt: Date | null = options.expiresAt ?? null;

    // Auto-expire trial licenses
    if (tier === "trial" && !expiresAt) {
      expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    }

    // Basic tier expires in 1 year if no expiry specified
    // (Remove this if you want lifetime basic licenses)
    if (tier === "basic" && !expiresAt) {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
      key,
      tier,
      format: `${PROVIDER_ID}-v1`,
      expiresAt,
      metadata: {
        userId: options.userId,
        productId: options.productId,
        generatedAt: new Date().toISOString(),
        ...options.metadata,
      },
    };
  },

  /**
   * Validate a license key
   *
   * This is a pure validation - no database lookup.
   * Only checks the key format and signature.
   */
  validate(licenseKey: string): LicenseValidationResult {
    // Normalize the key
    const normalized = licenseKey.trim().toUpperCase();
    const parts = normalized.split("-");

    // Check prefix
    if (parts[0] !== KEY_PREFIX) {
      return {
        valid: false,
        tier: null,
        error: `Invalid prefix: expected ${KEY_PREFIX}`,
      };
    }

    // Check structure: PREFIX-TIERRRRR-TIMESTAMP-SIGNATURE
    if (parts.length !== 4) {
      return {
        valid: false,
        tier: null,
        error: "Invalid format: expected 4 segments",
      };
    }

    // Validate segment 2 (tier + random)
    if (parts[1].length !== 5) {
      return {
        valid: false,
        tier: null,
        error: "Invalid format: segment 2 should be 5 characters",
      };
    }

    // Validate segment 3 (timestamp)
    if (parts[2].length !== 8) {
      return {
        valid: false,
        tier: null,
        error: "Invalid format: segment 3 should be 8 characters",
      };
    }

    // Validate charset for all segments
    for (let i = 1; i < 4; i++) {
      for (const char of parts[i]) {
        if (!CHARSET.includes(char) && !/[0-9A-F]/.test(char)) {
          return {
            valid: false,
            tier: null,
            error: `Invalid character in segment ${i}: ${char}`,
          };
        }
      }
    }

    // Recreate and verify signature
    const payload = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const expectedSignature = createSignature(payload);

    if (parts[3] !== expectedSignature) {
      return {
        valid: false,
        tier: null,
        error: "Invalid signature",
      };
    }

    // Extract tier from first character of segment 2
    const tierCode = parts[1][0];
    const tier = getTierFromCode(tierCode);

    // Optional: Validate timestamp is not in the future
    // (This is a basic anti-tampering check)
    try {
      const timestamp = parseInt(parts[2], 36);
      if (timestamp > Date.now() + 60000) {
        // Allow 1 minute clock skew
        return {
          valid: false,
          tier: null,
          error: "Invalid timestamp",
        };
      }
    } catch {
      return {
        valid: false,
        tier: null,
        error: "Invalid timestamp format",
      };
    }

    return {
      valid: true,
      tier,
      metadata: {
        tierCode,
        createdAt: new Date(parseInt(parts[2], 36)).toISOString(),
      },
    };
  },

  /**
   * Get features for a tier
   */
  getFeaturesForTier(tier: string): string[] {
    return TIER_FEATURES[tier.toLowerCase()] || [];
  },

  /**
   * Mask a license key for display
   * Shows: PREFIX-TXXX-XXXX-XXXX
   */
  maskKey(licenseKey: string): string {
    const parts = licenseKey.split("-");
    if (parts.length < 2) {
      return `${KEY_PREFIX}-XXXX-XXXX-XXXX`;
    }
    // Show prefix and first char of segment 2 (tier indicator)
    return `${parts[0]}-${parts[1][0]}XXX-XXXX-XXXX`;
  },
};

// ============================================================================
// REGISTRATION HELPER
// ============================================================================

/**
 * Register this provider with the license system
 *
 * Call this in your application startup:
 *
 * ```typescript
 * import { registerCustomProvider } from './lib/license-providers/custom-provider.example';
 * registerCustomProvider();
 * ```
 */
export function registerCustomProvider(): void {
  // Dynamic import to avoid circular dependencies
  import("./index").then(({ registerProvider }) => {
    registerProvider(CustomProvider);
  });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your app initialization (e.g., lib/license-providers/index.ts):

import { CustomProvider } from './custom-provider.example';
providers.set('myapp', CustomProvider);

// Or register dynamically:
import { registerProvider } from './index';
import { CustomProvider } from './myapp-provider';
registerProvider(CustomProvider);

// Generate a license:
import { generateLicenseKey } from './lib/license-providers';

const license = await generateLicenseKey('myapp', {
  tier: 'pro',
  userId: 'user_123',
  productId: 'prod_myapp_pro',
});
console.log(license.key);
// Output: MYAP-P8K3D-1ABC2DEF-A1B2C3D4

// Validate a license:
import { validateLicenseKey } from './lib/license-providers';

const result = validateLicenseKey('MYAP-P8K3D-1ABC2DEF-A1B2C3D4');
console.log(result);
// Output: { valid: true, tier: 'pro', provider: 'myapp' }
*/
