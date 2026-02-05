# NxrthStack Discord Bot - Local Setup Guide

This guide walks you through setting up the Discord bot on your home server PC with Cloudflare Tunnel exposure.

## Server Environment

This bot runs alongside other services on the business PC:
- **Minecraft Server** - Gaming server
- **Paperless-ngx** - Document management for NAS
- **NxrthStack Discord Bot** - This service

The PC runs 24/7, making it ideal for hosting the Discord bot.

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free)
- Discord Developer Portal access

---

## Part 1: Discord Developer Portal Setup

### 1.1 Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it `NxrthStack Bot`
4. Click **Create**

### 1.2 Get Credentials

1. **General Information** tab → Copy **Application ID** (this is `DISCORD_CLIENT_ID`)
2. **Bot** tab → Click **"Reset Token"** → Copy the token (this is `DISCORD_BOT_TOKEN`)

### 1.3 Enable Intents

In the **Bot** tab, enable these privileged intents:
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

### 1.4 Invite Bot to Server

1. Go to **OAuth2** → **URL Generator**
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
4. Copy the generated URL and open it in browser
5. Select your server and authorize

### 1.5 Get Guild ID

1. In Discord: Settings → App Settings → Advanced → Enable **Developer Mode**
2. Right-click your server name → **Copy ID** (this is `DISCORD_GUILD_ID`)

---

## Part 2: Bot Installation

### 2.1 Navigate to Bot Directory

```powershell
cd D:\Projects\nxrthstack\nxrthstack-bot
```

### 2.2 Install Dependencies

```powershell
npm install
```

### 2.3 Create Environment File

Create a `.env` file in the `nxrthstack-bot` folder:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=your_guild_id_here

# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Website URL
NXRTH_API_URL=https://nxrthstack.sweber.dev

# API Port
API_PORT=3001
```

### 2.4 Deploy Slash Commands

Run this once (and whenever you add new commands):

```powershell
npm run deploy-commands
```

### 2.5 Test the Bot

```powershell
npm run dev
```

You should see:
```
[Bot] Starting NxrthStack Bot...
[API] Server listening on port 3001
[Commands] Loaded: help
[Commands] Loaded: link
...
[Bot] Logged in as NxrthStack Bot#1234
```

---

## Part 3: Cloudflare Tunnel Setup

### 3.1 Install Cloudflared

**Option A: Using winget (recommended)**
```powershell
winget install cloudflare.cloudflared
```

**Option B: Manual Download**
1. Go to https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Download the Windows installer
3. Run the installer

### 3.2 Verify Installation

```powershell
cloudflared --version
```

### 3.3 Login to Cloudflare

```powershell
cloudflared tunnel login
```

This opens a browser window - select your Cloudflare account.

### 3.4 Quick Start (Temporary URL)

For testing, use this to get a temporary public URL:

```powershell
cloudflared tunnel --url http://localhost:3001
```

This gives you a URL like `https://random-words.trycloudflare.com`

### 3.5 Permanent Tunnel (Optional)

If you want a permanent subdomain:

```powershell
# Create tunnel
cloudflared tunnel create nxrthstack-bot

# Note the tunnel ID from output
```

Create config file at `C:\Users\YOUR_USERNAME\.cloudflared\config.yml`:

```yaml
tunnel: nxrthstack-bot
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: bot.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

Add DNS record in Cloudflare dashboard:
```powershell
cloudflared tunnel route dns nxrthstack-bot bot.yourdomain.com
```

Run the tunnel:
```powershell
cloudflared tunnel run nxrthstack-bot
```

---

## Part 4: Update Vercel

Once your tunnel is running, update the environment variable in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add or update:

| Variable | Value |
|----------|-------|
| `DISCORD_BOT_API_URL` | `https://your-tunnel-url.trycloudflare.com` |

3. Redeploy your website for changes to take effect

---

## Part 5: Startup Scripts

### Windows Batch Script

Create `start-bot.bat` in `D:\Projects\nxrthstack\`:

```batch
@echo off
echo Starting NxrthStack Bot...
echo.

:: Start the bot in a new window
start "NxrthStack Bot" cmd /k "cd /d D:\Projects\nxrthstack\nxrthstack-bot && npm run dev"

:: Wait for bot to start
timeout /t 3 /nobreak >nul

:: Start Cloudflare tunnel in a new window
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3001"

echo.
echo Bot and tunnel started!
echo Check the Cloudflare Tunnel window for your public URL.
echo Update DISCORD_BOT_API_URL in Vercel if the URL changed.
pause
```

### PowerShell Script (Alternative)

Create `start-bot.ps1` in `D:\Projects\nxrthstack\`:

```powershell
Write-Host "Starting NxrthStack Bot..." -ForegroundColor Cyan

# Start bot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Projects\nxrthstack\nxrthstack-bot; npm run dev"

# Wait for bot to initialize
Start-Sleep -Seconds 3

# Start tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:3001"

