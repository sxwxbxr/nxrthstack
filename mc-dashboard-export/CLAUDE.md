# MC Dashboard — Project Context for Claude

This directory contains the complete Minecraft Server Dashboard, extracted from the NxrthStack GameHub monorepo for deployment as a **standalone Next.js project** on its own Vercel instance and domain (e.g., `mcdash.sweber.dev`).

## What This Project Is

A web-based Minecraft server management dashboard with:
- Real-time server console (SSE streaming)
- Player management (kick, ban, whitelist, ops)
- Server controls (start/stop/restart)
- File browser and editor
- Config editor (server.properties, JVM args)
- Backup management
- Historical stats with charts (TPS, memory, CPU, players)
- Session scheduler with auto-start/stop and in-game warnings
- Role-based access control (viewer/operator/manager/admin) via invite codes
- Admin panel for managing access codes and user roles
- Audit event logging

## Architecture Overview

```
Browser (mcdash.sweber.dev)
  │
  ├─ REST API ──→ Next.js on Vercel ──→ Neon PostgreSQL
  │                    │
  │                    ├─ Proxies to Agent (agentFetch + JWT)
  │                    │
  └─ SSE (direct) ──→ minecraft-agent on Homeserver (mc-api.sweber.dev)
                       │
                       └─ RCON ──→ Minecraft Server (Java)
```

