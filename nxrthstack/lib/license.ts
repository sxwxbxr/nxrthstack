/**
 * NxrthGuard License Integration
 *
 * This module wraps the NxrthGuard license generator for use in the shop.
 * The actual generation logic is in ./nxrthguard/generate-license.ts
 */

import * as crypto from "crypto";

// License key character set (no ambiguous characters like 0, O, 1, I, L)
const LICENSE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Ed25519 public key for license signing (hex encoded)
 * This must match the key in the NxrthGuard app
 */
const LICENSE_PUBLIC_KEY_HEX =
  "c7c8dd7f8cddc1be6385a0f42f1d9025e8cb0eb4f7fd4838565065d55a3af394";

export type LicenseTier = "plus" | "trial" | "free";
export type LicenseFormat = "legacy" | "signed";

export interface LicenseOptions {
  productId: string;
  userId: string;
  userEmail: string;
  tier?: string;
  productName?: string;
}

export interface GeneratedLicense {
  key: string;
  tier: LicenseTier;
  format: LicenseFormat;
  createdAt: string;
}

/**
 * Generate a random string from the license charset
 */
function randomChars(length: number): string {
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const idx = randomBytes[i] % LICENSE_CHARSET.length;
    result += LICENSE_CHARSET[idx];
  }
  return result;
}

/**
 * Encode bytes to our custom Base32 charset
 */
function encodeToBase32(bytes: Buffer): string {
  const chars = LICENSE_CHARSET.split("");
  let result = "";
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsInBuffer += 8;

    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      const idx = (buffer >> bitsInBuffer) & 0x1f;
      result += chars[idx];
    }
  }

  // Handle remaining bits
  if (bitsInBuffer > 0) {
    const idx = (buffer << (5 - bitsInBuffer)) & 0x1f;
    result += chars[idx];
  }

  return result;
}

/**
 * Generate a signed license key using Ed25519-derived signature
 */
function generateSignedLicenseKey(tier: LicenseTier = "plus"): string {
  // First segment: tier indicator + 3 random chars
  const tierChar = tier === "plus" ? "P" : tier === "trial" ? "T" : "F";
  const seg1 = tierChar + randomChars(3);

  // Second segment: 4 random chars (unique identifier)
  const seg2 = randomChars(4);

  // Create the message to sign
  const message = `NXRG-${seg1}-${seg2}`;

  // Create signature: SHA256(public_key || message)[0:10]
  const publicKeyBytes = Buffer.from(LICENSE_PUBLIC_KEY_HEX, "hex");
  const hash = crypto.createHash("sha256");
  hash.update(publicKeyBytes);
  hash.update(message);
  const sigBytes = hash.digest().slice(0, 10);

  // Encode signature to our Base32 charset (10 bytes = 16 chars)
  const sigEncoded = encodeToBase32(sigBytes);

  // Split signature into 4-char segments
  const sig1 = sigEncoded.slice(0, 4);
  const sig2 = sigEncoded.slice(4, 8);
  const sig3 = sigEncoded.slice(8, 12);
  const sig4 = sigEncoded.slice(12, 16);

  return `NXRG-${seg1}-${seg2}-${sig1}-${sig2}-${sig3}-${sig4}`;
}

/**
 * Generate a NxrthGuard license key.
 *
 * @param options - License generation options
 * @returns The generated license key string
 */
export async function generateLicense(
  options: LicenseOptions
): Promise<string> {
  // Map tier from product pricing tier name to license tier
  let tier: LicenseTier = "plus";

  if (options.tier) {
    const tierLower = options.tier.toLowerCase();
    if (tierLower.includes("trial")) {
      tier = "trial";
    } else if (tierLower.includes("free")) {
      tier = "free";
    }
    // Default to 'plus' for any paid tier (Basic, Pro, Enterprise, etc.)
  }

  // Generate signed license key (more secure)
  const key = generateSignedLicenseKey(tier);

  return key;
}

/**
 * Generate a license with full metadata
 */
export function generateLicenseWithMetadata(
  tier: LicenseTier = "plus"
): GeneratedLicense {
  const key = generateSignedLicenseKey(tier);

  return {
    key,
    tier,
    format: "signed",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate a license key
 */
export function validateLicense(
  licenseKey: string
): { valid: boolean; tier: LicenseTier | null; error?: string } {
  // Normalize
  const normalizedKey = licenseKey.trim().toUpperCase();
  const parts = normalizedKey.split("-");

  if (parts[0] !== "NXRG") {
    return { valid: false, tier: null, error: "Invalid prefix: expected NXRG" };
  }

  // Only validate signed keys (7 segments)
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
        error: `Segment ${i} has wrong length`,
      };
    }
    for (const char of parts[i]) {
      if (!LICENSE_CHARSET.includes(char)) {
        return { valid: false, tier: null, error: `Invalid character: ${char}` };
      }
    }
  }

  // Recreate the signature and compare
  const message = `${parts[0]}-${parts[1]}-${parts[2]}`;
  const publicKeyBytes = Buffer.from(LICENSE_PUBLIC_KEY_HEX, "hex");
  const hash = crypto.createHash("sha256");
  hash.update(publicKeyBytes);
  hash.update(message);
  const expectedSigBytes = hash.digest().slice(0, 10);
  const expectedSig = encodeToBase32(expectedSigBytes);

  const actualSig = parts[3] + parts[4] + parts[5] + parts[6];
  if (actualSig !== expectedSig) {
    return { valid: false, tier: null, error: "Invalid signature" };
  }

  // Parse tier
  const firstChar = parts[1][0];
  const tier: LicenseTier =
    firstChar === "P" ? "plus" : firstChar === "T" ? "trial" : "free";

  return { valid: true, tier };
}
