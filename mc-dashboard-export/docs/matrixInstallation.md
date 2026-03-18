# Matrix Server Implementation Plan

## Homeserver Current State

- Windows 11 Pro, hostname DESKTOP-FFPUKF9
- 31.78 GB RAM, 393 GB free on C:
- LAN: 192.168.1.2, Tailscale: 100.77.93.43
- **No Docker**, **No WSL2 distros**, **Hyper-V disabled**
- Running as `NT AUTHORITY\SYSTEM` (full admin)

---

## Phase 1: Prerequisites (Claude can do all of this)

| Step | Action | Who |
|------|--------|-----|
| 1.1 | Install WSL2 via `wsl --install --no-distribution` | Claude |
| 1.2 | Create `.wslconfig` to limit RAM to 4GB / 2 processors | Claude |
| 1.3 | **Reboot the server** (WSL2 requires it) | **User** (confirm when ready) |
| 1.4 | Download & silently install Docker Desktop | Claude |
| 1.5 | **Reboot again** (Docker Desktop requires it) | **User** (confirm when ready) |
| 1.6 | Verify `docker` and `docker compose` work | Claude |

## Phase 2: Directory Structure & Config Files (Claude can do all of this)

| Step | Action | Who |
|------|--------|-----|
| 2.1 | Create `C:\matrix\{synapse,postgres,element,bridges\{whatsapp,signal,discord}}` | Claude |
| 2.2 | Write `docker-compose.yml` with all services | Claude |
| 2.3 | Generate Synapse initial config via `docker run` | Claude |
| 2.4 | Customize `homeserver.yaml` (DB, logging, registration) | Claude |
| 2.5 | Write Element Web `config.json` | Claude |

## Phase 3: Secrets & Domain (User input required)

| Step | What is needed from the user |
|------|------------------------------|
| 3.1 | **Domain** — what domain to use? (e.g., `matrix.sweber.dev` / `sweber.dev`) |
| 3.2 | **Postgres password** — Claude can generate a secure one, or user provides one |
| 3.3 | **Admin username & password** for the first Matrix admin user |

## Phase 4: Cloudflare Tunnel (Split responsibility)

| Step | Action | Who |
|------|--------|-----|
| 4.1 | Go to Cloudflare Dashboard → Zero Trust → Tunnels → Create tunnel | **User** |
| 4.2 | Copy the **tunnel token** and give it to Claude | **User** |
| 4.3 | Add `cloudflared` container to docker-compose with the token | Claude |
| 4.4 | Configure public hostnames in Cloudflare (matrix + element subdomains) | **User** (Claude provides exact values) |
| 4.5 | Set up `.well-known` delegation (or enable `serve_server_wellknown` in Synapse) | Claude |
| 4.6 | Cloudflare settings: SSL Full (strict), WebSockets ON | **User** |

## Phase 5: Start Everything (Claude can do this)

| Step | Action | Who |
|------|--------|-----|
| 5.1 | `docker compose up -d postgres`, wait, then `up -d synapse` | Claude |
| 5.2 | Verify Synapse logs are clean | Claude |
| 5.3 | Register admin user via `register_new_matrix_user` | Claude |
| 5.4 | Start Element Web, cloudflared | Claude |
| 5.5 | Verify federation via federation tester | Claude |

## Phase 6: Bridges (Split responsibility)

### WhatsApp Bridge

| Step | Action | Who |
|------|--------|-----|
| 6.1 | Download config template, customize, generate registration | Claude |
| 6.2 | Register with Synapse, start bridge | Claude |
| 6.3 | DM `@whatsappbot`, scan QR code with phone | **User** |

### Signal Bridge

| Step | Action | Who |
|------|--------|-----|
| 6.4 | Same setup as WhatsApp | Claude |
| 6.5 | Link via QR code / phone verification | **User** |

### Discord Bridge

| Step | Action | Who |
|------|--------|-----|
| 6.6 | Create Discord Bot in Developer Portal, get token | **User** |
| 6.7 | Give Claude the bot token | **User** |
| 6.8 | Configure bridge, generate registration, start | Claude |

## Phase 7: Maintenance (Claude can do this)

| Step | Action | Who |
|------|--------|-----|
| 7.1 | Write `backup.ps1` script | Claude |
| 7.2 | Add Watchtower container for auto-updates | Claude |
| 7.3 | Create scheduled task for daily backups | Claude |

---

## Summary — User Checklist

1. **Domain name** for Matrix (e.g., `sweber.dev` as root, `matrix.sweber.dev` as server)
2. **Two reboots** (after WSL2 install, after Docker install)
3. **Cloudflare tunnel token** (created in Zero Trust dashboard)
4. **Cloudflare DNS/hostname config** (Claude provides exact values to enter)
5. **Cloudflare settings** (SSL mode, WebSockets — Claude provides exact instructions)
6. **Discord bot token** (from Developer Portal)
7. **Phone access** for WhatsApp QR scan + Signal linking
8. Passwords (or Claude generates them)

Everything else can be executed autonomously by Claude.