### Two-tier auth for agent communication:
1. **REST**: Browser → Vercel API → Agent (Vercel signs JWT with server's `agentSecret`)
2. **SSE**: Browser gets a 5-min JWT from Vercel, then connects directly to Agent's `/console/stream?token=JWT`

## Directory Structure (from export)

```
app/
├── (dashboard)/dashboard/minecraft/     # User-facing pages (server list, overview, console, etc.)
├── (admin)/admin/minecraft/             # Admin panel (access codes, user management)
└── api/
    ├── minecraft/server/                # All REST API routes (status, control, console, players, etc.)
    └── cron/mc-stats/                   # Stats push endpoint (agent pushes every 5min)

components/
├── minecraft/                           # All MC-specific UI components
└── admin/                               # Admin MC components (mc-access-codes, mc-user-access, mc-admin-client)

hooks/
├── use-mc-access.ts                     # Server access list
├── use-mc-status.ts                     # Real-time status polling (15s)
├── use-mc-console-stream.ts             # SSE console with auto-reconnect
├── use-mc-preferences.ts                # User dashboard preferences
├── use-mc-stats.ts                      # Historical stats with range selector
└── use-mc-schedule.ts                   # Session scheduler

lib/gamehub/
├── minecraft.ts                         # Core: agentFetch, issueAgentToken, logMcEvent, requireMcAccess
├── minecraft-roles.ts                   # Role hierarchy: viewer < operator < manager < admin
├── minecraft-schemas.ts                 # Zod validation schemas
├── sessions.ts                          # Gaming session CRUD (used by scheduler)
└── sessions-constants.ts                # Game/activity type constants

minecraft-agent/                         # Express.js agent running on the homeserver
├── src/
│   ├── index.ts                         # Main server, registers routes + starts background services
│   ├── middleware/auth.ts               # JWT verification + role checks
│   ├── routes/                          # HTTP endpoints (status, control, console, players, files, config, backups, stats-history, scheduler)
│   └── services/                        # Business logic (process mgmt, RCON, stats collector, scheduler, backups, file sandbox)
├── package.json
└── tsconfig.json
```

## Database Schema (Neon PostgreSQL + Drizzle ORM)

### Tables needed for this project:

**`users`** — shared user table (simplified for standalone, or use Neon Auth):
- id (uuid PK), email, name, role ('customer'|'admin'), isFriend (boolean)

**`mc_servers`** — server registry:
- id, name, slug, agentUrl, agentSecret, gamePort, rconPort, maxPlayers, serverType, iconUrl, isActive

**`mc_access_codes`** — invite codes for server access:
- id, serverId (FK), code, label, defaultRole, maxUses, currentUses, expiresAt, createdById, isActive

**`mc_access_grants`** — per-user per-server role grants:
- id, serverId (FK), userId (FK), role, grantedViaCodeId, grantedById

**`mc_dashboard_layouts`** — customizable widget layouts (JSONB):
- id, userId, serverId, page, layouts

**`mc_dashboard_preferences`** — user preferences:
- id, userId, theme, sidebarCollapsed, consoleFontSize, consoleTimestamps, consoleAutoScroll, customColors

**`mc_server_events`** — audit log:
- id, serverId, userId, action, category, details (JSONB), ipAddress

**`mc_server_stats`** — time-series metrics (indexed on serverId+timestamp):
- id, serverId, timestamp, playersOnline, playersMax, tps, memoryUsedMb, memoryMaxMb, cpuPercent, diskUsedMb, isOnline

**`mc_player_events`** — player join/leave/death tracking (indexed):
- id, serverId, playerName, playerUuid, eventType, details, timestamp

**`mc_scheduled_actions`** — scheduled automation:
- id, serverId, sessionId (FK→gaming_sessions), createdById, action, scheduledAt, payload (JSONB), status, executedAt, resultMessage

**`gaming_sessions`** — session scheduler (also used for RSVP):
- id, hostId, title, description, game, activityType, scheduledAt, durationMinutes, maxParticipants, isPrivate, inviteCode, status

**`session_rsvps`** — RSVP tracking:
- id, sessionId, userId, status, note, respondedAt

The full Drizzle schema definitions are in the original `lib/db/schema.ts` — the MC section starts at the `// Minecraft Server Dashboard` comment.

## Homeserver Details

### Machine: DESKTOP-FFPUKF9
- **OS**: Windows 11 Pro
- **RAM**: 31.78 GB
- **Disk**: 475 GB (C:), ~393 GB free
- **LAN IP**: 192.168.1.2
- **Tailscale IP**: 100.77.93.43

### Services Running (managed via PM2 at `C:\NxrthServer\`):
- **minecraft-agent** (`C:\NxrthServer\minecraft-agent\`) — Express.js, port 3003, runs as `dist/index.js`
- **Minecraft Server** (`C:\NxrthServer\minecraft\`) — Paper MC, Java 17 (`C:\NxrthServer\java17\`), 4-8GB heap
- **nas-storage** — NAS storage server (separate service)
- **nxrthstack-bot** — Discord bot (separate service)

### PM2 Configuration: `C:\NxrthServer\ecosystem.config.cjs`
- PM2 binary: `C:\WINDOWS\system32\config\systemprofile\AppData\Roaming\npm\pm2.cmd`
- Logs: `C:\NxrthServer\logs\agent-{out,error}.log`
- Agent runs as `NT AUTHORITY\SYSTEM`

### Networking:
- **mc-api.sweber.dev** — Cloudflare Tunnel → localhost:3003 (agent)
- Agent CORS allows: `https://nxrthstack.sweber.dev` (will need updating to new domain)
- No ports exposed to internet; all traffic via Cloudflare Tunnels + Tailscale

### Agent Environment (`C:\NxrthServer\minecraft-agent\.env`):
```
PORT=3003
MC_SERVER_DIR=C:/NxrthServer/minecraft
MC_RCON_HOST=127.0.0.1
MC_RCON_PORT=25575
MC_RCON_PASSWORD=<secret>
MC_AGENT_SECRET=<secret>
ALLOWED_ORIGINS=https://<new-domain>
BACKUP_DIR=C:/NxrthServer/minecraft-backups
MAX_BACKUP_SIZE_GB=50
VERCEL_API_URL=https://<new-domain>
MC_SERVER_ID=<uuid from mc_servers table>
```

### Agent Background Services:
- **Stats Collector**: captures server metrics every 60s into memory buffer, pushes to Vercel API every 5 minutes
- **Scheduler**: checks for due scheduled actions every 10s, executes start/stop/RCON commands

## Migration Checklist (to set up new project)

### 1. New Next.js Project
- Create new Next.js 16 app with App Router
- Install deps: `drizzle-orm`, `@neondatabase/serverless`, `jose`, `swr`, `recharts`, `motion`, `tailwindcss`, `lucide-react`
- Set up Tailwind CSS 4, dark mode, OKLCH color tokens
- Copy `lib/utils.ts` (cn function), `components/icons.tsx`, `components/ui/` (FadeIn, etc.)

### 2. New Neon Database
- Create new Neon project at console.neon.tech
- Set up Neon Auth (for user authentication)
- Run `drizzle-kit push` to create tables from schema
- Set `DATABASE_URL` in Vercel env vars

### 3. Auth System
- Original uses Neon Auth: `auth()` from `@/lib/auth` returns `{ user: { id, email, name, role, isFriend } }`
- The `isFriend` flag OR `role === 'admin'` grants GameHub access
- For standalone: simplify to just check user is authenticated + has MC server access

### 4. Vercel Deployment
- New Vercel project linked to new repo
- Custom domain: `mcdash.sweber.dev` or `dashboard.sweber.dev`
- Env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`/Neon Auth vars

### 5. Update Homeserver Agent
- Update `ALLOWED_ORIGINS` in `.env` to new domain
- Update `VERCEL_API_URL` in `.env` to new domain
- Update `MC_SERVER_ID` with UUID from new DB's `mc_servers` table
- Restart agent via PM2

### 6. Cloudflare
- Add new domain/subdomain to Cloudflare
- Ensure `mc-api.sweber.dev` tunnel still works (agent endpoint)

## Key Patterns

- **API routes**: `auth()` → access check → try-catch → `NextResponse.json()`
- **Agent communication**: `agentFetch(serverId, path, userId, userRole, options?)` signs JWT and proxies
- **SSE tokens**: `issueAgentToken(serverId, userId, userRole)` → 5-min JWT for direct browser→agent SSE
- **Role checks**: `hasMinRole(userRole, "operator")` — hierarchy: viewer < operator < manager < admin
- **SWR polling**: status every 15s, schedules every 30s, stats based on range
- **Animations**: `motion/react` (NOT framer-motion), FadeIn/StaggerContainer components
- **Styling**: Tailwind CSS 4, OKLCH colors, `cn()` utility from `lib/utils`

## Important Notes

- The `gamingSessions` table is shared with the session system from the original GameHub — for standalone, it becomes MC-specific
- `mcScheduledActions.sessionId` references `gamingSessions.id` — keep this FK or merge into one table
- The agent's scheduler currently sends `sessionId` as `actionId` in callbacks — per-action tracking needs the actual action ID passed through sync
- Stats push uses agent→Vercel POST (not Vercel cron) because Vercel hobby plan limits crons to 1/day
- The `mc-api.sweber.dev` domain is a Cloudflare Tunnel directly to the homeserver's port 3003
