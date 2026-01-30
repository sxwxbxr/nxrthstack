/**
 * NxrthGuard License Provider
 *
 * Built-in provider for NxrthGuard applications.
 * Uses cryptographic signature-based license validation.
 */

import {
  LicenseProvider,
  LicenseValidationResult,
  LicenseGenerationOptions,
  LicenseGenerationResult,
} from "./types";
import {
  validateLicense,
  generateLicenseWithMetadata,
  LicenseTier,
} from "../license";
import { getFeaturesForTier, maskLicenseKey } from "../nxrthguard/features";

const TRIAL_DAYS = 7;

export const NxrthGuardProvider: LicenseProvider = {
  id: "nxrthguard",
  name: "NxrthGuard",
  prefix: "NXRG",
  tiers: ["free", "trial", "plus"],

  async generate(
    options: LicenseGenerationOptions
  ): Promise<LicenseGenerationResult> {
    // Map tier string to LicenseTier type
    const tierMap: Record<string, LicenseTier> = {
      free: "free",
      trial: "trial",
      plus: "plus",
    };

    const tier = tierMap[options.tier.toLowerCase()] || "plus";
    const result = generateLicenseWithMetadata(tier);

    // Calculate expiration for trial licenses
    let expiresAt: Date | null = options.expiresAt ?? null;
    if (tier === "trial" && !expiresAt) {
      expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    }

    return {
      key: result.key,
      tier: result.tier,
      format: result.format,
      expiresAt,
      metadata: {
        userId: options.userId,
        productId: options.productId,
        ...options.metadata,
      },
    };
  },

  validate(licenseKey: string): LicenseValidationResult {
    const result = validateLicense(licenseKey);
    return {
      valid: result.valid,
      tier: result.tier,
      error: result.error,
    };
  },

  getFeaturesForTier(tier: string): string[] {
    return getFeaturesForTier(tier);
  },

  maskKey(licenseKey: string): string {
    return maskLicenseKey(licenseKey);
  },
};
