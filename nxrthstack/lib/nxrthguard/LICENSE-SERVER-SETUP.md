# NxrthGuard License Server Setup Guide

This guide explains how to set up automatic license key generation on your website server after a successful purchase.

## Overview

The license system uses cryptographic signing:
- **Public key**: Embedded in the NxrthGuard app (already configured)
- **Signing logic**: Runs on your server to generate valid license keys

License format: `NXRG-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX` (7 segments, 31 characters)

---

## Step 1: Copy the License Generator to Your Server

Copy the file `scripts/server/license-generator.ts` to your website project.

### Option A: Using TypeScript (Node.js)

```bash
# In your website project
npm install typescript tsx
# Copy the file
cp /path/to/nxrthguard/scripts/server/license-generator.ts ./src/lib/
```

### Option B: Using JavaScript (compiled)

```bash
# Compile to JavaScript
npx tsc scripts/server/license-generator.ts --outDir dist
# Copy dist/license-generator.js to your server
```

---

## Step 2: Integrate with Your Payment System

### Example: Stripe Webhook Handler

```typescript
// src/api/webhooks/stripe.ts
import { generateLicense } from '../lib/license-generator';
import { sendEmail } from '../lib/email';
import { db } from '../lib/database';

export async function handleStripeWebhook(event: any) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Get customer email
    const customerEmail = session.customer_email;

    // Determine license tier from the product
    const tier = session.metadata?.tier || 'plus';

    // Generate the license key
    const license = generateLicense(tier);

    // Save to database
    await db.licenses.create({
      key: license.key,
      tier: license.tier,
      customerEmail,
      stripeSessionId: session.id,
      createdAt: license.createdAt,
    });

    // Send license key to customer
    await sendEmail({
      to: customerEmail,
      subject: 'Your NxrthGuard Plus License Key',
      body: `
Thank you for your purchase!

Your license key:
${license.key}

To activate:
1. Open NxrthGuard
2. Go to Settings
3. Click "Activate License"
4. Paste your license key

Your license is valid for one machine. To transfer to a different
machine, deactivate first in Settings.

Questions? Contact support@yourwebsite.com
      `,
    });

    return { success: true, licenseKey: license.key };
  }
}
```

### Example: Generic REST API Endpoint

```typescript
// src/api/generate-license.ts
import { generateLicense } from '../lib/license-generator';

export async function POST(request: Request) {
  // Verify the request is authorized (API key, session, etc.)
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const tier = body.tier || 'plus';

  // Generate license
  const license = generateLicense(tier);

  return Response.json({
    success: true,
    license: {
      key: license.key,
      tier: license.tier,
      createdAt: license.createdAt,
    },
  });
}
```

---

## Step 3: Database Schema (Recommended)

Store generated licenses for tracking and support:

```sql
-- PostgreSQL example
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  key VARCHAR(31) UNIQUE NOT NULL,
  tier VARCHAR(10) NOT NULL DEFAULT 'plus',
  customer_email VARCHAR(255) NOT NULL,
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  machine_id VARCHAR(64),
  revoked BOOLEAN DEFAULT FALSE,
  revoked_reason TEXT
);

CREATE INDEX idx_licenses_email ON licenses(customer_email);
CREATE INDEX idx_licenses_key ON licenses(key);
```

---

## Step 4: Email Template

Example HTML email template:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .license-key {
      font-family: monospace;
      font-size: 18px;
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <h1>Thank You for Your Purchase!</h1>

  <p>Your NxrthGuard Plus license key:</p>

  <div class="license-key">
    {{LICENSE_KEY}}
  </div>

  <h2>How to Activate</h2>
  <ol>
    <li>Open NxrthGuard</li>
    <li>Go to <strong>Settings</strong></li>
    <li>Click <strong>Activate License</strong></li>
    <li>Paste your license key</li>
  </ol>

  <p><em>Your license works on one machine at a time. To transfer,
  deactivate in Settings first.</em></p>

  <p>Need help? Contact <a href="mailto:support@yoursite.com">support@yoursite.com</a></p>
</body>
</html>
```

---

## Step 5: Testing

### Generate a Test License

```typescript
import { generateLicense } from './license-generator';

// Generate a Plus license
const plusLicense = generateLicense('plus');
console.log('Plus License:', plusLicense.key);

// Generate a Trial license (7-day)
const trialLicense = generateLicense('trial');
console.log('Trial License:', trialLicense.key);
```

### Verify in NxrthGuard

1. Build NxrthGuard with the updated public key
2. Go to Settings > Activate License
3. Paste the generated license key
4. Should show "Plus" or "Trial" status

---

## Security Checklist

- [ ] Store the license generator file in a private location (not public web folder)
- [ ] Use environment variables for any API keys
- [ ] Implement rate limiting on license generation endpoints
- [ ] Log all license generations for audit purposes
- [ ] Validate webhook signatures (Stripe, PayPal, etc.)
- [ ] Use HTTPS for all API endpoints
- [ ] Store licenses in a database for support queries

---

## License Tiers

| Tier | Code | Duration | Features |
|------|------|----------|----------|
| Plus | `P` | Unlimited | All Plus features |
| Trial | `T` | 7 days | All Plus features (expires) |

Trial licenses can only be activated once per machine.

---

## Troubleshooting

### "Invalid license key" error

1. Check the key format: `NXRG-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`
2. Ensure the public key in the app matches your generator
3. Verify no typos in the key (copy-paste recommended)

### License not activating

1. Check if it's a trial and the user already used their trial
2. Verify the app build includes the correct public key
3. Check the license tier character (P for Plus, T for Trial)

---

## API Reference

### `generateLicense(tier)`

Generates a single license key.

**Parameters:**
- `tier`: `'plus'` | `'trial'` (default: `'plus'`)

**Returns:**
```typescript
{
  key: string;      // The license key
  tier: string;     // 'plus' or 'trial'
  createdAt: string; // ISO timestamp
}
```

### `generateBatch(count, tier)`

Generates multiple license keys at once.

**Parameters:**
- `count`: number of licenses to generate
- `tier`: `'plus'` | `'trial'` (default: `'plus'`)

**Returns:** Array of license objects

---

## Support

If you have questions about the license system:
- Check the NxrthGuard documentation
- Review the source code in `scripts/server/license-generator.ts`
