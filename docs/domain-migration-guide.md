# Domain Migration: nxrthstack.vercel.app -> nxrthstack.sweber.dev

## Overview

The NxrthStack platform domain was changed from `nxrthstack.vercel.app` to `nxrthstack.sweber.dev`. The old domain (`nxrthstack.vercel.app`) still exists and responds with a **307 Temporary Redirect** to the new domain.

## Code Changes Made

### Next.js Web App (`nxrthstack/`)
| File | Change |
|------|--------|
| `components/gamehub/copy-profile-url.tsx` | SSR fallback URL updated |
| `components/header.tsx` | Added "by sweber.dev" branding next to logo |

### Discord Bot (`nxrthstack-bot/`)
| File | Change |
|------|--------|
| `.env.example` | `NXRTH_API_URL` default |
| `src/commands/help.ts` | Footer text + 2 button URLs |
| `src/commands/link.ts` | `linkUrl` fallback + footer text |
| `src/commands/profile.ts` | Profile URL fallback (2 instances) |
| `src/commands/achievements.ts` | Footer text |
| `src/commands/admin/announce.ts` | Footer text (2 instances) |
| `src/embeds/achievement.ts` | Footer text (2 instances) |
| `src/events/guildMemberAdd.ts` | Welcome DM footer |
| `src/services/notifications.ts` | Achievement + announcement footers |

### NAS Storage Server (`nas-storage-server/`)
| File | Change |
|------|--------|
| `server.js` | Default CORS origins |
| `.env.example` | `ALLOWED_ORIGINS` |
| `README.md` | Config example + env table |
| `RASPBERRY-PI-SETUP.md` | Setup guide env value |
| `install.sh` | Installer script env value |

### Docs (`docs/`)
| File | Change |
|------|--------|
| `architecture-diagram.drawio` | Vercel node label |
| `.$architecture-diagram.drawio.bkp` | Backup diagram |
| `Discord-Integration-Guide.md` | All 8 URL references |
| `discord-bot-setup.md` | Env example + env table |

## Manual Steps Required

### 1. Vercel Dashboard - Custom Domain
- Go to **Vercel Project Settings > Domains**
- Add `nxrthstack.sweber.dev` as a custom domain
- Vercel will provide a CNAME record to add in DNS

### 2. DNS Configuration (sweber.dev registrar / Cloudflare)
- Add a **CNAME** record: `nxrthstack` -> `cname.vercel-dns.com` (Vercel will confirm the exact value)
- Wait for DNS propagation

### 3. Bot Server `.env` (Home PC)
- SSH into your home PC and update the live `.env`:
  ```
  NXRTH_API_URL=https://nxrthstack.sweber.dev
  ```
- Restart the bot: `pm2 restart nxrthstack-bot`

### 4. NAS Storage Server `.env` (Raspberry Pi)
- SSH into your Pi and update `/opt/nas-storage-server/.env`:
  ```
  ALLOWED_ORIGINS=http://localhost:3000,https://nxrthstack.sweber.dev
  ```
- Restart: `sudo systemctl restart nas-storage`

### 5. Vercel Environment Variables
- In Vercel Dashboard > Project Settings > Environment Variables, update:
  - `NEXTAUTH_URL` -> `https://nxrthstack.sweber.dev`
  - Any OAuth callback URLs referencing the old domain

### 6. Discord Developer Portal
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Update **OAuth2 Redirect URIs** to `https://nxrthstack.sweber.dev/api/auth/discord/callback`

### 7. Stripe Dashboard
- Update webhook endpoint URL to `https://nxrthstack.sweber.dev/api/stripe/webhook`

### 8. Neon Auth
- Check Neon dashboard for any auth callback URLs referencing the old domain

### 9. Re-export Architecture Diagram
- Open `docs/architecture-diagram.drawio` in draw.io and export a new PDF (label now shows `nxrthstack.sweber.dev`)
