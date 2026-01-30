/**
 * License Provider Types
 *
 * Defines the interface that all license providers must implement
 * to work with the unified License API.
 */

export interface LicenseValidationResult {
  valid: boolean;
  tier: string | null;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LicenseGenerationOptions {
  tier: string;
  userId?: string;
  productId?: string;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface LicenseGenerationResult {
  key: string;
  tier: string;
  format: string;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface LicenseProvider {
  /**
   * Unique identifier for this provider (e.g., "nxrthguard", "myapp")
   */
  id: string;

  /**
   * Human-readable name for display
   */
  name: string;

  /**
   * Key prefix used by this provider (e.g., "NXRG", "MYAP")
   * Used for auto-detection of provider from license key
   */
  prefix: string;

  /**
   * Available tiers for this provider
   */
  tiers: string[];

  /**
   * Generate a new license key
   */
  generate(options: LicenseGenerationOptions): Promise<LicenseGenerationResult>;

  /**
   * Validate a license key (pure validation, no database)
   */
  validate(licenseKey: string): LicenseValidationResult;

  /**
   * Get features available for a given tier
   */
  getFeaturesForTier(tier: string): string[];

  /**
   * Mask a license key for safe display (e.g., "NXRG-PXXX-XXXX-XXXX")
   */
  maskKey(licenseKey: string): string;
}

/**
 * Configuration for mapping products to license providers
 */
export interface ProductLicenseConfig {
  productId: string;
  providerId: string;
  defaultTier: string;
  trialDays?: number;
  maxDevices?: number;
  /** Override features per tier (optional) */
  features?: Record<string, string[]>;
}

/**
 * Unified license response format returned by all API endpoints
 */
export interface UnifiedLicenseResponse {
  provider: string;
  tier: string;
  key_masked: string;
  features: string[];
  expires_at: string | null;
  is_trial: boolean;
  trial_days_remaining: number | null;
  max_devices: number;
  device_count: number;
}
