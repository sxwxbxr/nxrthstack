/**
 * NxrthMon License Provider
 *
 * License provider for NxrthMon system monitoring application.
 * Uses HMAC-SHA256 signature-based license validation.
 *
 * Subscription Tiers:
 * - Basic:      3 CHF/month | 25 CHF/year  | 1 device
 * - Pro:        5 CHF/month | 45 CHF/year  | 3 devices
 * - Power User: 8 CHF/month | 70 CHF/year  | Unlimited devices
 * - Trial:      7-day free trial with Pro features | 1 device
 */

import * as crypto from "crypto";
import {
  LicenseProvider,
  LicenseValidationResult,
  LicenseGenerationOptions,
  LicenseGenerationResult,
} from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * License key character set (no ambiguous characters: 0, O, 1, I, L)
 */
const LICENSE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * License key prefix for NxrthMon
 */
const KEY_PREFIX = "NXRM";

/**
 * HMAC signing secret for NxrthMon licenses
 * In production, this MUST be set via environment variable
 */
const SIGNING_SECRET =
  process.env.NXRTHMON_LICENSE_SECRET ||
  "nxrthmon-license-secret-change-in-production";

/**
 * Trial period duration in days
 */
const TRIAL_DAYS = 7;

/**
 * Available license tiers
 */
const TIERS = ["trial", "basic", "pro", "power_user"] as const;
type NxrthMonTier = (typeof TIERS)[number];

/**
 * Tier codes for license key encoding
 */
const TIER_CODES: Record<NxrthMonTier, string> = {
  trial: "T",
  basic: "B",
  pro: "P",
  power_user: "U",
};

/**
 * Max devices per tier
 */
export const NXRTHMON_MAX_DEVICES: Record<NxrthMonTier, number> = {
  trial: 1,
  basic: 1,
  pro: 3,
  power_user: 999, // Unlimited
};

/**
 * Features available for each tier
 *
 * Basic: Core monitoring features
 * Pro: Enhanced monitoring with alerts and export
 * Power User: Full feature set with advanced analytics
 * Trial: Pro features for 7 days
 */
const TIER_FEATURES: Record<NxrthMonTier, string[]> = {
  // Basic: 3 CHF/month | 25 CHF/year | 1 device
  basic: [
    "realtime_monitoring", // Real-time CPU, RAM, Disk, Network
    "process_list", // Process list with sorting/filtering
    "history_24h", // 24-hour historical graphs
    "minimize_to_tray", // Minimize to tray functionality
    "themes", // Light and dark themes
  ],

  // Pro: 5 CHF/month | 45 CHF/year | 3 devices
  pro: [
    // Everything in Basic
    "realtime_monitoring",
    "process_list",
    "history_24h",
    "minimize_to_tray",
    "themes",
    // Pro features
    "history_30d", // 30-day historical data
    "temperature_monitoring", // CPU and GPU temperature
    "threshold_alerts", // CPU, RAM, Temperature alerts
    "network_per_process", // Per-process bandwidth tracking
    "startup_analysis", // Startup impact analysis
    "export_csv_json", // Export to CSV/JSON
  ],

  // Power User: 8 CHF/month | 70 CHF/year | Unlimited devices
  power_user: [
    // Everything in Pro
    "realtime_monitoring",
    "process_list",
    "history_24h",
    "minimize_to_tray",
    "themes",
    "history_30d",
    "temperature_monitoring",
    "threshold_alerts",
    "network_per_process",
    "startup_analysis",
    "export_csv_json",
    // Power User features
    "history_90d", // 90-day historical data
    "compound_alerts", // Advanced compound alerts
    "process_alerts", // Process-specific alerts
    "widget_dashboard", // Customizable widget dashboard
    "pdf_reports", // Weekly/monthly PDF reports
    "latency_monitoring", // Latency monitoring
    "recommendations", // Performance recommendations
    "priority_support", // Priority support
  ],

  // Trial: Pro features for 7 days | 1 device
  trial: [
    "realtime_monitoring",
    "process_list",
    "history_24h",
    "minimize_to_tray",
    "themes",
    "history_30d",
    "temperature_monitoring",
    "threshold_alerts",
    "network_per_process",
    "startup_analysis",
    "export_csv_json",
  ],
};