Write-Host ""
Write-Host "Bot and tunnel started!" -ForegroundColor Green
Write-Host "Check the Cloudflare Tunnel window for your public URL." -ForegroundColor Yellow
```

---

## Part 6: Run as Windows Service (Recommended for 24/7 Server)

Since this PC runs 24/7 alongside Minecraft and Paperless-ngx, you should run the bot as a Windows service that:
- Starts automatically on boot
- Runs in the background (no terminal window needed)
- Restarts automatically if it crashes

### 6.1 Install PM2 (Process Manager)

PM2 is easier to set up than node-windows and provides better monitoring:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### 6.2 Build the Bot

```powershell
cd D:\Projects\nxrthstack\nxrthstack-bot
npm run build
```

### 6.3 Start with PM2

```powershell
cd D:\Projects\nxrthstack\nxrthstack-bot

# Option A: Using ecosystem config (recommended)
pm2 start ecosystem.config.cjs

# Option B: Direct start
pm2 start dist/index.js --name "nxrthstack-bot"
```

### 6.4 Configure Auto-Start

```powershell
pm2-startup install
pm2 save
```

### 6.5 Useful PM2 Commands

```powershell
pm2 status              # Check bot status
pm2 logs nxrthstack-bot # View logs
pm2 restart nxrthstack-bot  # Restart bot
pm2 stop nxrthstack-bot     # Stop bot
pm2 monit               # Real-time monitoring dashboard
```

### 6.6 Cloudflare Tunnel as Service

Install the tunnel as a Windows service too:

```powershell
# Create the tunnel first (if not done)
cloudflared tunnel create nxrthstack-bot

# Install as service
cloudflared service install
```

Create/edit `C:\Users\YOUR_USERNAME\.cloudflared\config.yml`:

```yaml
tunnel: nxrthstack-bot
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: bot.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

Or for a free trycloudflare.com subdomain, create a simple scheduled task instead.

### 6.7 Alternative: NSSM (Non-Sucking Service Manager)

If you prefer NSSM (simpler, no Node.js dependency):

1. Download NSSM: https://nssm.cc/download
2. Extract to `C:\nssm`
3. Run:

```powershell
C:\nssm\nssm.exe install NxrthStackBot
```

4. Configure in the GUI:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `D:\Projects\nxrthstack\nxrthstack-bot`
   - **Arguments**: `dist\index.js`

5. Start the service:

```powershell
C:\nssm\nssm.exe start NxrthStackBot
```

---

## Part 7: Integration with Existing Services

### Resource Usage

The Discord bot is lightweight compared to your other services:

| Service | RAM Usage | CPU Usage |
|---------|-----------|-----------|
| Minecraft Server | 4-8 GB | Variable |
| Paperless-ngx | 500 MB - 1 GB | Low |
| **NxrthStack Bot** | **50-100 MB** | **Very Low** |

The bot will not impact your Minecraft server performance.

### Port Allocation

Make sure ports don't conflict:

| Service | Port |
|---------|------|
| Minecraft | 25565 (default) |
| Paperless-ngx | 8000 (default) |
| NxrthStack Bot API | 3001 |

### Recommended Startup Order

If you're managing services manually:
1. Paperless-ngx (if it accesses NAS)
2. NxrthStack Discord Bot
3. Minecraft Server (heaviest, start last)

With PM2/Windows Services, they start in parallel which is fine.

### Monitoring All Services

You can add all Node.js services to PM2:

```powershell
pm2 status
# Shows:
# ┌────┬──────────────────┬─────────┬───────┬────────┐
# │ id │ name             │ status  │ cpu   │ memory │
# ├────┼──────────────────┼─────────┼───────┼────────┤
# │ 0  │ nxrthstack-bot   │ online  │ 0%    │ 75 MB  │
# └────┴──────────────────┴─────────┴───────┴────────┘
```

---

## Troubleshooting

### Bot won't start
- Check that `.env` file exists and has correct values
- Verify `DISCORD_BOT_TOKEN` is valid (reset in Discord Developer Portal if needed)
- Run `npm install` again

### Commands not showing in Discord
- Run `npm run deploy-commands`
- Wait a few minutes (global commands can take up to an hour)
- For instant updates, make sure `DISCORD_GUILD_ID` is set (guild commands update instantly)

### Tunnel not working
- Check that port 3001 is not blocked by firewall
- Verify the bot is running and API is listening
- Test locally first: `curl http://localhost:3001/health`

### Website can't reach bot
- Verify `DISCORD_BOT_API_URL` in Vercel matches your tunnel URL
- Check that `DISCORD_CLIENT_SECRET` matches in both bot and Vercel
- Redeploy website after changing environment variables

---

## Quick Reference

### Start Everything
```powershell
# Terminal 1: Bot
cd D:\Projects\nxrthstack\nxrthstack-bot
npm run dev

# Terminal 2: Tunnel
cloudflared tunnel --url http://localhost:3001
```

### Test Webhook API
```powershell
curl http://localhost:3001/health
```

### Deploy New Commands
```powershell
npm run deploy-commands
```

### Build for Production
```powershell
npm run build
npm start
```

---

## Environment Variables Summary

### Bot Server (.env)
| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Bot token from Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_CLIENT_SECRET` | Shared secret (same as Vercel) |
| `DISCORD_GUILD_ID` | Your Discord server ID |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NXRTH_API_URL` | Website URL (https://nxrthstack.sweber.dev) |
| `API_PORT` | Webhook API port (default: 3001) |

### Vercel
| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_CLIENT_SECRET` | Shared secret (same as bot) |
| `DISCORD_BOT_API_URL` | Cloudflare tunnel URL |
