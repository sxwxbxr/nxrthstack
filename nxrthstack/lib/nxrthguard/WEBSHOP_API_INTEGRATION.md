# NxrthGuard Webshop API Integration Guide

This document describes the API endpoints that the NxrthGuard desktop/mobile apps expect from your webshop backend. Use this as a reference when implementing the license server.

## Overview

NxrthGuard uses account-based licensing where:
- Users create accounts on your webshop
- Licenses are linked to user accounts (not machines)
- Users can use the same license on multiple devices
- The desktop app communicates with your API for authentication and license validation

## Base Configuration

- **Default API Base URL**: `https://api.nxrthguard.com/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer tokens in `Authorization` header

## Database Schema (Suggested)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    license_key VARCHAR(50) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL, -- 'free', 'plus', 'trial'
    features JSONB NOT NULL,
    max_devices INT DEFAULT 5,
    expires_at TIMESTAMP, -- NULL for lifetime licenses
    is_trial BOOLEAN DEFAULT FALSE,
    trial_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Device activations (for tracking multi-device usage)
CREATE TABLE device_activations (
    id UUID PRIMARY KEY,
    license_id UUID REFERENCES licenses(id),
    user_id UUID REFERENCES users(id),
    device_name VARCHAR(255),
    device_fingerprint VARCHAR(255),
    activated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### 1. POST /v1/auth/login

Authenticate user and return session tokens.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "userpassword",
    "device_name": "Windows PC (MyComputer)"  // Optional
}
```

**Success Response (200):**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expires_in": 3600,  // Access token lifetime in seconds
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe"  // Can be null
    },
    "license": {  // Can be null if user has no license
        "tier": "plus",  // "free", "plus", or "trial"
        "key_masked": "NXRG-PXXX-XXXX-XXXX",
        "features": [
            "advanced_generator",
            "sync",
            "sharing",
            "emergency_access",
            "vault_history",
            "password_policies",
            "hardware_entropy"
        ],
        "expires_at": "2025-12-31T23:59:59Z",  // null for lifetime
        "is_trial": false,
        "trial_days_remaining": null,  // Only set if is_trial=true
        "max_devices": 5,
        "device_count": 2
    }
}
```

**Error Response (401):**
```json
{
    "error": "invalid_credentials",
    "message": "Invalid email or password"
}
```

**Error Response (429):**
```json
{
    "error": "rate_limited",
    "message": "Too many login attempts. Please try again later."
}
```

---

### 2. POST /v1/auth/logout

Invalidate the current session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:** Empty body or `{}`

**Success Response (200):**
```json
{
    "success": true
}
```

---

### 3. POST /v1/auth/refresh

Refresh an expired access token.

**Request:**
```json
{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Success Response (200):**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
}
```

**Error Response (401):**
```json
{
    "error": "invalid_refresh_token",
    "message": "Refresh token is invalid or expired"
}
```

---

### 4. GET /v1/license/status

Get current license status for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
    "valid": true,
    "license": {
        "tier": "plus",
        "key_masked": "NXRG-PXXX-XXXX-XXXX",
        "features": [
            "advanced_generator",
            "sync",
            "sharing",
            "emergency_access",
            "vault_history",
            "password_policies",
            "hardware_entropy"
        ],
        "expires_at": "2025-12-31T23:59:59Z",
        "is_trial": false,
        "trial_days_remaining": null,
        "max_devices": 5,
        "device_count": 2
    }
}
```

**Response when user has no license (200):**
```json
{
    "valid": false,
    "license": null
}
```

---

### 5. POST /v1/license/activate

Activate a license key on the user's account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "license_key": "NXRG-P234-ABCD-XYZ2"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "license": {
        "tier": "plus",
        "key_masked": "NXRG-PXXX-XXXX-XXXX",
        "features": [
            "advanced_generator",
            "sync",
            "sharing",
            "emergency_access",
            "vault_history",
            "password_policies",
            "hardware_entropy"
        ],
        "expires_at": null,
        "is_trial": false,
        "trial_days_remaining": null,
        "max_devices": 5,
        "device_count": 1
    }
}
```

**Error Response (400) - Invalid key:**
```json
{
    "error": "invalid_license_key",
    "message": "The license key is invalid or has already been used"
}
```

**Error Response (400) - Already has license:**
```json
{
    "error": "license_exists",
    "message": "This account already has an active license"
}
```

---

### 6. POST /v1/license/deactivate

Deactivate/remove the license from the current device.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:** Empty body or `{}`

**Success Response (200):**
```json
{
    "success": true,
    "device_count": 1  // Remaining device count
}
```

---

### 7. POST /v1/license/trial/start

Start a 7-day trial for the user's account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:** Empty body or `{}`

**Success Response (200):**
```json
{
    "license": {
        "tier": "trial",
        "key_masked": "NXRG-TXXX-XXXX-XXXX",
        "features": [
            "advanced_generator",
            "sync",
            "sharing",
            "emergency_access",
            "vault_history",
            "password_policies",
            "hardware_entropy"
        ],
        "expires_at": "2024-02-01T12:00:00Z",
        "is_trial": true,
        "trial_days_remaining": 7,
        "max_devices": 5,
        "device_count": 1
    }
}
```

**Error Response (409) - Trial already used:**
```json
{
    "error": "trial_already_used",
    "message": "You have already used your free trial"
}
```

---

## Feature Flags

The `features` array in license responses should contain strings matching these values:

| Feature String | Description |
|---------------|-------------|
| `advanced_generator` | Advanced password generator (pronounceable, passphrase, patterns) |
| `sync` | Cross-device vault synchronization |
| `sharing` | Secure password sharing |
| `emergency_access` | Emergency access for trusted contacts |
| `vault_history` | Vault version history and rollback |
| `password_policies` | Custom password policies |
| `hardware_entropy` | Hardware random number generation |

**Tier-to-Features mapping:**
- `free`: Empty array `[]`
- `plus`: All features
- `trial`: All features (same as plus, but time-limited)

---

## License Key Format

NxrthGuard uses two license key formats:

### Legacy Format (4 segments)
```
NXRG-XXXX-XXXX-XXXX
```
- First char of segment 2 indicates tier: `P` = Plus, `T` = Trial, `F` = Free
- Last segment is a checksum

### Signed Format (7 segments)
```
NXRG-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
```
- Cryptographically signed with Ed25519
- More secure, recommended for production

**Character set:** `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous chars like 0/O, 1/I/L)