/**
 * Feature descriptions for documentation and UI
 */
export const NXRTHMON_FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Basic features
  realtime_monitoring: "Real-time CPU, RAM, Disk, and Network monitoring",
  process_list: "Process list with sorting and filtering",
  history_24h: "24-hour historical graphs",
  minimize_to_tray: "Minimize to system tray functionality",
  themes: "Light and dark theme support",

  // Pro features
  history_30d: "30-day historical data retention",
  temperature_monitoring: "CPU and GPU temperature monitoring",
  threshold_alerts: "Configurable threshold alerts (CPU, RAM, Temperature)",
  network_per_process: "Per-process network bandwidth tracking",
  startup_analysis: "Startup impact analysis",
  export_csv_json: "Export monitoring data to CSV and JSON",

  // Power User features
  history_90d: "90-day historical data retention",
  compound_alerts: "Advanced compound alert conditions",
  process_alerts: "Process-specific alerts",
  widget_dashboard: "Customizable widget dashboard",
  pdf_reports: "Weekly and monthly PDF reports",
  latency_monitoring: "Network latency monitoring",
  recommendations: "Performance recommendations engine",
  priority_support: "Priority customer support",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate random characters from the license charset
 */
function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += LICENSE_CHARSET[bytes[i] % LICENSE_CHARSET.length];
  }
  return result;
}

/**
 * Encode bytes to custom Base32 charset
 */
function encodeToBase32(bytes: Buffer): string {
  let result = "";
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsInBuffer += 8;

    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      const idx = (buffer >> bitsInBuffer) & 0x1f;
      result += LICENSE_CHARSET[idx];
    }
  }

  if (bitsInBuffer > 0) {
    const idx = (buffer << (5 - bitsInBuffer)) & 0x1f;
    result += LICENSE_CHARSET[idx];
  }

  return result;
}

/**
 * Get tier code from tier name
 */
function getTierCode(tier: string): string {
  const normalizedTier = tier.toLowerCase().replace(/[-\s]/g, "_") as NxrthMonTier;
  return TIER_CODES[normalizedTier] || "B";
}

/**
 * Get tier name from tier code
 */
function getTierFromCode(code: string): NxrthMonTier {
  const codeUpper = code.toUpperCase();
  for (const [tier, tierCode] of Object.entries(TIER_CODES)) {
    if (tierCode === codeUpper) {
      return tier as NxrthMonTier;
    }
  }
  return "basic";
}

/**
 * Create HMAC-SHA256 signature
 */
