# NxrthServer Setup — Windows 11

## What's Here

```
server-setup/
├── setup.ps1           <- Automated setup script (run once, then delete repo)
├── post-install.sh     <- Alpine Linux version (archived, not used)
└── README.md           <- This file
```

## How to Use

### On the Business PC (Windows 11 Pro)

```powershell
# 1. Clone the repo
git clone https://github.com/sxwxbxr/nxrthstack.git C:\Temp\nxrthstack

# 2. Run setup as Administrator
PowerShell -ExecutionPolicy Bypass -File C:\Temp\nxrthstack\server-setup\setup.ps1

# 3. Follow the prompts (see "Have Ready" section below)

# 4. Delete the repo when done — everything lives at C:\NxrthServer
Remove-Item -Recurse -Force C:\Temp\nxrthstack
```

### Have Ready Before Running

| Secret | Where to Get It |
|--------|----------------|
| Discord Bot Token | https://discord.com/developers/applications > Bot > Token |
| Discord Client Secret | Same page > OAuth2 > Client Secret |
| Discord Guild ID | Discord > right-click server > Copy Server ID |
| Database URL | Neon dashboard > Connection string |
| CurseForge API Key | https://console.curseforge.com (optional) |
| Cloudflare Tunnel Token | https://one.dash.cloudflare.com > Networks > Tunnels > nxrthserver > Token |

### What Gets Installed

- Node.js LTS, Java 21, PM2, tsx (via winget + npm)
- Discord Bot at `C:\NxrthServer\nxrthstack-bot` (PM2, port 3001)
- NAS Storage at `C:\NxrthServer\nas-storage-server` (PM2, port 3002)
- MC Agent at `C:\NxrthServer\minecraft-agent` (PM2, port 3003)
- Minecraft Server at `C:\NxrthServer\minecraft` (Scheduled Task, port 25565)
- Cloudflare Tunnel as Windows Service
- Tailscale VPN
- Firewall rules for all ports

### After Setup

Everything auto-starts on boot. Quick check:

```powershell
pm2 status                    # Bot, NAS, Agent
Get-Service cloudflared       # Tunnel
tailscale status              # VPN
```

### Full Documentation

See `docs/nxrthServer-setup.md` for the complete 18-section reference guide.
