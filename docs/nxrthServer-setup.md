# NxrthServer Complete Setup Guide — Windows 11

**Last Updated:** 2026-02-13

---

## Quick Start

```powershell
# 1. Clone the repo on the business PC
git clone https://github.com/sxwxbxr/nxrthstack.git C:\Temp\nxrthstack

# 2. Run setup as Administrator
PowerShell -ExecutionPolicy Bypass -File C:\Temp\nxrthstack\server-setup\setup.ps1

# 3. Follow the prompts, then delete the repo
Remove-Item -Recurse -Force C:\Temp\nxrthstack
```

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Service Locations & Ports](#3-service-locations--ports)
4. [Setup Script Walkthrough](#4-setup-script-walkthrough)
5. [PM2 — Managing Node.js Services](#5-pm2--managing-nodejs-services)
6. [Minecraft Server](#6-minecraft-server)
7. [Cloudflare Tunnel](#7-cloudflare-tunnel)
8. [Tailscale VPN](#8-tailscale-vpn)
9. [Discord Bot](#9-discord-bot)
10. [NAS Storage Server](#10-nas-storage-server)
11. [Minecraft Agent (Dashboard Backend)](#11-minecraft-agent-dashboard-backend)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [Windows Firewall Rules](#13-windows-firewall-rules)
14. [Updating Services](#14-updating-services)
15. [Sync: Website ↔ Discord Bot ↔ Discord](#15-sync-website--discord-bot--discord)
16. [Backup & Recovery](#16-backup--recovery)
17. [Troubleshooting](#17-troubleshooting)
18. [Quick Reference Card](#18-quick-reference-card)

---

## 1. Architecture Overview

```
+-------------------------------------------------------------+
|              Business PC (Windows 11 Pro)                    |
|                                                              |
|  +----------------+  +----------------+  +----------------+ |
|  | Discord Bot    |  | Minecraft      |  | NAS Storage    | |
|  | :3001 (API)    |  | Server :25565  |  | Server :3002   | |
|  | PM2 managed    |  | Scheduled Task |  | PM2 managed    | |
|  +-------+--------+  +-------+--------+  +--------+-------+ |
|          |                    |                     |         |
|  +-------+--------------------+---------------------+------+ |
|  |       Minecraft Agent :3003 (PM2 managed)               | |
|  +-------+-------------------------------------------------+ |
|          |                                                    |
|  +-------+-------------------------------------------------+ |
|  |  cloudflared (Windows Service — Cloudflare Tunnel)       | |
|  |  bot.sweber.dev        -> localhost:3001                 | |
|  |  nxrthstore.sweber.dev -> localhost:3002                 | |
|  |  mc-api.sweber.dev     -> localhost:3003                 | |
|  +---------------------------------------------------------+ |
|                                                               |
|  Tailscale VPN (system tray — for remote access + uploads)   |
+-------------------------------------------------------------+
         |
         v
+---------------------+   +------------------------+
| Neon PostgreSQL     |   | Vercel (Website)       |
| (shared database)   |   | nxrthstack.sweber.dev  |
+---------------------+   +------------------------+
```

### Data Flow

1. **Website → Bot**: When events happen (achievements, sessions, rivalries), the website POSTs to `https://bot.sweber.dev/webhook`
2. **Bot → Discord**: Bot receives webhook, broadcasts embeds to configured Discord channels
3. **Both → Database**: Both read/write the same Neon PostgreSQL database
4. **Website → MC Agent**: Dashboard UI sends commands via `https://mc-api.sweber.dev`
5. **MC Agent → Minecraft**: Agent communicates with MC server via RCON on localhost:25575
6. **Website → NAS**: File uploads go to `https://nxrthstore.sweber.dev` (or Tailscale URL for >100MB)

---

## 2. Prerequisites

All installed automatically by `setup.ps1` via winget:

| Package | winget ID | Purpose |
|---------|-----------|---------|
| Node.js LTS | `OpenJS.NodeJS.LTS` | Runtime for bot, NAS, agent |
| Java 21 (Temurin) | `EclipseAdoptium.Temurin.21.JRE` | Minecraft server runtime |
| cloudflared | `Cloudflare.cloudflared` | Tunnel daemon |
| Tailscale | `Tailscale.Tailscale` | VPN for remote access |

Global npm packages:
| Package | Purpose |
|---------|---------|
| `pm2` | Process manager for Node.js services |
| `pm2-windows-startup` | Auto-start PM2 on Windows boot |
| `tsx` | TypeScript execution without build step |

---

## 3. Service Locations & Ports

| Service | Location | Port | Manager | Public URL |
|---------|----------|------|---------|------------|
| Discord Bot | `C:\NxrthServer\nxrthstack-bot` | 3001 | PM2 | `bot.sweber.dev` |
| NAS Storage | `C:\NxrthServer\nas-storage-server` | 3002 | PM2 | `nxrthstore.sweber.dev` |
| Minecraft Agent | `C:\NxrthServer\minecraft-agent` | 3003 | PM2 | `mc-api.sweber.dev` |
| Minecraft Server | `C:\NxrthServer\minecraft` | 25565 | Scheduled Task | Direct IP or Tailscale |
| Cloudflare Tunnel | Windows Service | — | Windows SCM | — |
| Tailscale | System tray | — | Windows Service | `<hostname>.ts.net` |

Other directories:
| Path | Content |
|------|---------|
| `C:\NxrthServer\logs` | PM2 log files |
| `C:\NxrthServer\storage\clips` | Uploaded video clips and images |
| `C:\NxrthServer\minecraft-backups` | Minecraft world backups |
| `C:\NxrthServer\SECRETS.txt` | Auto-generated secrets reference |
| `C:\NxrthServer\ecosystem.config.cjs` | PM2 process definitions |

---

## 4. Setup Script Walkthrough

The `setup.ps1` script performs 15 steps in sequence:

| Step | What it does |
|------|-------------|
| 1 | Install prerequisites via winget (Node.js, Java 21, cloudflared, Tailscale) |
| 2 | Install global npm packages (pm2, tsx, pm2-windows-startup) |
| 3 | Create `C:\NxrthServer\` directory structure |
| 4 | Copy services from repo to `C:\NxrthServer\` (including shared DB schema) |
| 5 | Prompt for secrets (Discord token, DB URL, CurseForge key, tunnel token) |
| 6 | Generate random secrets (NAS API key, MC agent secret, RCON password) |
| 7 | Write `.env` files for each service (UTF-8 without BOM) |
| 8 | Run `npm install` for each service |
| 9 | Build TypeScript (Minecraft Agent only; bot uses tsx at runtime) |
| 10 | Deploy Discord slash commands |
| 11 | Create PM2 ecosystem config and start all services |
| 12 | Set up PM2 auto-start on boot (pm2-windows-startup + Scheduled Task fallback) |
| 13 | Install cloudflared as Windows service with tunnel token |
| 14 | Optional: Set up Minecraft Paper server (download, config, Scheduled Task) |
| 15 | Configure Windows Firewall rules |

### Secrets Collected During Setup

| Secret | Source | Used By |
|--------|--------|---------|
| Discord Bot Token | Discord Developer Portal | Bot |
| Discord Client ID | Discord Developer Portal | Bot |
| Discord Client Secret | Discord Developer Portal | Bot + Website |
| Discord Guild ID | Discord Server Settings | Bot |
| Database URL | Neon Dashboard | Bot |
| CurseForge API Key | console.curseforge.com | MC Agent |
| Cloudflare Tunnel Token | Zero Trust Dashboard | cloudflared |

### Secrets Auto-Generated

| Secret | Purpose | Stored In |
|--------|---------|-----------|
| NAS API Key | NAS upload authentication | NAS .env + Vercel |
| MC Agent Secret | Agent ↔ Vercel auth | Agent .env + Vercel |
| RCON Password | Minecraft RCON auth | MC server.properties + Agent .env |

All generated secrets are saved to `C:\NxrthServer\SECRETS.txt`.

---

## 5. PM2 — Managing Node.js Services

PM2 manages the Discord Bot, NAS Storage, and Minecraft Agent.

### Everyday Commands

```powershell
pm2 status                        # Show all processes and their state
pm2 logs                          # Stream live logs from all services
pm2 logs nxrthstack-bot           # Stream logs from bot only
pm2 logs nas-storage              # Stream logs from NAS only
pm2 logs minecraft-agent          # Stream logs from agent only
pm2 monit                         # Interactive dashboard (CPU, memory, logs)
```

### Restart / Stop

```powershell
pm2 restart all                   # Restart all services
pm2 restart nxrthstack-bot        # Restart bot only
pm2 stop nxrthstack-bot           # Stop bot (stays stopped until restart)
pm2 start nxrthstack-bot          # Start a stopped service
```

### After Configuration Changes

```powershell
pm2 restart nxrthstack-bot        # After editing bot .env
pm2 restart nas-storage           # After editing NAS .env
pm2 restart minecraft-agent       # After editing agent .env
```

### Log Locations

| Service | stdout | stderr |
|---------|--------|--------|
| Bot | `C:\NxrthServer\logs\bot-out.log` | `C:\NxrthServer\logs\bot-error.log` |
| NAS | `C:\NxrthServer\logs\nas-out.log` | `C:\NxrthServer\logs\nas-error.log` |
| Agent | `C:\NxrthServer\logs\agent-out.log` | `C:\NxrthServer\logs\agent-error.log` |

### Auto-Start on Boot

PM2 auto-resurrects via:
1. **pm2-windows-startup** (npm package, creates a Windows service)
2. **Scheduled Task "PM2-Resurrect-NxrthServer"** (fallback, runs `pm2 resurrect`)

After adding or removing services, always save:
```powershell
pm2 save
```

---

## 6. Minecraft Server

### Location

`C:\NxrthServer\minecraft\`

### Key Files

| File | Purpose |
|------|---------|
| `paper.jar` | Server JAR (Paper MC) |
| `server.properties` | Server configuration |
| `eula.txt` | EULA acceptance |
| `start-minecraft.bat` | Manual start script (double-click) |
| `world/` | World data |
| `plugins/` | Paper plugins |
| `mods/` | Forge/Fabric mods (if modded) |
| `logs/` | Server logs |

### Start / Stop

```powershell
# Manual start (interactive console)
C:\NxrthServer\minecraft\start-minecraft.bat

# Via Scheduled Task
Start-ScheduledTask -TaskName "NxrthServer-Minecraft"
Stop-ScheduledTask -TaskName "NxrthServer-Minecraft"

# View task status
Get-ScheduledTask -TaskName "NxrthServer-Minecraft"
```

### Auto-Start

Scheduled Task "NxrthServer-Minecraft" starts Java with Paper 30 seconds after boot.

### Change RAM

Edit `C:\NxrthServer\minecraft\start-minecraft.bat`:
- Change `-Xms` (minimum RAM) and `-Xmx` (maximum RAM) values

Also update the Scheduled Task arguments if using auto-start.

### Update Paper MC

1. Stop the server
2. Download new `paper.jar` from https://papermc.io/downloads/paper
3. Replace `C:\NxrthServer\minecraft\paper.jar`
4. Start the server

### RCON (Remote Console)

The Minecraft Agent connects to RCON at `localhost:25575`.
Password is in `C:\NxrthServer\SECRETS.txt` and `server.properties`.

---

## 7. Cloudflare Tunnel

### How It Works

The tunnel connects local services to the internet through Cloudflare's network. No port forwarding needed. It runs as a Windows service using a token from the Zero Trust dashboard.

### Service Name

`cloudflared` or `Cloudflared agent`

### Management

```powershell
Get-Service cloudflared              # Check status
Restart-Service cloudflared          # Restart
Stop-Service cloudflared             # Stop
Start-Service cloudflared            # Start
```

### Configure Routes

Routes are managed in the Cloudflare Zero Trust dashboard (NOT locally):

1. Go to https://one.dash.cloudflare.com
2. Navigate to: **Networks → Tunnels**
3. Click your tunnel (**nxrthserver**)
4. **Public Hostname** tab → Add routes:

| Public Hostname | Service |
|-----------------|---------|
| `bot.sweber.dev` | `http://localhost:3001` |
| `nxrthstore.sweber.dev` | `http://localhost:3002` |
| `mc-api.sweber.dev` | `http://localhost:3003` |

### Reinstall with New Token

```powershell
cloudflared service uninstall
cloudflared service install <new-token>
```

### Troubleshoot

View logs in **Event Viewer**: Windows Logs → Application → Source: cloudflared

---

## 8. Tailscale VPN

### Purpose

- Remote access to the PC from anywhere on your tailnet
- Large file uploads bypassing Cloudflare's ~100MB limit
- Let Minecraft players connect without public port forwarding

### Setup

1. Click the Tailscale icon in the system tray
2. Sign in with your account

### Commands

```powershell
tailscale status          # Show connected devices
tailscale ip              # Show your Tailscale IP
```

### Minecraft via Tailscale

Players install Tailscale, join your tailnet, then connect to:
```
<your-tailscale-hostname>:25565
```

### Direct HTTPS for Large Uploads

For uploads exceeding Cloudflare's ~100MB limit:

```powershell
tailscale cert <hostname>.ts.net
```

Then configure in NAS `.env`:
```
HTTPS_PORT=3443
TLS_CERT_PATH=C:/path/to/cert.crt
TLS_KEY_PATH=C:/path/to/cert.key
```

Add to Vercel:
```
NAS_TAILSCALE_URL=https://<hostname>.ts.net:3443
```

---

## 9. Discord Bot

### Location

`C:\NxrthServer\nxrthstack-bot`

### Runtime

Uses `tsx` as the TypeScript interpreter — no build step needed.

### PM2 Name

`nxrthstack-bot`

### Deploy Slash Commands

After adding new commands:

```powershell
cd C:\NxrthServer\nxrthstack-bot
npx tsx src/deploy-commands.ts
```

### Update Bot Code

1. Clone the repo to a temp folder
2. Copy `nxrthstack-bot/` files to `C:\NxrthServer\nxrthstack-bot\` (exclude `node_modules` and `.env`)
3. `cd C:\NxrthServer\nxrthstack-bot && npm install`
4. `pm2 restart nxrthstack-bot`
5. If new commands: `npx tsx src/deploy-commands.ts`
6. Delete the temp clone

### Bot Features

- `/link` — Connect Discord to NxrthStack account
- `/profile` — View Gaming Passport
- `/leaderboard` — Global rankings
- `/rivalry challenge` — Challenge another user
- `/mc server` — Show Minecraft server status
- `/mc players` — List online MC players
- `/mc whitelist` — Manage MC whitelist

### Cross-Project Schema Dependency

The bot imports the database schema from the web app:
```
C:\NxrthServer\nxrthstack-bot\src\db.ts
  → imports ../../nxrthstack/lib/db/schema.js
  → resolves to C:\NxrthServer\nxrthstack\lib\db\schema.ts
```

If the schema changes, copy the updated `schema.ts` to `C:\NxrthServer\nxrthstack\lib\db\`.

---

## 10. NAS Storage Server

### Location

`C:\NxrthServer\nas-storage-server`

### Storage Directory

`C:\NxrthServer\storage\clips`

### PM2 Name

`nas-storage`

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload a file (multipart) | Yes |
| POST | `/upload/multiple` | Upload up to 10 files | Yes |
| GET | `/files` | List all files | No |
| GET | `/files/:filename` | Download/stream a file | No |
| DELETE | `/files/:filename` | Delete a file | Yes |
| GET | `/stats` | Storage usage statistics | No |
| GET | `/health` | Health check | No |

### Authentication

```
Header: X-API-Key: <NAS_API_KEY>
— or —
Header: Authorization: Bearer <NAS_API_KEY>
```

### Storage Limits

- Max file size: **5 GB** (direct / Tailscale)
- Max file size: **~100 MB** (via Cloudflare Tunnel)
- Allowed types: video (mp4, webm, mov, avi, mkv), image (jpg, png, gif, webp)

---

## 11. Minecraft Agent (Dashboard Backend)

### Location

`C:\NxrthServer\minecraft-agent`

### Runtime

Built TypeScript → `dist/index.js` (must run `npm run build` after code changes)

### PM2 Name

`minecraft-agent`

### Purpose

Backend for the Minecraft Dashboard in GameHub. Proxies commands between the website and the Minecraft server via RCON.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Server status (TPS, RAM, players, uptime) |
| POST | `/start` | Start Minecraft server |
| POST | `/stop` | Graceful stop (save-all → stop) |
| POST | `/restart` | Graceful restart |
| GET | `/console/stream` | SSE stream of live console |
| GET | `/console/history` | Last N lines of console |
| POST | `/console/command` | Execute RCON command |
| GET | `/players` | Online player list |
| GET/POST/DELETE | `/players/whitelist` | Whitelist management |
| GET/POST/DELETE | `/players/ops` | OP management |
| POST | `/players/kick` | Kick player |
| POST/DELETE | `/players/ban` | Ban/unban player |
| GET | `/backups` | List backups |
| POST | `/backups/create` | Create backup |
| POST | `/backups/restore` | Restore backup |
| GET/PUT | `/config/properties` | server.properties management |
| GET/PUT | `/config/java` | JVM arguments |
| GET | `/files` | File browser (sandboxed) |

### Authentication

```
Header: X-MC-Agent-Secret: <MC_AGENT_SECRET>
```

### Rebuild After Code Changes

```powershell
cd C:\NxrthServer\minecraft-agent
npm run build
pm2 restart minecraft-agent
```

---

## 12. Environment Variables Reference

### Discord Bot (`.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `DISCORD_BOT_TOKEN` | From Developer Portal | Bot authentication |
| `DISCORD_CLIENT_ID` | `1468315439309262981` | Application ID |
| `DISCORD_CLIENT_SECRET` | Shared with website | Webhook auth |
| `DISCORD_GUILD_ID` | Your server ID | Dev command sync |
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL |
| `NXRTH_API_URL` | `https://nxrthstack.sweber.dev` | Website URL |
| `API_PORT` | `3001` | Bot webhook API port |
| `MC_AGENT_URL` | `http://localhost:3003` | MC Agent connection |
| `MC_AGENT_SECRET` | Generated | Agent auth secret |

### NAS Storage (`.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `PORT` | `3002` | Server port |
| `NAS_API_KEY` | Generated | Upload authentication |
| `STORAGE_PATH` | `C:/NxrthServer/storage/clips` | File storage location |
| `PUBLIC_URL` | `https://nxrthstore.sweber.dev` | Public file URL base |
| `MAX_FILE_SIZE` | `5368709120` | 5 GB max |
| `ALLOWED_ORIGINS` | `https://nxrthstack.sweber.dev,...` | CORS origins |

### Minecraft Agent (`.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `PORT` | `3003` | Agent API port |
| `MC_SERVER_DIR` | `C:/NxrthServer/minecraft` | Minecraft install path |
| `MC_RCON_HOST` | `127.0.0.1` | RCON host |
| `MC_RCON_PORT` | `25575` | RCON port |
| `MC_RCON_PASSWORD` | Generated | RCON auth |
| `MC_AGENT_SECRET` | Generated | Vercel ↔ Agent auth |
| `ALLOWED_ORIGINS` | `https://nxrthstack.sweber.dev` | CORS |
| `BACKUP_DIR` | `C:/NxrthServer/minecraft-backups` | Backup storage |
| `MAX_BACKUP_SIZE_GB` | `50` | Max backup storage |
| `CURSEFORGE_API_KEY` | From console.curseforge.com | Modpack browsing |

### Vercel (Website)

| Variable | Value | Purpose |
|----------|-------|---------|
| `DISCORD_BOT_API_URL` | `https://bot.sweber.dev` | Bot webhook target |
| `MC_AGENT_URL` | `https://mc-api.sweber.dev` | Agent API URL |
| `MC_AGENT_SECRET` | Same as Agent's | Auth secret |
| `NAS_STORAGE_URL` | `https://nxrthstore.sweber.dev` | Upload URL |
| `NAS_API_KEY` | Same as NAS's | Upload auth |
| `NAS_TAILSCALE_URL` | `https://<hostname>.ts.net:3443` | Large upload URL |

---

## 13. Windows Firewall Rules

Created by setup (Private + Domain profiles only):

| Rule Name | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| NxrthServer-Bot | TCP | 3001 | Discord Bot API |
| NxrthServer-NAS | TCP | 3002 | NAS Storage Server |
| NxrthServer-MCAgent | TCP | 3003 | MC Agent |
| NxrthServer-Minecraft | TCP | 25565 | Minecraft Server |

### Management

```powershell
# View all NxrthServer rules
Get-NetFirewallRule -DisplayName "NxrthServer-*"

# Remove a rule
Remove-NetFirewallRule -DisplayName "NxrthServer-Bot"

# Add a new rule
New-NetFirewallRule -DisplayName "NxrthServer-Custom" -Direction Inbound `
    -Action Allow -Protocol TCP -LocalPort 8080 -Profile Private,Domain
```

**Note:** cloudflared makes outbound connections only — no inbound rules needed for the tunnel.

---

## 14. Updating Services

All services live at `C:\NxrthServer` independently of the git repo.

### Quick Update (Single Service)

1. Clone repo to a temp folder (or pull on dev machine)
2. Copy the changed service folder to `C:\NxrthServer\`
3. Run `npm install` if dependencies changed
4. Run `npm run build` if TypeScript (agent only)
5. `pm2 restart <service-name>`

### Full Update (Re-run Setup)

1. Clone the repo
2. Run `setup.ps1` again (idempotent — skips existing installs)
3. Delete the repo

### Update Bot Schema

If the database schema changed (`nxrthstack/lib/db/schema.ts`):
1. Copy the new `schema.ts` to `C:\NxrthServer\nxrthstack\lib\db\`
2. `pm2 restart nxrthstack-bot`

---

## 15. Sync: Website ↔ Discord Bot ↔ Discord

### How It Works

```
Website (Vercel) ──webhook POST──► Bot API (bot.sweber.dev) ──► Discord Channels
                                         │
                    ◄─── shared Neon PostgreSQL ───►
```

1. **Website → Bot**: When events happen (achievement unlock, session created, rivalry match, announcement), the website POSTs to `DISCORD_BOT_API_URL/webhook`
2. **Bot → Discord**: Bot receives the webhook and broadcasts rich embeds to configured channels
3. **Both → Database**: Both services read/write the same Neon PostgreSQL database
4. **Account Linking**: Users run `/link` in Discord → get URL to website → link their accounts
5. **MC Dashboard**: Website → `mc-api.sweber.dev` → Agent → RCON → Minecraft server

### Webhook Events

| Event | Trigger | Discord Message |
|-------|---------|----------------|
| `achievement.unlocked` | User unlocks achievement | Achievement embed with rarity |
| `session.created` | Gaming session scheduled | Session details + RSVP |
| `rivalry.challenge` | Player challenges another | Challenge notification |
| `rivalry.match` | Match result recorded | Winner/loser embed |
| `announcement.created` | Admin posts announcement | Announcement broadcast |
| `mc.server.start` | Minecraft server starts | "Server is online" |
| `mc.server.stop` | Minecraft server stops | "Server is offline" |
| `mc.modpack.install` | Modpack installed | Modpack name + version |

### Webhook Configuration

Admins configure which Discord channel receives which events via the `webhookConfigs` database table, manageable through the admin panel.

---

## 16. Backup & Recovery

### What to Back Up

| Path | Content | Priority |
|------|---------|----------|
| `C:\NxrthServer\minecraft\world\` | Minecraft world data | Critical |
| `C:\NxrthServer\storage\clips\` | Uploaded clips/files | Critical |
| `C:\NxrthServer\*\.env` | All configuration files | Critical |
| `C:\NxrthServer\SECRETS.txt` | Generated secrets | Critical |
| `C:\NxrthServer\minecraft\plugins\` | Server plugins | Important |
| `C:\NxrthServer\minecraft\server.properties` | Server config | Important |

### What NOT to Back Up

| Path | Reason |
|------|--------|
| `C:\NxrthServer\*\node_modules\` | Reinstall with `npm install` |
| `C:\NxrthServer\*\dist\` | Rebuild with `npm run build` |
| `C:\NxrthServer\logs\` | Ephemeral, regenerated |

### Full System Recovery

1. Fresh Windows install
2. Clone repo, run `setup.ps1`
3. Restore `.env` files from backup
4. Restore `world/` and `clips/` directories
5. `pm2 restart all`

---

## 17. Troubleshooting

| Problem | Fix |
|---------|-----|
| **PM2 services not starting after reboot** | Run `pm2 resurrect` manually. Check Task Scheduler for "PM2-Resurrect-NxrthServer". Re-run `pm2 save`. |
| **Bot can't connect to database** | Check `DATABASE_URL` in `.env`. Test: `nslookup <neon-hostname>`. Verify Neon dashboard shows DB active. |
| **Cloudflare tunnel 502 errors** | Target service not running. Check `pm2 status`. Verify port mapping in Zero Trust dashboard. |
| **Minecraft won't start** | Check `java -version` (need 21+). Check RAM in `start-minecraft.bat`. Read `C:\NxrthServer\minecraft\logs\latest.log`. |
| **Website webhooks not reaching bot** | Verify `DISCORD_BOT_API_URL=https://bot.sweber.dev` in Vercel. Test: `curl https://bot.sweber.dev`. Check `pm2 logs nxrthstack-bot`. |
| **Large uploads failing via Cloudflare** | CF free plan limits ~100MB. Use Tailscale URL. Set `NAS_TAILSCALE_URL` in Vercel. |
| **PM2 service in "errored" restart loop** | Check: `pm2 logs <name> --err --lines 50`. Common: missing `.env`, wrong paths, port already in use. |
| **MC Agent can't connect to RCON** | Verify MC server is running. Check RCON password matches in `server.properties` and Agent `.env`. Verify `enable-rcon=true`. |
| **Node.js not found after winget install** | Close terminal, open a NEW PowerShell window. The PATH needs to refresh. |
| **"Execution policy" error running setup.ps1** | Run: `PowerShell -ExecutionPolicy Bypass -File setup.ps1` |

---

## 18. Quick Reference Card

### Check Everything

```powershell
pm2 status
Get-Service cloudflared
tailscale status
```

### Restart Everything

```powershell
pm2 restart all
Restart-Service cloudflared
Stop-ScheduledTask "NxrthServer-Minecraft"; Start-ScheduledTask "NxrthServer-Minecraft"
```

### View All Logs

```powershell
pm2 logs
```

### Important Paths

```
Secrets:     C:\NxrthServer\SECRETS.txt
Bot env:     C:\NxrthServer\nxrthstack-bot\.env
NAS env:     C:\NxrthServer\nas-storage-server\.env
Agent env:   C:\NxrthServer\minecraft-agent\.env
MC config:   C:\NxrthServer\minecraft\server.properties
PM2 config:  C:\NxrthServer\ecosystem.config.cjs
Logs:        C:\NxrthServer\logs\
```

### Useful Test Commands

```powershell
# Test bot API
curl http://localhost:3001

# Test NAS health
curl http://localhost:3002/health

# Test MC agent
curl http://localhost:3003/status

# Test through tunnel
curl https://bot.sweber.dev
curl https://nxrthstore.sweber.dev/health
curl https://mc-api.sweber.dev/status
```