function createSignature(message: string): Buffer {
  return crypto.createHmac("sha256", SIGNING_SECRET).update(message).digest();
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * NxrthMon License Provider
 *
 * License Key Format: NXRM-TXXX-XXXX-XXXX-XXXX-XXXX-XXXX (7 segments)
 *
 * Structure:
 * - Segment 0: Prefix "NXRM"
 * - Segment 1: Tier code (T/B/P/U) + 3 random chars
 * - Segment 2: 4 random chars (unique identifier)
 * - Segments 3-6: HMAC-SHA256 signature (10 bytes = 16 chars in Base32)
 *
 * Tier Codes:
 * - T = Trial (7-day free trial)
 * - B = Basic (1 device)
 * - P = Pro (3 devices)
 * - U = Power User (unlimited devices)
 */
export const NxrthMonProvider: LicenseProvider = {
  id: "nxrthmon",
  name: "NxrthMon",
  prefix: KEY_PREFIX,
  tiers: [...TIERS],

  async generate(
    options: LicenseGenerationOptions
  ): Promise<LicenseGenerationResult> {
    const tier = (options.tier?.toLowerCase().replace(/[-\s]/g, "_") ||
      "basic") as NxrthMonTier;

    // Segment 1: tier indicator + 3 random chars
    const tierCode = getTierCode(tier);
    const seg1 = tierCode + randomChars(3);

    // Segment 2: 4 random chars (unique identifier)
    const seg2 = randomChars(4);

    // Create the message to sign
    const message = `${KEY_PREFIX}-${seg1}-${seg2}`;

    // Create signature: HMAC-SHA256(message)[0:10]
    const sigBytes = createSignature(message).subarray(0, 10);

    // Encode signature to Base32 (10 bytes = 16 chars)
    const sigEncoded = encodeToBase32(sigBytes);

    // Split signature into 4-char segments
    const sig1 = sigEncoded.slice(0, 4);
    const sig2 = sigEncoded.slice(4, 8);
    const sig3 = sigEncoded.slice(8, 12);
    const sig4 = sigEncoded.slice(12, 16);

    const key = `${KEY_PREFIX}-${seg1}-${seg2}-${sig1}-${sig2}-${sig3}-${sig4}`;

    // Calculate expiration for trial licenses
    let expiresAt: Date | null = options.expiresAt ?? null;
    if (tier === "trial" && !expiresAt) {
      expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    }

    return {
      key,
      tier,
      format: "nxrthmon-v1",
      expiresAt,
      metadata: {
        userId: options.userId,
        productId: options.productId || "prod_nxrthmon",
        maxDevices: NXRTHMON_MAX_DEVICES[tier],
        generatedAt: new Date().toISOString(),
        ...options.metadata,
      },
    };
  },

  validate(licenseKey: string): LicenseValidationResult {
    // Normalize
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

    // Check segment count (7 segments for signed keys)
    if (parts.length !== 7) {
      return {
        valid: false,
        tier: null,
        error: "Invalid format: expected 7 segments",
      };
    }

    // Check segment lengths and charset
    for (let i = 1; i < 7; i++) {
      if (parts[i].length !== 4) {
        return {
          valid: false,
          tier: null,
          error: `Segment ${i + 1} has wrong length`,
        };
      }
      for (const char of parts[i]) {
        if (!LICENSE_CHARSET.includes(char)) {
          return {
            valid: false,
            tier: null,
            error: `Invalid character: ${char}`,
          };
        }
      }
    }

    // Recreate and verify signature
    const message = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const expectedSigBytes = createSignature(message).subarray(0, 10);
    const expectedSig = encodeToBase32(expectedSigBytes);

    const actualSig = parts[3] + parts[4] + parts[5] + parts[6];
    if (actualSig !== expectedSig) {
      return {
        valid: false,
        tier: null,
        error: "Invalid signature",
      };
    }

    // Extract tier from first character of segment 1
    const tierCode = parts[1][0];
    const tier = getTierFromCode(tierCode);

    return {
      valid: true,
      tier,
      metadata: {
        tierCode,
        maxDevices: NXRTHMON_MAX_DEVICES[tier],
        format: "nxrthmon-v1",
      },
    };
  },

  getFeaturesForTier(tier: string): string[] {
    const normalizedTier = tier.toLowerCase().replace(/[-\s]/g, "_") as NxrthMonTier;
    return TIER_FEATURES[normalizedTier] || TIER_FEATURES.basic;
  },

  maskKey(licenseKey: string): string {
    const parts = licenseKey.split("-");
    if (parts.length < 2) {
      return `${KEY_PREFIX}-XXXX-XXXX-XXXX`;
    }
    // Show prefix and first char of segment 1 (tier indicator)
    return `${parts[0]}-${parts[1][0]}XXX-XXXX-XXXX`;
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const NXRTHMON_TIERS = TIERS;
export const NXRTHMON_FEATURES = TIER_FEATURES;
export const NXRTHMON_TRIAL_DAYS = TRIAL_DAYS;
