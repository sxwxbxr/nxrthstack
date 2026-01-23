// NxrthGuard feature flags
export const PLUS_FEATURES = [
  "advanced_generator",
  "sync",
  "sharing",
  "emergency_access",
  "vault_history",
  "password_policies",
  "hardware_entropy",
];

export const FREE_FEATURES: string[] = [];

export const TRIAL_FEATURES = PLUS_FEATURES; // Same as plus, but time-limited

export function getFeaturesForTier(tier: string): string[] {
  switch (tier.toLowerCase()) {
    case "plus":
      return PLUS_FEATURES;
    case "trial":
      return TRIAL_FEATURES;
    case "free":
    default:
      return FREE_FEATURES;
  }
}

export function maskLicenseKey(key: string): string {
  const parts = key.split("-");
  if (parts.length < 3) return "NXRG-XXXX-XXXX-XXXX";
  return `${parts[0]}-${parts[1][0]}XXX-XXXX-XXXX`;
}

export interface LicenseResponse {
  tier: string;
  key_masked: string;
  features: string[];
  expires_at: string | null;
  is_trial: boolean;
  trial_days_remaining: number | null;
  max_devices: number;
  device_count: number;
}

export function formatLicenseResponse(
  license: {
    tier: string;
    licenseKey: string;
    features: unknown;
    expiresAt: Date | null;
    isTrial: boolean;
    trialStartedAt: Date | null;
    maxDevices: number;
  },
  deviceCount: number
): LicenseResponse {
  const features = Array.isArray(license.features) ? license.features : [];

  let trialDaysRemaining: number | null = null;
  if (license.isTrial && license.expiresAt) {
    const now = new Date();
    const diffMs = license.expiresAt.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    tier: license.tier,
    key_masked: maskLicenseKey(license.licenseKey),
    features: features as string[],
    expires_at: license.expiresAt?.toISOString() || null,
    is_trial: license.isTrial,
    trial_days_remaining: trialDaysRemaining,
    max_devices: license.maxDevices,
    device_count: deviceCount,
  };
}
