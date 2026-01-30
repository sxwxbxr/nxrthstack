# NxrthStack Unified License API

This document describes the Custom License API for integrating multiple license providers into the NxrthStack platform. The API is designed to be provider-agnostic, allowing you to use different license generators (including non-NxrthGuard systems) while maintaining a unified interface.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Provider System](#provider-system)
3. [Unified API Endpoints](#unified-api-endpoints)
4. [Implementing a Custom Provider](#implementing-a-custom-provider)
5. [Configuration](#configuration)
6. [Database Schema](#database-schema)
7. [Integration Examples](#integration-examples)
8. [Error Handling](#error-handling)
9. [Migration Guide](#migration-guide)

---

## Architecture Overview

The Unified License API uses a **Provider Pattern** to abstract license generation and validation logic. This allows multiple applications to use the same API infrastructure while implementing their own license formats.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Unified License API                          │
│                    /api/v1/license/*                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  NxrthGuard  │    │   NxrthMon   │    │  CustomApp   │         │
│   │   Provider   │    │   Provider   │    │   Provider   │   ...   │
│   │   (NXRG-)    │    │   (NXRM-)    │    │   (XXXX-)    │         │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│          │                   │                   │                  │
│          └───────────────────┴───────────────────┘                  │
│                              │                                      │
│                    ┌─────────▼─────────┐                            │
│                    │  LicenseProvider  │                            │
│                    │    Interface      │                            │
│                    └─────────┬─────────┘                            │
│                              │                                      │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                      │
│                    ┌───────────────────┐                            │
│                    │  Database Layer   │                            │
│                    │  (Unified Schema) │                            │
│                    └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

- **Provider**: A module that implements license generation and validation for a specific format
- **Product Binding**: Each product is bound to a specific provider via configuration
- **Unified Response**: All providers return the same response format regardless of internal implementation

---

## Provider System

### Provider Interface

Every license provider must implement the `LicenseProvider` interface:

```typescript
// lib/license-providers/types.ts

export interface LicenseValidationResult {
  valid: boolean;
  tier: string | null;
  error?: string;
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
   * Unique identifier for this provider
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Key prefix for this provider (e.g., "NXRG", "MYAPP")
   */
  prefix: string;

  /**
   * Generate a new license key
   */
  generate(options: {
    tier: string;
    userId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LicenseGenerationResult>;

  /**
   * Validate a license key
   */
  validate(licenseKey: string): LicenseValidationResult;

  /**
   * Get features for a given tier
   */
  getFeaturesForTier(tier: string): string[];

  /**
   * Mask a license key for display
   */
  maskKey(licenseKey: string): string;

  /**
   * Available tiers for this provider
   */
  tiers: string[];
}
```

### Built-in Providers

#### NxrthGuard Provider

The default provider for NxrthGuard applications.

```typescript
// lib/license-providers/nxrthguard.ts

import { LicenseProvider, LicenseValidationResult, LicenseGenerationResult } from './types';
import { validateLicense, generateLicenseWithMetadata } from '../license';
import { getFeaturesForTier, maskLicenseKey } from '../nxrthguard/features';

export const NxrthGuardProvider: LicenseProvider = {
  id: 'nxrthguard',
  name: 'NxrthGuard',
  prefix: 'NXRG',
  tiers: ['free', 'trial', 'plus'],

  async generate(options) {
    const tier = options.tier as 'free' | 'trial' | 'plus';
    const result = generateLicenseWithMetadata(tier);

    return {
      key: result.key,
      tier: result.tier,
      format: result.format,
      expiresAt: tier === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
    };
  },

  validate(licenseKey: string): LicenseValidationResult {
    return validateLicense(licenseKey);
  },

  getFeaturesForTier(tier: string): string[] {
    return getFeaturesForTier(tier);
  },

  maskKey(licenseKey: string): string {
    return maskLicenseKey(licenseKey);
  },
};
```

#### NxrthMon Provider

Provider for NxrthMon system monitoring application.

```typescript
// lib/license-providers/nxrthmon-provider.ts

import { LicenseProvider } from './types';

export const NxrthMonProvider: LicenseProvider = {
  id: 'nxrthmon',
  name: 'NxrthMon',
  prefix: 'NXRM',
  tiers: ['trial', 'basic', 'pro', 'power_user'],

  // Uses HMAC-SHA256 signature validation
  // Key format: NXRM-TXXX-XXXX-XXXX-XXXX-XXXX-XXXX (7 segments)
  // Tier codes: T=Trial, B=Basic, P=Pro, U=Power User
};
```

**NxrthMon Subscription Tiers:**

| Tier | Monthly | Annual | Max Devices |
|------|---------|--------|-------------|
| **Basic** | 3 CHF | 25 CHF | 1 |
| **Pro** | 5 CHF | 45 CHF | 3 |
| **Power User** | 8 CHF | 70 CHF | Unlimited |
| **Trial** | Free | 7 days | 1 |

**Features by Tier:**

| Feature | Basic | Pro | Power User |
|---------|:-----:|:---:|:----------:|
| Real-time CPU, RAM, Disk, Network | Yes | Yes | Yes |
| Process list with sorting/filtering | Yes | Yes | Yes |
| 24-hour historical graphs | Yes | Yes | Yes |
| Minimize to tray | Yes | Yes | Yes |
| Light and dark themes | Yes | Yes | Yes |
| 30-day historical data | - | Yes | Yes |
| CPU/GPU temperature monitoring | - | Yes | Yes |
| Threshold alerts (CPU, RAM, Temp) | - | Yes | Yes |
| Per-process network bandwidth | - | Yes | Yes |
| Startup impact analysis | - | Yes | Yes |
| Export to CSV/JSON | - | Yes | Yes |
| 90-day historical data | - | - | Yes |
| Advanced compound alerts | - | - | Yes |
| Process-specific alerts | - | - | Yes |
| Customizable widget dashboard | - | - | Yes |
| Weekly/monthly PDF reports | - | - | Yes |
| Latency monitoring | - | - | Yes |
| Performance recommendations | - | - | Yes |
| Priority support | - | - | Yes |

**Feature Codes:**

| Feature Code | Description |
|--------------|-------------|
| `realtime_monitoring` | Real-time CPU, RAM, Disk, and Network monitoring |
| `process_list` | Process list with sorting and filtering |
| `history_24h` | 24-hour historical graphs |
| `minimize_to_tray` | Minimize to system tray functionality |
| `themes` | Light and dark theme support |
| `history_30d` | 30-day historical data retention |
| `temperature_monitoring` | CPU and GPU temperature monitoring |
| `threshold_alerts` | Configurable threshold alerts |
| `network_per_process` | Per-process network bandwidth tracking |
| `startup_analysis` | Startup impact analysis |
| `export_csv_json` | Export to CSV and JSON |
| `history_90d` | 90-day historical data retention |
| `compound_alerts` | Advanced compound alert conditions |
| `process_alerts` | Process-specific alerts |
| `widget_dashboard` | Customizable widget dashboard |
| `pdf_reports` | Weekly and monthly PDF reports |
| `latency_monitoring` | Network latency monitoring |
| `recommendations` | Performance recommendations engine |
| `priority_support` | Priority customer support |

---

## Unified API Endpoints

### Base URL

```
Production: https://api.nxrthstack.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication

All endpoints (except login) require a Bearer token:

```
Authorization: Bearer <access_token>
```

### Common Headers

```
Content-Type: application/json
X-Provider-ID: <provider_id>  // Optional: specify provider explicitly
X-Product-ID: <product_id>    // Optional: determine provider from product
```

---

### Endpoint Reference

#### POST /v1/auth/login

Authenticate user and return session tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "device_name": "My Device",
  "product_id": "prod_abc123"  // Optional: to get product-specific license
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "license": {
    "provider": "nxrthguard",
    "tier": "plus",
    "key_masked": "NXRG-PXXX-XXXX-XXXX",
    "features": ["feature1", "feature2"],
    "expires_at": null,
    "is_trial": false,
    "trial_days_remaining": null,
    "max_devices": 5,
    "device_count": 2
  }
}
```

---

#### GET /v1/license/status

Get current license status for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `product_id` | string | Filter by product (optional) |
| `provider` | string | Filter by provider (optional) |

**Response (200):**
```json
{
  "valid": true,
  "provider": "nxrthguard",
  "license": {
    "tier": "plus",
    "key_masked": "NXRG-PXXX-XXXX-XXXX",
    "features": [
      "advanced_generator",
      "sync",
      "sharing"
    ],
    "expires_at": null,
    "is_trial": false,
    "trial_days_remaining": null,
    "max_devices": 5,
    "device_count": 2
  }
}
```

---

#### POST /v1/license/validate

Validate a license key without activation (stateless validation).

**Request:**
```json
{
  "license_key": "NXRG-P234-ABCD-XYZ2-1234-5678-90AB",
  "provider": "nxrthguard"  // Optional: auto-detected from key prefix
}
```

**Response (200):**
```json
{
  "valid": true,
  "provider": "nxrthguard",
  "tier": "plus",
  "features": ["advanced_generator", "sync", "sharing"],
  "metadata": {}
}
```

**Response (400) - Invalid key:**
```json
{
  "valid": false,
  "error": "invalid_signature",
  "message": "The license key signature is invalid"
}
```

---

#### POST /v1/license/activate

Activate a license key on the user's account.

**Request:**
```json
{
  "license_key": "NXRG-P234-ABCD-XYZ2-1234-5678-90AB",
  "device_name": "Windows PC",
  "device_fingerprint": "abc123def456",
  "product_id": "prod_nxrthguard"  // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "provider": "nxrthguard",
  "license": {
    "tier": "plus",
    "key_masked": "NXRG-PXXX-XXXX-XXXX",
    "features": ["advanced_generator", "sync", "sharing"],
    "expires_at": null,
    "is_trial": false,
    "trial_days_remaining": null,
    "max_devices": 5,
    "device_count": 1
  }
}
```

---

#### POST /v1/license/deactivate

Deactivate a device from the license.

**Request:**
```json
{
  "device_fingerprint": "abc123def456"  // Optional: defaults to current device
}
```

**Response (200):**
```json
{
  "success": true,
  "device_count": 1
}
```

---

#### POST /v1/license/trial/start

Start a trial period.

**Request:**
```json
{
  "product_id": "prod_nxrthguard",
  "device_name": "My Device",
  "device_fingerprint": "abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "license": {
    "provider": "nxrthguard",
    "tier": "trial",
    "key_masked": "NXRG-TXXX-XXXX-XXXX",
    "features": ["advanced_generator", "sync", "sharing"],
    "expires_at": "2024-02-07T12:00:00Z",
    "is_trial": true,
    "trial_days_remaining": 7,
    "max_devices": 5,
    "device_count": 1
  }
}
```

---

#### POST /v1/license/generate (Admin/Internal)

Generate a new license key (requires admin privileges or internal API key).

**Request:**
```json
{
  "provider": "nxrthguard",
  "tier": "plus",
  "user_id": "user_123",
  "product_id": "prod_nxrthguard",
  "expires_at": null,
  "metadata": {
    "order_id": "order_456",
    "source": "manual"
  }
}
```

**Response (200):**
```json
{
  "license_key": "NXRG-P234-ABCD-XYZ2-1234-5678-90AB",
  "provider": "nxrthguard",
  "tier": "plus",
  "format": "signed",
  "expires_at": null,
  "created_at": "2024-01-25T12:00:00Z"
}
```

---

## Implementing a Custom Provider

### Step 1: Create the Provider Module

```typescript
// lib/license-providers/myapp.ts

import * as crypto from 'crypto';
import { LicenseProvider, LicenseValidationResult, LicenseGenerationResult } from './types';

// Your custom charset and constants
const MYAPP_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MYAPP_SECRET = process.env.MYAPP_LICENSE_SECRET!;

export const MyAppProvider: LicenseProvider = {
  id: 'myapp',
  name: 'My Application',
  prefix: 'MYAP',
  tiers: ['basic', 'pro', 'enterprise'],

  async generate(options): Promise<LicenseGenerationResult> {
    const { tier, userId, productId } = options;

    // Your custom generation logic
    const tierCode = tier === 'enterprise' ? 'E' : tier === 'pro' ? 'P' : 'B';
    const randomPart = generateRandomString(8, MYAPP_CHARSET);
    const timestamp = Date.now().toString(36).toUpperCase();

    // Create signature
    const payload = `MYAP-${tierCode}${randomPart}-${timestamp}`;
    const signature = crypto
      .createHmac('sha256', MYAPP_SECRET)
      .update(payload)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();

    const key = `${payload}-${signature}`;

    // Calculate expiry based on tier
    let expiresAt: Date | null = null;
    if (tier === 'basic') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    return {
      key,
      tier,
      format: 'myapp-v1',
      expiresAt,
      metadata: { userId, productId },
    };
  },

  validate(licenseKey: string): LicenseValidationResult {
    const normalized = licenseKey.trim().toUpperCase();
    const parts = normalized.split('-');

    // Validate prefix
    if (parts[0] !== 'MYAP') {
      return { valid: false, tier: null, error: 'Invalid prefix' };
    }

    // Validate structure (4 parts: PREFIX-TIERRANDOM-TIMESTAMP-SIGNATURE)
    if (parts.length !== 4) {
      return { valid: false, tier: null, error: 'Invalid format' };
    }

    // Recreate and verify signature
    const payload = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const expectedSig = crypto
      .createHmac('sha256', MYAPP_SECRET)
      .update(payload)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();

    if (parts[3] !== expectedSig) {
      return { valid: false, tier: null, error: 'Invalid signature' };
    }

    // Extract tier
    const tierCode = parts[1][0];
    const tier = tierCode === 'E' ? 'enterprise' : tierCode === 'P' ? 'pro' : 'basic';

    return { valid: true, tier };
  },

  getFeaturesForTier(tier: string): string[] {
    switch (tier) {
      case 'enterprise':
        return ['feature_a', 'feature_b', 'feature_c', 'priority_support', 'sso', 'audit_logs'];
      case 'pro':
        return ['feature_a', 'feature_b', 'feature_c'];
      case 'basic':
        return ['feature_a'];
      default:
        return [];
    }
  },

  maskKey(licenseKey: string): string {
    const parts = licenseKey.split('-');
    if (parts.length < 2) return 'MYAP-XXXX-XXXX-XXXX';
    return `${parts[0]}-${parts[1][0]}XXX-XXXX-XXXX`;
  },
};

function generateRandomString(length: number, charset: string): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}
```

### Step 2: Register the Provider

```typescript
// lib/license-providers/index.ts

import { LicenseProvider } from './types';
import { NxrthGuardProvider } from './nxrthguard';
import { MyAppProvider } from './myapp';

// Provider registry
const providers: Map<string, LicenseProvider> = new Map();

// Register built-in providers
providers.set('nxrthguard', NxrthGuardProvider);
providers.set('myapp', MyAppProvider);

/**
 * Get a provider by ID
 */
export function getProvider(id: string): LicenseProvider | undefined {
  return providers.get(id);
}

/**
 * Get a provider by license key prefix
 */
export function getProviderByPrefix(licenseKey: string): LicenseProvider | undefined {
  const prefix = licenseKey.split('-')[0]?.toUpperCase();

  for (const provider of providers.values()) {
    if (provider.prefix === prefix) {
      return provider;
    }
  }

  return undefined;
}

/**
 * Register a custom provider
 */
export function registerProvider(provider: LicenseProvider): void {
  if (providers.has(provider.id)) {
    throw new Error(`Provider with ID '${provider.id}' already exists`);
  }
  providers.set(provider.id, provider);
}

/**
 * List all registered providers
 */
export function listProviders(): LicenseProvider[] {
  return Array.from(providers.values());
}

export { NxrthGuardProvider, MyAppProvider };
export type { LicenseProvider, LicenseValidationResult, LicenseGenerationResult } from './types';
```

### Step 3: Configure Product-Provider Mapping

```typescript
// lib/license-providers/config.ts

export interface ProductLicenseConfig {
  productId: string;
  providerId: string;
  defaultTier: string;
  trialDays?: number;
  maxDevices?: number;
  features?: Record<string, string[]>;  // Override features per tier
}

export const productConfigs: ProductLicenseConfig[] = [
  {
    productId: 'prod_nxrthguard',
    providerId: 'nxrthguard',
    defaultTier: 'plus',
    trialDays: 7,
    maxDevices: 5,
  },
  {
    productId: 'prod_myapp_basic',
    providerId: 'myapp',
    defaultTier: 'basic',
    trialDays: 14,
    maxDevices: 1,
  },
  {
    productId: 'prod_myapp_pro',
    providerId: 'myapp',
    defaultTier: 'pro',
    trialDays: 14,
    maxDevices: 3,
  },
  {
    productId: 'prod_myapp_enterprise',
    providerId: 'myapp',
    defaultTier: 'enterprise',
    trialDays: 30,
    maxDevices: 999,
  },
];

export function getConfigForProduct(productId: string): ProductLicenseConfig | undefined {
  return productConfigs.find(c => c.productId === productId);
}

export function getProviderForProduct(productId: string): string {
  const config = getConfigForProduct(productId);
  return config?.providerId || 'nxrthguard';  // Default fallback
}
```

---

## Configuration

### Environment Variables

```env
# General
LICENSE_API_BASE_URL=https://api.nxrthstack.com/v1

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRY=3600        # 1 hour in seconds
JWT_REFRESH_TOKEN_EXPIRY=2592000    # 30 days in seconds

# NxrthGuard Provider (Ed25519 public key for signature verification)
NXRTHGUARD_PUBLIC_KEY=c7c8dd7f8cddc1be6385a0f42f1d9025e8cb0eb4f7fd4838565065d55a3af394

# NxrthMon Provider (HMAC-SHA256 signing secret)
NXRTHMON_LICENSE_SECRET=your-nxrthmon-secret-key-here

# Custom Provider (example)
MYAPP_LICENSE_SECRET=your-myapp-secret-key-here

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Registered Products

The following products are pre-configured:

**NxrthGuard Products:**

| Product ID | Provider | Default Tier | Trial Days | Max Devices |
|------------|----------|--------------|------------|-------------|
| `prod_nxrthguard` | nxrthguard | plus | 7 | 5 |
| `prod_nxrthguard_plus` | nxrthguard | plus | 7 | 5 |

**NxrthMon Products:**

| Product ID | Provider | Default Tier | Trial Days | Max Devices | Price |
|------------|----------|--------------|------------|-------------|-------|
| `prod_nxrthmon` | nxrthmon | basic | 7 | 1 | - |
| `prod_nxrthmon_basic` | nxrthmon | basic | 7 | 1 | 3 CHF/mo |
| `prod_nxrthmon_basic_annual` | nxrthmon | basic | 7 | 1 | 25 CHF/yr |
| `prod_nxrthmon_pro` | nxrthmon | pro | 7 | 3 | 5 CHF/mo |
| `prod_nxrthmon_pro_annual` | nxrthmon | pro | 7 | 3 | 45 CHF/yr |
| `prod_nxrthmon_power_user` | nxrthmon | power_user | 7 | 999 | 8 CHF/mo |
| `prod_nxrthmon_power_user_annual` | nxrthmon | power_user | 7 | 999 | 70 CHF/yr |

### Client Configuration

For client applications to use a custom API server:

**Windows:** `%APPDATA%\<AppName>\api_config.json`
**macOS:** `~/Library/Application Support/<AppName>/api_config.json`
**Linux:** `~/.config/<AppName>/api_config.json`

```json
{
  "base_url": "https://api.yourdomain.com/v1",
  "provider": "myapp"
}
```

---

## Database Schema

The unified schema supports multiple providers:

```sql
-- Extended licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'nxrthguard',
    product_id VARCHAR(100),
    license_key VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    max_devices INT DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_started_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- Index for provider-based queries
CREATE INDEX idx_licenses_provider ON licenses(provider);
CREATE INDEX idx_licenses_product ON licenses(product_id);

-- Device activations (unchanged, works with all providers)
CREATE TABLE device_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_fingerprint VARCHAR(255) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',

    CONSTRAINT unique_license_device UNIQUE (license_id, device_fingerprint)
);
```

### Drizzle Schema

```typescript
// lib/db/schema.ts (additions)

export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull().default('nxrthguard'),
  productId: varchar('product_id', { length: 100 }),
  licenseKey: varchar('license_key', { length: 255 }).unique().notNull(),
  tier: varchar('tier', { length: 50 }).notNull(),
  features: jsonb('features').notNull().default([]),
  maxDevices: integer('max_devices').default(5),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isTrial: boolean('is_trial').default(false),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique().on(table.userId, table.productId),
  providerIdx: index('idx_licenses_provider').on(table.provider),
  productIdx: index('idx_licenses_product').on(table.productId),
}));
```

---

## Integration Examples

### Example 1: Stripe Webhook Handler (Multi-Provider)

```typescript
// app/api/stripe/webhook/route.ts

import { getProvider, getProviderForProduct } from '@/lib/license-providers';
import { getConfigForProduct } from '@/lib/license-providers/config';

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const productId = session.metadata?.product_id;
  const userId = session.metadata?.user_id;

  if (!productId || !userId) return;

  // Get provider for this product
  const providerId = getProviderForProduct(productId);
  const provider = getProvider(providerId);
  const config = getConfigForProduct(productId);

  if (!provider || !config) {
    console.error(`No provider/config found for product: ${productId}`);
    return;
  }

  // Generate license using the appropriate provider
  const result = await provider.generate({
    tier: config.defaultTier,
    userId,
    productId,
    metadata: {
      stripeSessionId: session.id,
      stripeCustomerId: session.customer,
    },
  });

  // Store in database
  await db.insert(licenses).values({
    userId,
    provider: providerId,
    productId,
    licenseKey: result.key,
    tier: result.tier,
    features: provider.getFeaturesForTier(result.tier),
    maxDevices: config.maxDevices || 5,
    expiresAt: result.expiresAt,
    metadata: result.metadata || {},
  });
}
```

### Example 2: License Status Endpoint (Multi-Provider)

```typescript
// app/api/v1/license/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nxrthguard/auth-middleware';
import { getProvider } from '@/lib/license-providers';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Invalid or missing token' },
      { status: 401 }
    );
  }

  // Get product_id from query params or header
  const productId = req.nextUrl.searchParams.get('product_id')
    || req.headers.get('X-Product-ID');

  // Find license(s) for user
  const query = db.select().from(licenses).where(eq(licenses.userId, user.id));

  if (productId) {
    query.where(eq(licenses.productId, productId));
  }

  const userLicenses = await query;

  if (!userLicenses.length) {
    return NextResponse.json({ valid: false, license: null });
  }

  // Get the first matching license (or most relevant)
  const license = userLicenses[0];

  // Check expiration
  if (license.expiresAt && new Date() > license.expiresAt) {
    return NextResponse.json({ valid: false, license: null });
  }

  // Get provider to format response
  const provider = getProvider(license.provider);

  // Count devices
  const deviceCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(deviceActivations)
    .where(eq(deviceActivations.licenseId, license.id));

  return NextResponse.json({
    valid: true,
    provider: license.provider,
    license: {
      tier: license.tier,
      key_masked: provider?.maskKey(license.licenseKey) || license.licenseKey.slice(0, 8) + 'XXX',
      features: license.features,
      expires_at: license.expiresAt?.toISOString() || null,
      is_trial: license.isTrial,
      trial_days_remaining: calculateTrialDays(license),
      max_devices: license.maxDevices,
      device_count: deviceCount[0]?.count || 0,
    },
  });
}
```

### Example 3: Client-Side Auto-Detection

```typescript
// Client-side example (TypeScript)

class LicenseClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(config: { baseUrl: string }) {
    this.baseUrl = config.baseUrl;
  }

  async validateKey(licenseKey: string): Promise<ValidationResult> {
    // Auto-detect provider from prefix
    const response = await fetch(`${this.baseUrl}/license/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
      },
      body: JSON.stringify({ license_key: licenseKey }),
    });

    return response.json();
  }

  async activateLicense(licenseKey: string, deviceInfo: DeviceInfo): Promise<ActivationResult> {
    const response = await fetch(`${this.baseUrl}/license/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        license_key: licenseKey,
        device_name: deviceInfo.name,
        device_fingerprint: deviceInfo.fingerprint,
      }),
    });

    return response.json();
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "error_code",
  "message": "Human-readable description",
  "details": {}  // Optional additional context
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid authentication |
| `invalid_token` | 401 | Access token expired or invalid |
| `invalid_refresh_token` | 401 | Refresh token expired or invalid |
| `forbidden` | 403 | Insufficient permissions |
| `invalid_license_key` | 400 | License key format invalid |
| `invalid_signature` | 400 | License key signature verification failed |
| `unknown_provider` | 400 | Provider ID not recognized |
| `provider_mismatch` | 400 | License key prefix doesn't match provider |
| `license_already_used` | 400 | Key already activated by another user |
| `license_exists` | 409 | User already has a license for this product |
| `trial_already_used` | 409 | User already used their trial |
| `max_devices_reached` | 400 | Cannot activate on more devices |
| `license_expired` | 400 | License has expired |
| `product_not_found` | 404 | Product ID not recognized |
| `rate_limited` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |

---

## Migration Guide

### Migrating from NxrthGuard-Only to Unified API

If you're adding support for a new application while keeping NxrthGuard working:

1. **No schema changes required** - The `provider` column defaults to `'nxrthguard'`

2. **Add your new provider** - Create the provider module and register it

3. **Configure products** - Map your new products to the new provider

4. **Update client apps** - New apps use the unified API with provider headers

5. **Existing apps continue working** - NxrthGuard apps don't need any changes

### Database Migration (if upgrading from old schema)

```sql
-- Add provider column if not exists
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NOT NULL DEFAULT 'nxrthguard';

-- Add product_id column if not exists
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS product_id VARCHAR(100);

-- Add metadata column if not exists
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_licenses_provider ON licenses(provider);
CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product_id);
```

---

## Security Considerations

1. **Provider Secrets**: Each provider should have its own signing secret stored securely
2. **Key Validation**: Always validate keys server-side, never trust client validation alone
3. **Rate Limiting**: Implement rate limiting on all license endpoints
4. **Audit Logging**: Log all license operations for security auditing
5. **Key Rotation**: Plan for secret key rotation without invalidating existing licenses

---

## Summary

The Unified License API provides:

- **Provider Abstraction**: Plug in any license generator
- **Backward Compatibility**: NxrthGuard continues to work unchanged
- **Flexible Configuration**: Map products to providers easily
- **Unified Response Format**: Clients get consistent responses regardless of provider
- **Scalable Architecture**: Add new applications without modifying existing code

For questions or support, contact the NxrthStack team.