---

## Authentication Flow

```
┌─────────────┐     1. Login (email/password)      ┌─────────────┐
│  NxrthGuard │ ──────────────────────────────────▶│   Webshop   │
│   Desktop   │                                    │     API     │
│     App     │◀────────────────────────────────── │             │
└─────────────┘  2. Return tokens + license info   └─────────────┘
       │
       │ 3. Store session locally
       ▼
┌─────────────┐
│   Session   │  access_token, refresh_token,
│   Storage   │  account info, cached license
└─────────────┘
       │
       │ 4. Periodic validation (every 6 hours)
       ▼
┌─────────────┐     GET /license/status            ┌─────────────┐
│  NxrthGuard │ ──────────────────────────────────▶│   Webshop   │
│   Desktop   │                                    │     API     │
│     App     │◀────────────────────────────────── │             │
└─────────────┘     Return current license         └─────────────┘
```

---

## Offline Grace Period

The desktop app caches license data and allows offline usage for **72 hours** after the last successful server validation. After this period, the user must go online to re-validate.

---

## Security Recommendations

1. **Password Hashing**: Use Argon2id or bcrypt for password storage
2. **Token Security**:
   - Access tokens: Short-lived (1 hour), JWT format
   - Refresh tokens: Longer-lived (30 days), stored securely, rotated on use
3. **Rate Limiting**: Implement rate limiting on login endpoint
4. **Device Tracking**: Track device activations to enforce `max_devices` limit
5. **License Key Security**: Store only hashed license keys, generate server-side

---

## Error Response Format

All error responses should follow this format:

```json
{
    "error": "error_code",
    "message": "Human-readable error message"
}
```

Common error codes:
- `invalid_credentials` - Wrong email/password
- `invalid_token` - Access token invalid or expired
- `invalid_refresh_token` - Refresh token invalid or expired
- `invalid_license_key` - License key format invalid or not found
- `license_already_used` - License key already activated by another user
- `license_exists` - User already has a license
- `trial_already_used` - User already used their trial
- `max_devices_reached` - Cannot activate on more devices
- `rate_limited` - Too many requests

---

## Testing

You can configure the NxrthGuard app to use a custom API URL by creating this file:

**Windows:** `%APPDATA%\NxrthGuard\api_config.json`
**macOS:** `~/Library/Application Support/NxrthGuard/api_config.json`
**Linux:** `~/.config/NxrthGuard/api_config.json`

```json
{
    "base_url": "http://localhost:3000/v1"
}
```

---

## Example Implementation (Node.js/Express)

```javascript
// POST /v1/auth/login
app.post('/v1/auth/login', async (req, res) => {
    const { email, password, device_name } = req.body;

    // Find user
    const user = await db.users.findByEmail(email);
    if (!user || !await verifyPassword(password, user.password_hash)) {
        return res.status(401).json({
            error: 'invalid_credentials',
            message: 'Invalid email or password'
        });
    }

    // Generate tokens
    const accessToken = generateJWT(user.id, '1h');
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await db.refreshTokens.create({
        user_id: user.id,
        token_hash: hash(refreshToken),
        device_name,
        expires_at: addDays(new Date(), 30)
    });

    // Get license
    const license = await db.licenses.findByUserId(user.id);

    res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        license: license ? formatLicense(license) : null
    });
});

// GET /v1/license/status
app.get('/v1/license/status', authenticate, async (req, res) => {
    const license = await db.licenses.findByUserId(req.user.id);

    if (!license) {
        return res.json({ valid: false, license: null });
    }

    // Check expiration
    if (license.expires_at && new Date() > license.expires_at) {
        return res.json({ valid: false, license: null });
    }

    res.json({
        valid: true,
        license: formatLicense(license)
    });
});

function formatLicense(license) {
    const deviceCount = await db.deviceActivations.countByLicenseId(license.id);

    return {
        tier: license.tier,
        key_masked: maskLicenseKey(license.license_key),
        features: license.features,
        expires_at: license.expires_at?.toISOString() || null,
        is_trial: license.is_trial,
        trial_days_remaining: license.is_trial
            ? Math.max(0, daysBetween(new Date(), license.expires_at))
            : null,
        max_devices: license.max_devices,
        device_count: deviceCount
    };
}

function maskLicenseKey(key) {
    const parts = key.split('-');
    return `${parts[0]}-${parts[1][0]}XXX-XXXX-XXXX`;
}
```
