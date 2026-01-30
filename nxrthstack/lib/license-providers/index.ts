/**
 * License Provider Registry
 *
 * Central registry for all license providers.
 * Allows registering custom providers and looking up providers by ID or key prefix.
 */

import {
  LicenseProvider,
  ProductLicenseConfig,
  LicenseValidationResult,
  LicenseGenerationOptions,
  LicenseGenerationResult,
  UnifiedLicenseResponse,
} from "./types";
import { NxrthGuardProvider } from "./nxrthguard-provider";
import { NxrthMonProvider } from "./nxrthmon-provider";

// Provider registry (singleton)
const providers: Map<string, LicenseProvider> = new Map();

// Product configuration registry
const productConfigs: Map<string, ProductLicenseConfig> = new Map();

// Register built-in providers
providers.set("nxrthguard", NxrthGuardProvider);
providers.set("nxrthmon", NxrthMonProvider);

// Register default product configurations
const defaultProductConfigs: ProductLicenseConfig[] = [
  // NxrthGuard products
  {
    productId: "prod_nxrthguard",
    providerId: "nxrthguard",
    defaultTier: "plus",
    trialDays: 7,
    maxDevices: 5,
  },
  {
    productId: "prod_nxrthguard_plus",
    providerId: "nxrthguard",
    defaultTier: "plus",
    trialDays: 7,
    maxDevices: 5,
  },
  // NxrthMon products
  // Trial: 7-day free trial with Pro features, 1 device
  {
    productId: "prod_nxrthmon",
    providerId: "nxrthmon",
    defaultTier: "basic",
    trialDays: 7,
    maxDevices: 1,
  },
  // Basic: 3 CHF/month | 25 CHF/year | 1 device
  {
    productId: "prod_nxrthmon_basic",
    providerId: "nxrthmon",
    defaultTier: "basic",
    trialDays: 7,
    maxDevices: 1,
  },
  {
    productId: "prod_nxrthmon_basic_annual",
    providerId: "nxrthmon",
    defaultTier: "basic",
    trialDays: 7,
    maxDevices: 1,
  },
  // Pro: 5 CHF/month | 45 CHF/year | 3 devices
  {
    productId: "prod_nxrthmon_pro",
    providerId: "nxrthmon",
    defaultTier: "pro",
    trialDays: 7,
    maxDevices: 3,
  },
  {
    productId: "prod_nxrthmon_pro_annual",
    providerId: "nxrthmon",
    defaultTier: "pro",
    trialDays: 7,
    maxDevices: 3,
  },
  // Power User: 8 CHF/month | 70 CHF/year | Unlimited devices
  {
    productId: "prod_nxrthmon_power_user",
    providerId: "nxrthmon",
    defaultTier: "power_user",
    trialDays: 7,
    maxDevices: 999,
  },
  {
    productId: "prod_nxrthmon_power_user_annual",
    providerId: "nxrthmon",
    defaultTier: "power_user",
    trialDays: 7,
    maxDevices: 999,
  },
];

// Register default product configs
for (const config of defaultProductConfigs) {
  productConfigs.set(config.productId, config);
}

/**
 * Get a provider by its ID
 */
export function getProvider(id: string): LicenseProvider | undefined {
  return providers.get(id.toLowerCase());
}

/**
 * Get a provider by analyzing the license key prefix
 */
export function getProviderByPrefix(
  licenseKey: string
): LicenseProvider | undefined {
  const prefix = licenseKey.split("-")[0]?.toUpperCase();

  for (const provider of providers.values()) {
    if (provider.prefix === prefix) {
      return provider;
    }
  }

  return undefined;
}

/**
 * Register a custom license provider
 */
export function registerProvider(provider: LicenseProvider): void {
  const id = provider.id.toLowerCase();

  if (providers.has(id)) {
    throw new Error(`Provider with ID '${id}' already exists`);
  }

  // Validate provider implementation
  if (!provider.prefix || provider.prefix.length < 2) {
    throw new Error("Provider must have a prefix of at least 2 characters");
  }

  if (!provider.tiers || provider.tiers.length === 0) {
    throw new Error("Provider must define at least one tier");
  }

  providers.set(id, provider);
}

/**
 * Unregister a provider (mainly for testing)
 */
export function unregisterProvider(id: string): boolean {
  return providers.delete(id.toLowerCase());
}

/**
 * List all registered providers
 */
export function listProviders(): LicenseProvider[] {
  return Array.from(providers.values());
}

/**
 * Get all provider IDs
 */
export function getProviderIds(): string[] {
  return Array.from(providers.keys());
}

/**
 * Register a product configuration
 */
export function registerProductConfig(config: ProductLicenseConfig): void {
  productConfigs.set(config.productId, config);
}

/**
 * Get configuration for a product
 */
export function getConfigForProduct(
  productId: string
): ProductLicenseConfig | undefined {
  return productConfigs.get(productId);
}

/**
 * Get the provider ID for a product (with fallback to nxrthguard)
 */
export function getProviderForProduct(productId: string): string {
  const config = getConfigForProduct(productId);
  return config?.providerId || "nxrthguard";
}

/**
 * Validate a license key, auto-detecting the provider
 */
export function validateLicenseKey(
  licenseKey: string,
  providerId?: string
): LicenseValidationResult & { provider?: string } {
  let provider: LicenseProvider | undefined;

  if (providerId) {
    provider = getProvider(providerId);
  } else {
    provider = getProviderByPrefix(licenseKey);
  }

  if (!provider) {
    return {
      valid: false,
      tier: null,
      error: providerId
        ? `Unknown provider: ${providerId}`
        : "Could not detect provider from license key prefix",
    };
  }

  const result = provider.validate(licenseKey);
  return {
    ...result,
    provider: provider.id,
  };
}

/**
 * Generate a license key using the specified provider
 */
export async function generateLicenseKey(
  providerId: string,
  options: LicenseGenerationOptions
): Promise<LicenseGenerationResult & { provider: string }> {
  const provider = getProvider(providerId);

  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  if (!provider.tiers.includes(options.tier.toLowerCase())) {
    throw new Error(
      `Invalid tier '${options.tier}' for provider '${providerId}'. Valid tiers: ${provider.tiers.join(", ")}`
    );
  }

  const result = await provider.generate(options);
  return {
    ...result,
    provider: provider.id,
  };
}

/**
 * Get features for a tier from a specific provider
 */
export function getFeaturesForTier(
  providerId: string,
  tier: string
): string[] {
  const provider = getProvider(providerId);
  if (!provider) {
    return [];
  }
  return provider.getFeaturesForTier(tier);
}

/**
 * Mask a license key for display
 */
export function maskLicenseKey(
  licenseKey: string,
  providerId?: string
): string {
  let provider: LicenseProvider | undefined;

  if (providerId) {
    provider = getProvider(providerId);
  } else {
    provider = getProviderByPrefix(licenseKey);
  }

  if (!provider) {
    // Fallback: generic masking
    const parts = licenseKey.split("-");
    if (parts.length > 1) {
      return `${parts[0]}-XXXX-XXXX-XXXX`;
    }
    return "XXXX-XXXX-XXXX-XXXX";
  }

  return provider.maskKey(licenseKey);
}

// Re-export types
export type {
  LicenseProvider,
  LicenseValidationResult,
  LicenseGenerationOptions,
  LicenseGenerationResult,
  ProductLicenseConfig,
  UnifiedLicenseResponse,
} from "./types";

// Export built-in providers for direct access if needed
export { NxrthGuardProvider };
export { NxrthMonProvider };
