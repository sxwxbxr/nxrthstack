# NxrthServer Minecraft Dashboard - Technical Specification Document

**Product Name:** NxrthServer Minecraft Dashboard
**Category:** GameHub Integrated Server Management Panel
**Version:** 1.0 (Initial Specification)
**Last Updated:** 2026-02-10

---

## Executive Summary

The NxrthServer Minecraft Dashboard is a full-featured, web-based Minecraft server management panel integrated directly into the NxrthStack GameHub. It provides G-Portal/Nitrado-level server management capabilities through a secure, access-code-gated interface. The dashboard communicates with a lightweight agent running on the Alpine Linux server alongside the Minecraft process, exposing RCON, file system, process, and modpack management over a secure API.

### Core Value Propositions

1. **One-Click Modpack Installs** - Browse CurseForge, pick a modpack, click install. Server handles the rest.
2. **Dummy-Safe Management** - Every destructive action requires confirmation. Rolling backups before changes. Impossible to accidentally break the server.
3. **Real-Time Console** - Live server console with command input, filterable log levels, and auto-scroll.
4. **Deep GameHub Integration** - Player stats, achievements, session scheduling, and Discord notifications all connected.
5. **Fully Customizable Layout** - Every user can rearrange, resize, and theme their dashboard panels.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Access Control System](#2-access-control-system)
3. [Server Agent (Alpine Linux)](#3-server-agent-alpine-linux)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [CurseForge Integration](#6-curseforge-integration)
7. [Dashboard Pages & Components](#7-dashboard-pages--components)
8. [Customizable Layout System](#8-customizable-layout-system)
9. [Design System & Theming](#9-design-system--theming)
10. [Discord Bot Integration](#10-discord-bot-integration)
11. [Safety & Backup System](#11-safety--backup-system)
12. [Real-Time Communication](#12-real-time-communication)
13. [File Structure](#13-file-structure)
14. [Implementation Phases](#14-implementation-phases)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│  NxrthStack GameHub → /dashboard/gamehub/minecraft/server/*         │
│  (Next.js 16 frontend with customizable grid layout)                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS (Vercel → Cloudflare Tunnel)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES (Vercel)                        │
│  /api/gamehub/minecraft/server/*                                     │
│  - Auth + access code validation                                     │
│  - Proxies requests to server agent                                  │
│  - Caches non-critical data (player list, stats)                    │
│  - Stores layout/preferences in Neon DB                             │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS (Cloudflare Tunnel: mc-api.sweber.dev)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              MINECRAFT SERVER AGENT (Alpine Linux)                    │
│              Express.js daemon on port 3003                          │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ RCON Client  │  │ File Manager │  │ Process Manager          │   │
│  │ (rcon-client)│  │ (fs + chokidar)│ │ (child_process + pidfile)│  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────────┘   │
│         │                │                      │                    │
│  ┌──────┴──────────────────┴──────────────────────┴─────────────┐   │
│  │                    MINECRAFT SERVER                            │   │
│  │              Paper MC (Java) on port 25565                    │   │
│  │              /opt/minecraft/                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ CurseForge Modpack Manager                                    │   │
│  │ - Downloads from CurseForge CDN                              │   │
│  │ - Extracts and installs modpacks                             │   │
│  │ - Manages server JAR switching (Paper → Forge/Fabric/NeoForge)│   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Browser** → Vercel API route (auth + access code check)
2. **Vercel API** → `mc-api.sweber.dev` (Cloudflare Tunnel) → Server Agent `:3003`
3. **Server Agent** → RCON `:25575` for commands, filesystem for configs, `child_process` for server control
4. **Real-Time**: Server Agent → SSE (Server-Sent Events) stream → Vercel API proxy → Browser EventSource

### Why a Server Agent?

The Minecraft server runs on Alpine Linux (not Vercel). The agent is a lightweight Express.js service running alongside the MC server that:
- Reads/writes files on the local filesystem
- Sends RCON commands to the Minecraft server
- Manages the Java process (start/stop/restart)
- Handles modpack downloads and installation
- Streams console output in real-time via SSE
- Exposes a REST API authenticated with a shared secret

---

## 2. Access Control System

### Access Code Gating

The Minecraft Dashboard is NOT open to all GameHub users. Access requires a special code defined by an admin.

#### Schema Addition

```typescript
// In lib/db/schema.ts — add to existing schema

export const mcAccessCodes = pgTable("mc_access_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 100 }),           // e.g. "Season 3 Access"
  maxUses: integer("max_uses"),                         // null = unlimited
  currentUses: integer("current_uses").default(0).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const mcAccessGrants = pgTable("mc_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeId: uuid("code_id").references(() => mcAccessCodes.id, { onDelete: "set null" }),
  role: varchar("role", { length: 20 }).default("viewer").notNull(),
    // "viewer"   — read-only (see console, players, stats)
    // "operator"  — can run whitelisted commands, manage whitelist
    // "manager"   — can install mods, edit configs, restart server
    // "admin"     — full access (stop server, delete worlds, manage codes)
  grantedAt: timestamp("granted_at", { mode: "date" }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
});
```

#### Access Flow

```
1. Admin creates access code via /admin/gamehub/minecraft
   → Generates code like "NXRTH-MC-A4F9" (nanoid-based)

2. User navigates to /dashboard/gamehub/minecraft/server
   → If no mcAccessGrants record exists → shows "Enter Access Code" gate

3. User enters code
   → POST /api/gamehub/minecraft/server/access
   → Validates code (active, not expired, under max uses)
   → Creates mcAccessGrants record with role="viewer" (default)
   → Increments currentUses on the code

4. Admin can promote users to operator/manager/admin via the admin panel
   → PUT /api/admin/gamehub/minecraft/access/:grantId

5. Subsequent visits: middleware checks mcAccessGrants for userId
   → If grant exists and not revoked → allow access
   → If grant.role === "viewer" → read-only UI (commands/actions disabled)
```

#### Permission Matrix

| Action                        | Viewer | Operator | Manager | Admin |
|-------------------------------|--------|----------|---------|-------|
| View console (read-only)      | Yes    | Yes      | Yes     | Yes   |
| View player list              | Yes    | Yes      | Yes     | Yes   |
| View server stats             | Yes    | Yes      | Yes     | Yes   |
| View file browser (read)      | No     | Yes      | Yes     | Yes   |
| Send whitelisted commands     | No     | Yes      | Yes     | Yes   |
| Manage whitelist              | No     | Yes      | Yes     | Yes   |
| Edit server.properties        | No     | No       | Yes     | Yes   |
| Install/remove modpacks       | No     | No       | Yes     | Yes   |
| Restart server                | No     | No       | Yes     | Yes   |
| Create/restore backups        | No     | No       | Yes     | Yes   |
| Stop server                   | No     | No       | No      | Yes   |
| Delete worlds                 | No     | No       | No      | Yes   |
| Edit files (write)            | No     | No       | No      | Yes   |
| Manage access codes           | No     | No       | No      | Yes   |
| Promote/demote users          | No     | No       | No      | Yes   |
| Schedule tasks (auto-restart) | No     | No       | Yes     | Yes   |

---

## 3. Server Agent (Alpine Linux)

### Technology

| Component       | Technology                  | Purpose                              |
|-----------------|-----------------------------|--------------------------------------|
| Runtime         | Node.js + Express.js        | HTTP API server                      |
| RCON            | `rcon-client` npm package   | Send commands to Minecraft           |
| File Watching   | `chokidar`                  | Watch log files for real-time output |
| Process Control | Node.js `child_process`     | Start/stop/restart Java process      |
| SSE             | Native `res.write()`        | Stream console output to clients     |
| Auth            | Shared secret header        | `X-MC-Agent-Secret` header           |
| Modpack DL      | `node-fetch` + `unzipper`   | Download and extract modpack archives|

### Agent Location

```
/opt/minecraft-agent/
├── package.json
├── src/
│   ├── index.ts              # Express server entrypoint (port 3003)
│   ├── auth.ts               # Middleware: validate X-MC-Agent-Secret
│   ├── rcon.ts               # RCON connection pool and command execution
│   ├── process.ts            # MC server process manager (start/stop/restart)
│   ├── files.ts              # File browser (sandboxed to /opt/minecraft/)
│   ├── console.ts            # Log file watcher + SSE stream
│   ├── backup.ts             # Backup creation and restoration
│   ├── modpacks.ts           # CurseForge download + install logic
│   ├── stats.ts              # Server stats collector (TPS, memory, players)
│   ├── scheduler.ts          # Cron-like task scheduler (restarts, backups)
│   └── properties.ts         # server.properties parser and editor
├── ecosystem.config.cjs      # PM2 config
└── .env
```

### Agent API Endpoints

All endpoints require `X-MC-Agent-Secret` header matching the shared secret.

#### Server Control

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/status`              | Server status (running/stopped, TPS, memory, player count, uptime) |
| POST   | `/start`               | Start the Minecraft server         |
| POST   | `/stop`                | Graceful stop (save-all → stop)    |
| POST   | `/restart`             | Graceful restart                   |
| POST   | `/kill`                | Force kill (emergency only)        |

#### Console

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/console/stream`      | SSE stream of live console output  |
| GET    | `/console/history`     | Last N lines of console log        |
| POST   | `/console/command`     | Execute RCON command               |

#### Players

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/players`             | Online player list with details    |
| POST   | `/players/kick`        | Kick a player                      |
| POST   | `/players/ban`         | Ban a player                       |
| POST   | `/players/unban`       | Unban a player                     |
| GET    | `/players/whitelist`   | Get whitelist                      |
| POST   | `/players/whitelist`   | Add to whitelist                   |
| DELETE | `/players/whitelist`   | Remove from whitelist              |
| GET    | `/players/ops`         | Get op list                        |
| POST   | `/players/ops`         | Op a player                        |
| DELETE | `/players/ops`         | Deop a player                      |

#### Files

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/files`               | List directory (sandboxed)         |
| GET    | `/files/read`          | Read file content                  |
| PUT    | `/files/write`         | Write file content                 |
| POST   | `/files/mkdir`         | Create directory                   |
| DELETE | `/files/delete`        | Delete file/directory              |
| POST   | `/files/rename`        | Rename/move file                   |
| GET    | `/files/download`      | Download file as stream            |
| POST   | `/files/upload`        | Upload file (multipart)            |

#### Configuration

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/config/properties`   | Parse and return server.properties |
| PUT    | `/config/properties`   | Update server.properties values    |
| GET    | `/config/java`         | Get JVM args from start.sh         |
| PUT    | `/config/java`         | Update JVM args                    |

#### Backups

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/backups`             | List all backups with metadata     |
| POST   | `/backups/create`      | Create backup (full or world-only) |
| POST   | `/backups/restore`     | Restore from backup (stops server) |
| DELETE | `/backups/:id`         | Delete a backup                    |
| GET    | `/backups/:id/download`| Download backup archive            |

#### Modpacks

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/modpacks/installed`  | Currently installed modpack info   |
| POST   | `/modpacks/install`    | Install modpack from CurseForge    |
| POST   | `/modpacks/uninstall`  | Remove modpack and revert to vanilla|
| GET    | `/modpacks/progress`   | SSE stream of install progress     |

#### Scheduler

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/scheduler`           | List scheduled tasks               |
| POST   | `/scheduler`           | Create scheduled task              |
| PUT    | `/scheduler/:id`       | Update scheduled task              |
| DELETE | `/scheduler/:id`       | Delete scheduled task              |

### RCON Implementation

```typescript
// src/rcon.ts — conceptual implementation

import { Rcon } from "rcon-client";

let rconClient: Rcon | null = null;

export async function getRcon(): Promise<Rcon> {
  if (rconClient?.authenticated) return rconClient;

  rconClient = await Rcon.connect({
    host: "127.0.0.1",
    port: parseInt(process.env.RCON_PORT || "25575"),
    password: process.env.RCON_PASSWORD!,
    timeout: 5000,
  });

  rconClient.on("error", () => { rconClient = null; });
  rconClient.on("end", () => { rconClient = null; });

  return rconClient;
}

export async function executeCommand(command: string): Promise<string> {
  const rcon = await getRcon();
  return rcon.send(command);
}

// Whitelisted commands for "operator" role (safe commands only)
export const OPERATOR_COMMANDS = [
  "list", "whitelist", "say", "tell", "msg", "w",
  "time query", "weather", "seed", "difficulty",
  "gamerule", "tp", "teleport", "give", "effect",
  "gamemode", "xp", "experience", "scoreboard",
];

// Blocked commands (never allow via dashboard, even for admin)
export const BLOCKED_COMMANDS = [
  "stop",      // Use the stop endpoint instead (creates backup first)
  "restart",   // Use the restart endpoint instead
  "save-off",  // Dangerous without corresponding save-on
  "op",        // Use the ops endpoint instead (logs the action)
  "deop",      // Use the ops endpoint instead
  "ban",       // Use the ban endpoint instead (logs the action)
  "ban-ip",    // Use the ban endpoint instead
  "pardon",    // Use the unban endpoint instead
  "pardon-ip", // Use the unban endpoint instead
];
```

### Console SSE Stream

```typescript
// src/console.ts — conceptual implementation

import chokidar from "chokidar";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

const LOG_PATH = "/opt/minecraft/logs/latest.log";

export function streamConsole(req: Request, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  let lastSize = 0;

  const watcher = chokidar.watch(LOG_PATH, { persistent: true });

  watcher.on("change", async () => {
    const { size } = await stat(LOG_PATH);
    if (size > lastSize) {
      const stream = createReadStream(LOG_PATH, { start: lastSize, end: size });
      let data = "";
      stream.on("data", (chunk) => (data += chunk));
      stream.on("end", () => {
        const lines = data.split("\n").filter(Boolean);
        for (const line of lines) {
          // Parse log level from Minecraft format: [HH:MM:SS] [Thread/LEVEL]: message
          const parsed = parseLogLine(line);
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        }
        lastSize = size;
      });
    }
  });

  req.on("close", () => watcher.close());
}
```

### Process Manager

```typescript
// src/process.ts — conceptual implementation

import { spawn, ChildProcess } from "child_process";
import { readFileSync } from "fs";

let mcProcess: ChildProcess | null = null;

export function getServerStatus(): ServerStatus {
  return {
    running: mcProcess !== null && mcProcess.exitCode === null,
    pid: mcProcess?.pid || null,
    uptime: startTime ? Date.now() - startTime : 0,
    // TPS and memory fetched via RCON when server is running
  };
}

export async function startServer(): Promise<void> {
  if (mcProcess && mcProcess.exitCode === null) {
    throw new Error("Server is already running");
  }

  mcProcess = spawn("bash", ["/opt/minecraft/start.sh"], {
    cwd: "/opt/minecraft",
    stdio: ["pipe", "pipe", "pipe"],
  });

  startTime = Date.now();

  mcProcess.stdout?.on("data", (data) => {
    appendToLog(data.toString());
  });

  mcProcess.on("exit", (code) => {
    mcProcess = null;
    startTime = null;
    appendToLog(`[Agent] Server exited with code ${code}`);
  });
}

export async function stopServer(): Promise<void> {
  // Graceful: save-all, wait, then stop
  await executeCommand("save-all");
  await sleep(3000);
  await executeCommand("stop");

  // Wait up to 30s for clean shutdown
  await waitForExit(30000);
}

export async function restartServer(): Promise<void> {
  await stopServer();
  await sleep(2000);
  await startServer();
}
```

---

## 4. Database Schema

### New Tables

Add the following to `lib/db/schema.ts`:

```typescript
// ──────────────────────────────────────────────────────────────────
// MINECRAFT SERVER DASHBOARD
// ──────────────────────────────────────────────────────────────────

export const mcAccessCodes = pgTable("mc_access_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 100 }),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const mcAccessGrants = pgTable("mc_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeId: uuid("code_id").references(() => mcAccessCodes.id, { onDelete: "set null" }),
  role: varchar("role", { length: 20 }).default("viewer").notNull(),
  grantedAt: timestamp("granted_at", { mode: "date" }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
});

export const mcDashboardLayouts = pgTable("mc_dashboard_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // "overview", "console", "players", "files", "modpacks", "backups", "config", "scheduler"
  page: varchar("page", { length: 50 }).notNull(),
  layout: jsonb("layout").notNull(),
  // layout = Array<{ widgetId: string, x: number, y: number, w: number, h: number, collapsed: boolean }>
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const mcDashboardPreferences = pgTable("mc_dashboard_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: varchar("theme", { length: 30 }).default("gamehub").notNull(),
  // "gamehub" (default purple), "minecraft" (green), "nether" (red), "end" (purple-dark), "custom"
  accentColor: varchar("accent_color", { length: 7 }),      // hex "#00ff00" (for custom theme)
  sidebarPosition: varchar("sidebar_position", { length: 10 }).default("left").notNull(),
  compactMode: boolean("compact_mode").default(false).notNull(),
  showMotd: boolean("show_motd").default(true).notNull(),
  consoleFontSize: integer("console_font_size").default(14).notNull(),
  consoleMaxLines: integer("console_max_lines").default(500).notNull(),
  consoleTimestamps: boolean("console_timestamps").default(true).notNull(),
  defaultConsoleLevelFilter: varchar("default_console_level_filter", { length: 20 }).default("all").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const mcServerEvents = pgTable("mc_server_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  // "server.start", "server.stop", "server.crash",
  // "modpack.install", "modpack.uninstall",
  // "backup.create", "backup.restore",
  // "player.join", "player.leave",
  // "command.executed", "config.changed",
  // "access.granted", "access.revoked"
  actorId: uuid("actor_id").references(() => users.id),  // who triggered the event (null = system)
  metadata: jsonb("metadata"),                             // event-specific data
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const mcScheduledTasks = pgTable("mc_scheduled_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  taskType: varchar("task_type", { length: 30 }).notNull(),
  // "restart", "backup", "command", "announcement"
  cronExpression: varchar("cron_expression", { length: 50 }).notNull(),
  // e.g. "0 4 * * *" = every day at 4 AM
  taskData: jsonb("task_data"),
  // For "command": { command: "say Server restarting in 5 minutes!" }
  // For "backup": { type: "full" | "world-only", retainCount: 5 }
  // For "announcement": { message: "...", minutes_before: 5 }
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at", { mode: "date" }),
  nextRunAt: timestamp("next_run_at", { mode: "date" }),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
```

### Relations

```typescript
export const mcAccessCodesRelations = relations(mcAccessCodes, ({ one, many }) => ({
  creator: one(users, { fields: [mcAccessCodes.createdBy], references: [users.id] }),
  grants: many(mcAccessGrants),
}));

export const mcAccessGrantsRelations = relations(mcAccessGrants, ({ one }) => ({
  user: one(users, { fields: [mcAccessGrants.userId], references: [users.id] }),
  code: one(mcAccessCodes, { fields: [mcAccessGrants.codeId], references: [mcAccessCodes.id] }),
}));

export const mcDashboardLayoutsRelations = relations(mcDashboardLayouts, ({ one }) => ({
  user: one(users, { fields: [mcDashboardLayouts.userId], references: [users.id] }),
}));

export const mcDashboardPreferencesRelations = relations(mcDashboardPreferences, ({ one }) => ({
  user: one(users, { fields: [mcDashboardPreferences.userId], references: [users.id] }),
}));

export const mcScheduledTasksRelations = relations(mcScheduledTasks, ({ one }) => ({
  creator: one(users, { fields: [mcScheduledTasks.createdBy], references: [users.id] }),
}));
```

---

## 5. API Routes

### Next.js API Route Structure

```
app/api/gamehub/minecraft/server/
├── access/
│   ├── route.ts              # POST: redeem access code
│   └── validate/route.ts     # GET: check if user has access + role
├── status/route.ts           # GET: server status (proxied from agent)
├── console/
│   ├── route.ts              # GET: history, POST: send command
│   └── stream/route.ts       # GET: SSE proxy stream
├── players/
│   ├── route.ts              # GET: player list
│   ├── kick/route.ts         # POST: kick player
│   ├── ban/route.ts          # POST/DELETE: ban/unban
│   ├── whitelist/route.ts    # GET/POST/DELETE: whitelist management
│   └── ops/route.ts          # GET/POST/DELETE: op management
├── files/
│   ├── route.ts              # GET: list, POST: upload
│   ├── read/route.ts         # GET: file content
│   ├── write/route.ts        # PUT: write file
│   └── delete/route.ts       # DELETE: remove file
├── config/
│   ├── properties/route.ts   # GET/PUT: server.properties
│   └── java/route.ts         # GET/PUT: JVM arguments
├── backups/
│   ├── route.ts              # GET: list, POST: create
│   ├── [id]/route.ts         # DELETE: remove backup
│   └── restore/route.ts      # POST: restore backup
├── modpacks/
│   ├── route.ts              # GET: installed info
│   ├── search/route.ts       # GET: search CurseForge (proxied)
│   ├── install/route.ts      # POST: install modpack
│   ├── uninstall/route.ts    # POST: uninstall modpack
│   └── progress/route.ts     # GET: SSE install progress
├── scheduler/
│   └── route.ts              # GET/POST/PUT/DELETE: scheduled tasks
├── events/route.ts           # GET: server event log
├── layout/route.ts           # GET/PUT: user's dashboard layout
└── preferences/route.ts      # GET/PUT: user's dashboard preferences
```

### API Route Pattern

Every route follows the existing NxrthStack pattern:

```typescript
// Example: /api/gamehub/minecraft/server/console/route.ts

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mcAccessGrants } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const MC_AGENT_URL = process.env.MC_AGENT_URL!;       // https://mc-api.sweber.dev
const MC_AGENT_SECRET = process.env.MC_AGENT_SECRET!;

// Helper: check MC dashboard access and return role
async function getMcAccess(userId: string) {
  const [grant] = await db
    .select()
    .from(mcAccessGrants)
    .where(
      and(
        eq(mcAccessGrants.userId, userId),
        isNull(mcAccessGrants.revokedAt)
      )
    )
    .limit(1);
  return grant;
}

// Helper: proxy request to server agent
async function agentFetch(path: string, options?: RequestInit) {
  return fetch(`${MC_AGENT_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-MC-Agent-Secret": MC_AGENT_SECRET,
      ...options?.headers,
    },
  });
}

// GET: get console history
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getMcAccess(session.user.id);
  if (!access) {
    return NextResponse.json({ error: "No server access" }, { status: 403 });
  }

  const response = await agentFetch("/console/history");
  const data = await response.json();
  return NextResponse.json(data);
}

// POST: send command
const commandSchema = z.object({
  command: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getMcAccess(session.user.id);
  if (!access || access.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Role-based command filtering happens on the agent side too,
  // but we enforce it here as well for defense-in-depth
  const response = await agentFetch("/console/command", {
    method: "POST",
    body: JSON.stringify({
      command: parsed.data.command,
      role: access.role,
      userId: session.user.id,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### Environment Variables

Add to Vercel environment:

```
MC_AGENT_URL=https://mc-api.sweber.dev
MC_AGENT_SECRET=<generated shared secret>
```

Add to Cloudflare Tunnel config:

```yaml
# In ~/.cloudflared/config.yml on Alpine server
- hostname: mc-api.sweber.dev
  service: http://localhost:3003
```

---

## 6. CurseForge Integration

### API Setup

CurseForge requires an API key from https://console.curseforge.com/

| Property        | Value                                       |
|-----------------|---------------------------------------------|
| Base URL        | `https://api.curseforge.com/v1`             |
| Auth Header     | `x-api-key: YOUR_CURSEFORGE_API_KEY`        |
| Game ID         | `432` (Minecraft)                           |
| Class: Modpacks | `4471`                                      |
| Class: Mods     | `6`                                         |

### Key CurseForge Endpoints Used

```
GET  /v1/mods/search
     ?gameId=432
     &classId=4471           (modpacks only)
     &searchFilter={query}
     &sortField=2            (popularity)
     &sortOrder=desc
     &pageSize=20
     &index={offset}
     &modLoaderType={1=Forge, 4=Fabric, 6=NeoForge}
     &gameVersion={1.21.4}

GET  /v1/mods/{modId}
     → Full mod/modpack details, description, images

GET  /v1/mods/{modId}/files
     → All available file versions

GET  /v1/mods/{modId}/files/{fileId}
     → Specific file metadata (downloadUrl, fileName, fileLength)

GET  /v1/mods/{modId}/files/{fileId}/download-url
     → Direct CDN download URL
```

### CurseForge Data Types (relevant fields)

```typescript
interface CurseForgeModpack {
  id: number;
  name: string;
  slug: string;
  summary: string;
  logo: { thumbnailUrl: string; url: string };
  screenshots: Array<{ url: string; title: string }>;
  downloadCount: number;
  dateModified: string;
  categories: Array<{ id: number; name: string; iconUrl: string }>;
  authors: Array<{ name: string; url: string }>;
  latestFiles: CurseForgeFile[];
  latestFilesIndexes: Array<{
    gameVersion: string;
    fileId: number;
    filename: string;
    modLoader: number;  // 1=Forge, 4=Fabric, 6=NeoForge
  }>;
}

interface CurseForgeFile {
  id: number;
  modId: number;
  displayName: string;
  fileName: string;
  fileLength: number;
  downloadUrl: string | null;  // null if distribution denied → use /download-url endpoint
  gameVersions: string[];
  sortableGameVersions: Array<{ gameVersion: string }>;
  dependencies: Array<{ modId: number; relationType: number }>;  // 3 = required
  serverPackFileId: number | null;  // If this exists, there's a dedicated server pack
}
```

### One-Click Modpack Install Flow

This is the core feature. The process must be **dummy-safe**: no user input beyond clicking "Install".

```
User clicks "Install" on a modpack
         │
         ▼
┌─ STEP 1: PRE-FLIGHT CHECK ──────────────────────────────────┐
│ • Show confirmation modal with:                              │
│   - Modpack name, version, size                              │
│   - Required mod loader (Forge/Fabric/NeoForge)             │
│   - Minecraft version                                        │
│   - Warning: "This will replace current server configuration"│
│   - Checkbox: "Create backup before installing" (checked)    │
│ • User clicks "Confirm Install"                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 2: AUTOMATIC BACKUP ──────────────────────────────────┐
│ • Agent creates full backup of /opt/minecraft/               │
│ • Backup includes: world/, mods/, config/, server.properties │
│ • Progress: 10%                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 3: STOP SERVER ───────────────────────────────────────┐
│ • save-all → wait 3s → stop                                 │
│ • Wait for clean shutdown                                    │
│ • Progress: 20%                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 4: DOWNLOAD MODPACK ──────────────────────────────────┐
│ • Fetch modpack file from CurseForge CDN                    │
│ • Prefer serverPackFileId if available (server-specific pack)│
│ • Stream to /opt/minecraft/temp/modpack.zip                 │
│ • Show download progress with speed and ETA                  │
│ • Progress: 20% → 50%                                       │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 5: CLEAN SERVER DIRECTORY ─────────────────────────────┐
│ • Remove: mods/, config/, libraries/, defaultconfigs/        │
│ • Keep: world/, backups/, logs/, eula.txt                    │
│ • Progress: 55%                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 6: INSTALL MOD LOADER ────────────────────────────────┐
│ IF Forge:                                                    │
│   • Download Forge installer JAR                             │
│   • Run: java -jar forge-installer.jar --installServer       │
│   • Wait for completion                                      │
│                                                              │
│ IF Fabric:                                                   │
│   • Download Fabric server launcher                          │
│   • Place fabric-server-launch.jar in server root            │
│   • Create fabric-server-launcher.properties                 │
│                                                              │
│ IF NeoForge:                                                 │
│   • Download NeoForge installer JAR                          │
│   • Run: java -jar neoforge-installer.jar --installServer    │
│   • Wait for completion                                      │
│                                                              │
│ • Progress: 65%                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 7: EXTRACT MODPACK ───────────────────────────────────┐
│ • Extract modpack.zip to server directory                    │
│ • Parse manifest.json (CurseForge modpack format)           │
│   OR parse modrinth.index.json (Modrinth packs)             │
│ • Download each required mod file:                           │
│   - Read manifest.files[] array                              │
│   - GET /v1/mods/{projectID}/files/{fileID}/download-url    │
│   - Save to /opt/minecraft/mods/                            │
│ • Copy overrides/ directory contents to server root          │
│ • Progress: 65% → 90% (incremental per mod file)            │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 8: CONFIGURE SERVER ──────────────────────────────────┐
│ • Merge server.properties (keep user values for port, motd) │
│ • Update start.sh with correct JAR filename                 │
│ • Verify eula.txt = "eula=true"                             │
│ • Progress: 95%                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ STEP 9: START SERVER ──────────────────────────────────────┐
│ • Start server process                                       │
│ • Wait for "Done!" in console output                        │
│ • Verify server is responsive via RCON                      │
│ • Progress: 100% ✓                                           │
│ • Log mcServerEvents: "modpack.install"                     │
│ • Discord notification: "Modpack X installed on server"     │
└──────────────────────────────────────────────────────────────┘
```

### Progress SSE Stream

The install progress is streamed to the client via SSE:

```typescript
// SSE events sent during installation
interface InstallProgressEvent {
  step: number;           // 1-9
  totalSteps: 9;
  stepLabel: string;      // "Creating backup...", "Downloading modpack..."
  progress: number;       // 0-100 overall
  stepProgress: number;   // 0-100 within current step
  bytesDownloaded?: number;
  bytesTotal?: number;
  downloadSpeed?: string; // "2.4 MB/s"
  eta?: string;           // "~45s remaining"
  error?: string;         // Set if step failed
  modsDownloaded?: number;
  modsTotal?: number;
}
```

---

## 7. Dashboard Pages & Components

### Route Structure

```
/dashboard/gamehub/minecraft/server/
├── page.tsx                    # Access code gate OR dashboard overview
├── layout.tsx                  # MC dashboard layout with sidebar + topbar
├── console/page.tsx            # Live console with command input
├── players/page.tsx            # Player management (online, whitelist, bans)
├── files/page.tsx              # File browser
├── modpacks/page.tsx           # CurseForge browser + installed mods
├── modpacks/[modId]/page.tsx   # Modpack detail page
├── backups/page.tsx            # Backup management
├── config/page.tsx             # server.properties editor + JVM args
├── scheduler/page.tsx          # Scheduled task management
├── events/page.tsx             # Server event/audit log
└── settings/page.tsx           # Dashboard appearance + layout preferences
```

### Page Descriptions

#### 7.1 Access Code Gate (`/server/page.tsx` — when no access)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│             ⛏️  NxrthServer Minecraft                     │
│                                                            │
│     Enter your access code to manage the server.          │
│                                                            │
│     ┌────────────────────────────────────┐                │
│     │  NXRTH-MC-____                     │                │
│     └────────────────────────────────────┘                │
│                                                            │
│     [ Unlock Access ]                                     │
│                                                            │
│     Don't have a code? Ask an admin.                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Full-screen centered card
- Input with uppercase auto-formatting
- Error states: "Invalid code", "Code expired", "Code fully redeemed"
- Success: redirect to overview with success toast

#### 7.2 Dashboard Overview (`/server/page.tsx` — when has access)

The main dashboard. Customizable grid layout with widgets.

**Default Widget Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  ┌─ Server Status ──────────┐ ┌─ Quick Actions ──┐│
│             │  │ ● Online  │ 192.168.1.100│ │ [⟳ Restart]      ││
│  Overview ●●│  │ TPS: 20.0│ 1.21.4 Paper │ │ [⏹ Stop]         ││
│  Console    │  │ RAM: 4.2G│ Uptime: 3d 2h│ │ [📋 Backup]      ││
│  Players    │  │ CPU: 12% │ 8/20 players │ │ [💬 Say...]       ││
│  Files      │  └──────────┴──────────────┘ └──────────────────┘│
│  Modpacks   │                                                    │
│  Backups    │  ┌─ Player Activity ──────────────────────────────┐│
│  Config     │  │ 📊 Peak: 14 players (2h ago)                  ││
│  Scheduler  │  │ [mini line chart of player count over 24h]     ││
│  Events     │  └────────────────────────────────────────────────┘│
│  Settings   │                                                    │
│             │  ┌─ Online Players ──────┐ ┌─ Recent Events ─────┐│
│             │  │ 👤 Steve     OP  12h  │ │ 10:30 Player joined ││
│             │  │ 👤 Alex          45m  │ │ 10:28 Backup created││
│             │  │ 👤 Notch         2m   │ │ 10:15 Config changed││
│             │  │ ...                    │ │ 09:00 Server started││
│             │  └───────────────────────┘ └─────────────────────┘│
│             │                                                    │
│             │  ┌─ Installed Modpack ────────────────────────────┐│
│             │  │ 🔧 All The Mods 10 (v1.2.3) — Forge 1.21.4   ││
│             │  │ 142 mods loaded │ Last updated: 3 days ago     ││
│             │  └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Overview Widgets (all movable/resizable):**

| Widget ID          | Default Size | Content                                        |
|--------------------|-------------|------------------------------------------------|
| `server-status`    | 2x1         | Status indicator, IP, version, TPS, RAM, CPU   |
| `quick-actions`    | 1x1         | Start/Stop/Restart/Backup/Say buttons          |
| `player-chart`     | 3x1         | 24h player count sparkline                     |
| `online-players`   | 1x2         | List of online players with session time        |
| `recent-events`    | 1x2         | Last 10 server events from mcServerEvents      |
| `installed-modpack`| 2x1         | Current modpack info or "Vanilla" indicator     |
| `console-preview`  | 3x1         | Last 5 console lines (click to go to console)  |
| `disk-usage`       | 1x1         | Pie chart of disk usage by category             |
| `performance`      | 2x1         | TPS history chart (last 1h)                     |
| `world-info`       | 1x1         | World name, seed, size, age                     |

#### 7.3 Console Page (`/server/console/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Console                                     🔍 ⚙ │
│             │  ┌─ Filters ────────────────────────────────────┐ │
│             │  │ [All] [INFO] [WARN] [ERROR] [Chat] [⬇ Auto] │ │
│             │  └──────────────────────────────────────────────┘ │
│             │  ┌──────────────────────────────────────────────┐ │
│             │  │ [10:30:01] [Server thread/INFO]: Steve join..│ │
│             │  │ [10:30:05] [Server thread/INFO]: Steve has ..│ │
│             │  │ [10:31:12] [Server thread/WARN]: Can't keep.│ │
│             │  │ [10:31:12] [Server thread/INFO]: <Alex> hel.│ │
│             │  │ ...                                          │ │
│             │  │                                              │ │
│             │  │                                              │ │
│             │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
│             │  └──────────────────────────────────────────────┘ │
│             │  ┌──────────────────────────────────────────────┐ │
│             │  │ > /say Hello everyone!              [Send ⏎] │ │
│             │  └──────────────────────────────────────────────┘ │
│             │  Command history: ↑/↓ │ Autocomplete: Tab        │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **SSE-powered real-time log stream** (uses EventSource in browser)
- **Log level filtering**: ALL, INFO, WARN, ERROR, Chat-only
- **Text search** (Ctrl+F or search icon) — filters visible lines
- **Auto-scroll toggle** — locks to bottom when enabled
- **Command input** with:
  - History navigation (up/down arrows)
  - Tab autocomplete for common commands
  - Command validation (blocks dangerous commands based on role)
  - Slash prefix optional (auto-prepended)
- **Copy line** — click to copy individual log line
- **Timestamp toggle** — show/hide timestamps
- **Font size** — adjustable via settings or Ctrl+/Ctrl-
- **Color coding**: INFO=white, WARN=yellow, ERROR=red, Chat=green
- **Console font**: `JetBrains Mono` (matches `--font-mono`)
- **Max lines**: Configurable (default 500), older lines pruned from DOM

#### 7.4 Players Page (`/server/players/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Players                                           │
│             │                                                    │
│             │  ┌─ Online (8/20) ─────────────────────────────┐  │
│             │  │ 🟢 Steve      │ OP │ 12h 3m  │ [Kick] [Ban]│  │
│             │  │ 🟢 Alex       │    │ 45m     │ [Kick] [Ban]│  │
│             │  │ 🟢 Notch      │    │ 2m      │ [Kick] [Ban]│  │
│             │  │ ...                                          │  │
│             │  └──────────────────────────────────────────────┘  │
│             │                                                    │
│             │  ┌─ Whitelist ─────────────────────────────────┐  │
│             │  │ [+ Add Player]               Enabled: [✓]   │  │
│             │  │ Steve, Alex, Notch, jeb_, Dinnerbone, ...   │  │
│             │  │ (click to remove)                            │  │
│             │  └──────────────────────────────────────────────┘  │
│             │                                                    │
│             │  ┌─ Banned Players ─────────────────────────────┐ │
│             │  │ Griefer123 — Reason: "Griefing" │ [Unban]    │ │
│             │  │ HackerX    — Reason: "Hacking"  │ [Unban]    │ │
│             │  └──────────────────────────────────────────────┘ │
│             │                                                    │
│             │  ┌─ Operators ─────────────────────────────────┐  │
│             │  │ [+ Add OP]                                   │  │
│             │  │ Steve (Level 4) │ [Remove]                   │  │
│             │  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Online player list** with:
  - Player skin head (via `https://mc-heads.net/avatar/{username}/32`)
  - Session duration
  - OP badge
  - Kick/Ban actions (with reason modal and confirmation)
- **Whitelist management**:
  - Toggle whitelist on/off (modifies `server.properties`)
  - Add player by username (input with debounced Mojang API validation)
  - Remove with single click + confirmation
- **Ban list** with unban capability
- **OP list** with promote/demote
- All actions require minimum `operator` role
- All actions log to `mcServerEvents`

#### 7.5 File Browser (`/server/files/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Files                                             │
│             │  📁 /opt/minecraft/                                │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │ Path: / > world > datapacks      [↑] [🔄]  │   │
│             │  ├─────────────────────────────────────────────┤   │
│             │  │ 📁 ..                                        │   │
│             │  │ 📁 advancements/         2.3 MB   Feb 10   │   │
│             │  │ 📁 data/                 145 MB   Feb 09   │   │
│             │  │ 📄 level.dat             4.2 KB   Feb 10   │   │
│             │  │ 📄 level.dat_old         4.2 KB   Feb 09   │   │
│             │  │ ...                                          │   │
│             │  └─────────────────────────────────────────────┘   │
│             │                                                    │
│             │  Actions: [📁 New Folder] [📤 Upload] [📄 New File]│
│             │                                                    │
│             │  ┌─ Editor (level.dat is binary) ──────────────┐  │
│             │  │ Binary file — cannot edit in browser         │  │
│             │  │ [Download]                                   │  │
│             │  └─────────────────────────────────────────────┘  │
│             │                                                    │
│             │  ┌─ Editor (server.properties) ─────────────────┐ │
│             │  │ # Minecraft server properties                │  │
│             │  │ server-port=25565                             │  │
│             │  │ motd=\u00a7bNxrthStack Server               │  │
│             │  │ ...                                          │  │
│             │  │                        [Save] [Revert]       │  │
│             │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Directory listing** with:
  - Icon by type (folder, .jar, .json, .properties, .yml, .log, .dat, etc.)
  - File size (human readable)
  - Last modified date
  - Breadcrumb path navigation
- **File editor** with:
  - Syntax highlighting for: `.json`, `.yml`, `.yaml`, `.properties`, `.toml`, `.cfg`, `.txt`, `.log`
  - Read-only mode for Viewer/Operator roles
  - Save with confirmation (creates backup of original)
  - Revert to last saved version
  - Line numbers
  - Word wrap toggle
  - Monaco Editor (lightweight — `@monaco-editor/react`)
- **Upload**: Drag-and-drop zone or file picker (max 50MB per file via agent)
- **Download**: Any file as direct download stream
- **Delete**: With "type filename to confirm" pattern for safety
- **New Folder/File**: With name validation (no path traversal)
- **Sandbox**: Agent rejects any path outside `/opt/minecraft/`
- **Protected files**: `eula.txt` and `server.jar` cannot be deleted

#### 7.6 Modpacks Page (`/server/modpacks/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Modpacks                                          │
│             │                                                    │
│             │  ┌─ Currently Installed ────────────────────────┐  │
│             │  │ 🔧 All The Mods 10 v1.2.3                   │  │
│             │  │ Forge 1.21.4 │ 142 mods │ Installed Feb 8   │  │
│             │  │ [Update Available: v1.3.0] [Uninstall]       │  │
│             │  └──────────────────────────────────────────────┘  │
│             │                                                    │
│             │  ┌─ Browse CurseForge ──────────────────────────┐ │
│             │  │ 🔍 [Search modpacks...              ]        │ │
│             │  │ Version: [1.21.4 ▾] Loader: [Any ▾]         │ │
│             │  │ Sort: [Popularity ▾]                          │ │
│             │  ├──────────────────────────────────────────────┤ │
│             │  │ ┌────┐ All The Mods 10                       │ │
│             │  │ │ 📦 │ The ultimate kitchen sink modpack     │ │
│             │  │ │    │ ⬇ 2.4M downloads │ Forge 1.21.4      │ │
│             │  │ └────┘                         [Install →]   │ │
│             │  │                                              │ │
│             │  │ ┌────┐ Better MC [Fabric] 1.21.4             │ │
│             │  │ │ 📦 │ Enhanced vanilla+ experience          │ │
│             │  │ │    │ ⬇ 8.1M downloads │ Fabric 1.21.4     │ │
│             │  │ └────┘                         [Install →]   │ │
│             │  │                                              │ │
│             │  │ ┌────┐ RLCraft 2                             │ │
│             │  │ │ 📦 │ Hardcore survival modpack             │ │
│             │  │ │    │ ⬇ 15.2M downloads │ Forge 1.20.1     │ │
│             │  │ └────┘                         [Install →]   │ │
│             │  │                                              │ │
│             │  │ [1] [2] [3] ... [12]  (pagination)          │ │
│             │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Modpack Detail Page (`/server/modpacks/[modId]/page.tsx`):**

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  ← Back to Modpacks                                │
│             │                                                    │
│             │  ┌────────────────────────────────────────────────┐│
│             │  │ 📦 All The Mods 10                             ││
│             │  │                                                ││
│             │  │ [Screenshot carousel / gallery]                ││
│             │  │                                                ││
│             │  │ By: ATM Team │ 2.4M downloads │ Updated: Feb 5 ││
│             │  │ Forge 1.21.4 │ 312 mods                       ││
│             │  │                                                ││
│             │  │ ┌─ Description ──────────────────────────────┐ ││
│             │  │ │ (Rendered HTML/markdown from CurseForge)   │ ││
│             │  │ │ All The Mods 10 is the ultimate modded     │ ││
│             │  │ │ Minecraft experience featuring 312 mods... │ ││
│             │  │ └────────────────────────────────────────────┘ ││
│             │  │                                                ││
│             │  │ ┌─ Versions ────────────────────────────────┐  ││
│             │  │ │ v1.3.0 — Feb 5, 2026  │ 245MB │ [Install]│  ││
│             │  │ │ v1.2.3 — Jan 20, 2026 │ 240MB │ [Install]│  ││
│             │  │ │ v1.2.0 — Jan 5, 2026  │ 238MB │ [Install]│  ││
│             │  │ └────────────────────────────────────────────┘ ││
│             │  │                                                ││
│             │  │ ┌─ System Requirements ──────────────────────┐ ││
│             │  │ │ Recommended RAM: 8GB │ Disk: ~2GB          │ ││
│             │  │ │ Java: 21+ │ Mod Loader: Forge 49.x        │ ││
│             │  │ └────────────────────────────────────────────┘ ││
│             │  └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **CurseForge search** with:
  - Debounced search (300ms)
  - Minecraft version filter dropdown
  - Mod loader filter (Any, Forge, Fabric, NeoForge)
  - Sort: Popularity, Downloads, Last Updated, Name
  - Paginated results (20 per page)
  - Modpack card with logo, name, description snippet, download count, loader badge
- **Currently Installed** banner:
  - Shows current modpack name, version, loader
  - Update check against CurseForge latest files
  - One-click update (same flow as install, preserves world)
  - Uninstall button (reverts to vanilla Paper, keeps world)
- **Install flow**: Full progress modal with SSE-streamed updates (see Section 6)
- **Detail page**: Full CurseForge modpack info with:
  - Screenshot gallery (carousel)
  - HTML description rendered safely (DOMPurify)
  - Version picker with file sizes
  - System requirements estimate

#### 7.7 Backups Page (`/server/backups/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Backups                                           │
│             │  [+ Create Backup ▾]  Full │ World Only            │
│             │                                                    │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │ 📦 Full Backup                     Feb 10   │   │
│             │  │    "Pre-modpack install"                     │   │
│             │  │    Size: 1.2 GB │ Auto │ [Restore] [⬇] [🗑] │   │
│             │  ├─────────────────────────────────────────────┤   │
│             │  │ 📦 World Only                      Feb 09   │   │
│             │  │    "Daily auto-backup"                       │   │
│             │  │    Size: 890 MB │ Scheduled │ [Restore] [⬇]  │   │
│             │  ├─────────────────────────────────────────────┤   │
│             │  │ 📦 Full Backup                     Feb 08   │   │
│             │  │    "Before update ATM10 v1.2→v1.3"          │   │
│             │  │    Size: 1.1 GB │ Manual │ [Restore] [⬇] [🗑]│   │
│             │  └─────────────────────────────────────────────┘   │
│             │                                                    │
│             │  Storage: 4.2 GB used / 50 GB allocated            │
│             │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░  8.4%         │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Create backup** with:
  - Type: Full (everything) or World Only (world/ directory)
  - Optional label/description
  - Runs `save-all` + `save-off`, copies files, runs `save-on`
  - Progress indicator
- **Restore** with triple confirmation:
  1. "This will stop the server and replace current files"
  2. "Create backup of current state before restoring?" (auto-checked)
  3. "Type RESTORE to confirm"
- **Download**: Stream backup .tar.gz to browser
- **Delete**: With confirmation dialog
- **Storage meter**: Visual disk usage indicator
- **Labels**: Auto-generated ("Pre-modpack install") or manual
- **Origin tags**: Manual, Scheduled, Auto (pre-modpack-install)

#### 7.8 Config Page (`/server/config/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Configuration                                     │
│             │                                                    │
│             │  ┌─ server.properties ──────────────────────────┐  │
│             │  │ Form-based editor (NOT raw text):            │  │
│             │  │                                              │  │
│             │  │ Server Name (motd)                           │  │
│             │  │ ┌──────────────────────────────────┐        │  │
│             │  │ │ §b§lNxrthStack §7MC Server       │        │  │
│             │  │ └──────────────────────────────────┘        │  │
│             │  │ Preview: NxrthStack MC Server                │  │
│             │  │                                              │  │
│             │  │ Game Mode         Difficulty                 │  │
│             │  │ [Survival ▾]      [Normal ▾]                │  │
│             │  │                                              │  │
│             │  │ Max Players       View Distance              │  │
│             │  │ [20        ]      [12    ] chunks           │  │
│             │  │                                              │  │
│             │  │ Port              Whitelist                  │  │
│             │  │ [25565     ]      [✓] Enabled               │  │
│             │  │                                              │  │
│             │  │ Online Mode  PvP       Command Blocks        │  │
│             │  │ [✓]          [✓]       [✓]                   │  │
│             │  │                                              │  │
│             │  │ [Show Advanced ▾]                            │  │
│             │  │ (spawn-protection, simulation-distance, etc.)│  │
│             │  │                                              │  │
│             │  │                  [Save & Restart] [Save]     │  │
│             │  └──────────────────────────────────────────────┘  │
│             │                                                    │
│             │  ┌─ JVM Arguments ──────────────────────────────┐  │
│             │  │ Memory (RAM)                                 │  │
│             │  │ Min: [4  ] GB    Max: [8  ] GB               │  │
│             │  │                                              │  │
│             │  │ Garbage Collector: [G1GC ▾]                  │  │
│             │  │ [✓] Use Aikar's Flags (recommended)          │  │
│             │  │                                              │  │
│             │  │ Raw JVM args (advanced):                     │  │
│             │  │ ┌──────────────────────────────────┐        │  │
│             │  │ │ -XX:+UseG1GC -XX:+ParallelRef...│         │  │
│             │  │ └──────────────────────────────────┘        │  │
│             │  │                          [Save & Restart]    │  │
│             │  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Form-based editor** for `server.properties`:
  - Human-readable labels for every property
  - Input type per property (text, number, toggle, select dropdown)
  - Validation (port range, view distance limits, etc.)
  - MOTD preview with Minecraft formatting codes
  - "Show Advanced" collapsible section for rarely-changed values
  - Tooltip help text explaining each property
- **JVM argument editor**:
  - RAM sliders with min/max
  - GC preset selector (G1GC, ZGC, Shenandoah)
  - Aikar's Flags toggle (auto-applies optimized flags)
  - Raw text area for advanced users
- **Save** saves without restart (takes effect next restart)
- **Save & Restart** saves then triggers immediate restart
- All saves create a backup of the previous config file
- Changes logged to `mcServerEvents`

#### 7.9 Scheduler Page (`/server/scheduler/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Scheduler                                         │
│             │  [+ New Task]                                      │
│             │                                                    │
│             │  ┌─ Active Tasks ──────────────────────────────┐   │
│             │  │ 🔄 Daily Restart                            │   │
│             │  │    Every day at 04:00 │ Next: Feb 11, 04:00 │   │
│             │  │    [Edit] [Disable] [Delete]                │   │
│             │  ├─────────────────────────────────────────────┤   │
│             │  │ 💾 Auto Backup (World)                      │   │
│             │  │    Every 6 hours │ Next: Feb 10, 16:00      │   │
│             │  │    Keep last 5 │ [Edit] [Disable] [Delete]  │   │
│             │  ├─────────────────────────────────────────────┤   │
│             │  │ 📢 Restart Warning                          │   │
│             │  │    Every day at 03:55 │ Next: Feb 11, 03:55 │   │
│             │  │    "say Server restarting in 5 minutes!"    │   │
│             │  │    [Edit] [Disable] [Delete]                │   │
│             │  └─────────────────────────────────────────────┘   │
│             │                                                    │
│             │  ┌─ Disabled Tasks ────────────────────────────┐   │
│             │  │ 🔇 Hourly Announcement (disabled)           │   │
│             │  │    [Enable] [Delete]                         │   │
│             │  └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Task Creation Modal:**
- Task type: Restart, Backup, Command, Announcement
- Schedule builder (human-friendly):
  - Presets: "Every day at...", "Every X hours", "Every week on..."
  - Advanced: raw cron expression input
  - Visual next-5-runs preview
- For Backup: choose Full/World-only, retention count
- For Command: command input with validation
- For Announcement: message with countdown option (warns players X minutes before restart)

#### 7.10 Events Page (`/server/events/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Event Log                                         │
│             │  Filter: [All ▾] [Today ▾] [All Users ▾]          │
│             │                                                    │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │ 🔧 modpack.install                Feb 10    │   │
│             │  │    sweber installed "All The Mods 10 v1.3"  │   │
│             │  │                                              │   │
│             │  │ 💾 backup.create                  Feb 10    │   │
│             │  │    System: Auto pre-install backup           │   │
│             │  │                                              │   │
│             │  │ ⚙️ config.changed                 Feb 09    │   │
│             │  │    sweber changed max-players: 20→30        │   │
│             │  │                                              │   │
│             │  │ 🔄 server.restart                 Feb 09    │   │
│             │  │    sweber triggered manual restart           │   │
│             │  │                                              │   │
│             │  │ 🔑 access.granted                 Feb 08    │   │
│             │  │    sweber granted Alex role: operator        │   │
│             │  └─────────────────────────────────────────────┘   │
│             │  [Load More]                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Audit trail** for all server actions
- **Filters**: Event type, date range, actor (user)
- **Metadata expansion**: Click event to see full JSON metadata
- **Pagination**: Infinite scroll or "Load More"
- Serves as the security/accountability log

#### 7.11 Settings Page (`/server/settings/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  MC Sidebar │  Dashboard Settings                                │
│             │                                                    │
│             │  ┌─ Theme ─────────────────────────────────────┐   │
│             │  │ [● GameHub] [○ Minecraft] [○ Nether]        │   │
│             │  │ [○ End]     [○ Custom]                       │   │
│             │  │                                              │   │
│             │  │ Custom Accent: [#00ff00] [🎨]               │   │
│             │  │ Preview: ████████████████                    │   │
│             │  └──────────────────────────────────────────────┘   │
│             │                                                    │
│             │  ┌─ Layout ────────────────────────────────────┐   │
│             │  │ Sidebar: [● Left] [○ Right]                 │   │
│             │  │ Compact Mode: [  ] (smaller widgets)        │   │
│             │  │ [Reset All Layouts to Default]               │   │
│             │  └──────────────────────────────────────────────┘   │
│             │                                                    │
│             │  ┌─ Console ───────────────────────────────────┐   │
│             │  │ Font Size: [14] px                           │   │
│             │  │ Max Lines: [500]                             │   │
│             │  │ Show Timestamps: [✓]                         │   │
│             │  │ Default Filter: [All ▾]                      │   │
│             │  └──────────────────────────────────────────────┘   │
│             │                                                    │
│             │  ┌─ Overview Widgets ───────────────────────────┐  │
│             │  │ Toggle which widgets appear on Overview:     │  │
│             │  │ [✓] Server Status    [✓] Quick Actions       │  │
│             │  │ [✓] Player Chart     [✓] Online Players      │  │
│             │  │ [✓] Recent Events    [✓] Installed Modpack   │  │
│             │  │ [  ] Console Preview [  ] Disk Usage         │  │
│             │  │ [  ] Performance     [  ] World Info          │  │
│             │  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Customizable Layout System

### Technology

Use `react-grid-layout` for drag-and-drop widget repositioning:

```
npm install react-grid-layout @types/react-grid-layout
```

### Layout Data Model

```typescript
interface WidgetLayout {
  widgetId: string;    // "server-status", "quick-actions", etc.
  x: number;           // Grid column (0-based)
  y: number;           // Grid row (0-based)
  w: number;           // Width in grid units
  h: number;           // Height in grid units
  minW?: number;       // Minimum width
  minH?: number;       // Minimum height
  maxW?: number;       // Maximum width
  maxH?: number;       // Maximum height
  collapsed?: boolean; // Widget minimized to header only
  visible?: boolean;   // Whether widget is shown (default true)
}

// Stored per-user per-page in mcDashboardLayouts.layout (JSONB)
```

### Grid Configuration

```typescript
// Dashboard grid settings
const GRID_CONFIG = {
  cols: { lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 },
  rowHeight: 80,
  margin: [16, 16],
  containerPadding: [0, 0],
  compactType: "vertical",
  isDraggable: true,
  isResizable: true,
};
```

### Default Layouts per Page

Each page has a default layout that serves as the starting point. Users can:

1. **Drag widgets** to reposition
2. **Resize widgets** via corner handles
3. **Collapse widgets** to header-only (click minimize icon)
4. **Toggle widget visibility** in settings
5. **Reset to default** via settings page

Layout changes are **auto-saved** with 500ms debounce after any drag/resize action:

```typescript
// Auto-save layout on change
const handleLayoutChange = useDebouncedCallback(
  async (layout: WidgetLayout[]) => {
    await fetch("/api/gamehub/minecraft/server/layout", {
      method: "PUT",
      body: JSON.stringify({ page: currentPage, layout }),
    });
  },
  500
);
```

### Responsive Behavior

- **Desktop** (lg, 12 cols): Full grid layout as designed
- **Tablet** (md, 8 cols): Widgets reflow to narrower grid
- **Mobile** (sm/xs, 4/2 cols): Single-column stack, dragging disabled
- Layout is stored per breakpoint if user customizes at different sizes

---

## 9. Design System & Theming

### Base Theme: GameHub Default

The Minecraft Dashboard inherits the existing GameHub design system:

```css
/* Inherited from globals.css */
--background     /* Dark background */
--foreground     /* Light text */
--card           /* Card surfaces */
--border         /* Borders */
--primary        /* Purple accent (GameHub default) */
--muted          /* Muted text/backgrounds */
--accent         /* Light accent */
```

### MC Dashboard Theme Variants

```typescript
const MC_THEMES = {
  gamehub: {
    // Default — uses existing CSS variables unchanged
    label: "GameHub",
    accent: "hsl(262, 80%, 55%)",   // Purple
    icon: "🎮",
  },
  minecraft: {
    label: "Minecraft",
    accent: "hsl(120, 60%, 45%)",   // Emerald green
    accentForeground: "#ffffff",
    sidebarAccent: "hsl(120, 40%, 20%)",
    icon: "⛏️",
    // Subtle grass-green tint on borders and active states
  },
  nether: {
    label: "Nether",
    accent: "hsl(15, 80%, 50%)",    // Lava orange-red
    accentForeground: "#ffffff",
    sidebarAccent: "hsl(0, 60%, 15%)",
    icon: "🔥",
    // Dark red tones, fire-inspired
  },
  end: {
    label: "The End",
    accent: "hsl(280, 60%, 55%)",   // End purple
    accentForeground: "#ffffff",
    sidebarAccent: "hsl(270, 30%, 12%)",
    icon: "🐉",
    // Deep purple/black, enderman-inspired
  },
  custom: {
    label: "Custom",
    // User picks accent color via color picker
    // All derived colors computed from the single accent
    icon: "🎨",
  },
};
```

### Theme Application

```typescript
// components/minecraft/mc-theme-provider.tsx

"use client";

import { useEffect } from "react";
import { useMcPreferences } from "@/hooks/use-mc-preferences";

export function McThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = useMcPreferences();

  useEffect(() => {
    const root = document.documentElement;
    const theme = MC_THEMES[preferences.theme] || MC_THEMES.gamehub;

    if (preferences.theme === "custom" && preferences.accentColor) {
      root.style.setProperty("--mc-accent", preferences.accentColor);
    } else if (theme.accent) {
      root.style.setProperty("--mc-accent", theme.accent);
    } else {
      root.style.removeProperty("--mc-accent");
    }

    // Set sidebar variant
    if (theme.sidebarAccent) {
      root.style.setProperty("--mc-sidebar-accent", theme.sidebarAccent);
    }
  }, [preferences]);

  return <>{children}</>;
}
```

CSS usage in MC Dashboard components:

```css
/* Only within MC dashboard scope */
.mc-dashboard {
  --active-accent: var(--mc-accent, var(--primary));
}

.mc-dashboard .mc-sidebar-item.active {
  background: oklch(from var(--active-accent) l c h / 0.15);
  color: var(--active-accent);
  border-left: 3px solid var(--active-accent);
}

.mc-dashboard .mc-badge-online {
  background: hsl(120, 60%, 45%);  /* Always green regardless of theme */
}
```

### Component Design Patterns

All MC Dashboard components follow existing GameHub conventions:

**Card:**
```tsx
<div className="rounded-xl border border-border bg-card p-4 hover:border-[var(--mc-accent,var(--primary))]/50 transition-colors">
  {/* content */}
</div>
```

**Section Header:**
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--mc-accent,var(--primary))]/10 text-[var(--mc-accent,var(--primary))]">
    <Icon className="h-5 w-5" />
  </div>
  <div>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
</div>
```

**Status Badge:**
```tsx
// Online
<span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
  Online
</span>

// Offline
<span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
  Offline
</span>
```

**Action Button:**
```tsx
// Primary action
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="rounded-lg bg-[var(--mc-accent,var(--primary))] px-4 py-2 text-sm font-medium text-white"
>
  {label}
</motion.button>

// Destructive action
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20"
>
  {label}
</motion.button>
```

### Typography in MC Dashboard

| Element           | Class                                              |
|-------------------|----------------------------------------------------|
| Page title        | `text-2xl font-bold` (with `GradientText` wrapper) |
| Section heading   | `text-lg font-semibold`                            |
| Widget title      | `text-sm font-medium`                              |
| Body text         | `text-sm text-muted-foreground`                    |
| Console text      | `font-mono text-sm` (JetBrains Mono)              |
| Stat value        | `text-2xl font-bold tabular-nums`                  |
| Stat label        | `text-xs text-muted-foreground uppercase tracking-wide` |

### Animation Standards

All animations use `framer-motion` (imported as `motion`) matching GameHub:

```tsx
// Page entrance
<FadeIn delay={0}>
  <h1>Page Title</h1>
</FadeIn>
<FadeIn delay={0.1}>
  <section>...</section>
</FadeIn>

// Widget entrance (staggered)
<StaggerContainer>
  {widgets.map(widget => (
    <StaggerItem key={widget.id}>
      <WidgetComponent />
    </StaggerItem>
  ))}
</StaggerContainer>

// Interactive elements
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
  ...
</motion.div>

// Status transitions
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
/>
```

---

## 10. Discord Bot Integration

### New Bot Commands

Add to `nxrthstack-bot/src/commands/minecraft/`:

```
commands/minecraft/
├── server.ts      # /mc server — Show server status
├── players.ts     # /mc players — List online players
├── whitelist.ts   # /mc whitelist add/remove — Manage whitelist
└── ip.ts          # /mc ip — Show connection info
```

**`/mc server`** — Shows server status embed:
```
┌─────────────────────────────────────────┐
│ ⛏️ NxrthStack Minecraft Server          │
│                                         │
│ Status: 🟢 Online                       │
│ Players: 8/20                           │
│ TPS: 19.8                               │
│ Version: Paper 1.21.4                   │
│ Modpack: All The Mods 10 v1.3.0        │
│ Uptime: 3d 2h 15m                      │
│                                         │
│ 🔗 Connect: mc.sweber.dev              │
│ 🌐 Dashboard: nxrthstack.sweber.dev/   │
│    dashboard/gamehub/minecraft/server   │
└─────────────────────────────────────────┘
```

**`/mc players`** — Lists online players with join time.

**`/mc whitelist add <username>`** — Adds player to whitelist via agent API.

### Webhook Events (Website → Bot)

Add new event types to the bot's webhook handler:

```typescript
// New MC events in src/api/server.ts
case "mc.server.start":
  // Broadcast: "Server is now online!"
  break;
case "mc.server.stop":
  // Broadcast: "Server is now offline"
  break;
case "mc.modpack.install":
  // Broadcast: "Modpack X v1.2.3 installed by User"
  break;
case "mc.player.join":
  // Broadcast: "Player joined (8/20 online)"
  break;
case "mc.player.leave":
  // Broadcast: "Player left (7/20 online)"
  break;
```

### Webhook Config Extension

Add `'minecraft'` to the `webhookConfigs` event types so admins can configure which Discord channel receives MC notifications:

```typescript
// webhookConfigs.eventType now also accepts: 'minecraft'
```

### Bot → Agent Communication

The bot can also call the server agent directly (for `/mc whitelist` etc.):

```typescript
// nxrthstack-bot/src/services/minecraft.ts
const MC_AGENT_URL = process.env.MC_AGENT_URL;
const MC_AGENT_SECRET = process.env.MC_AGENT_SECRET;

export async function getServerStatus() {
  const res = await fetch(`${MC_AGENT_URL}/status`, {
    headers: { "X-MC-Agent-Secret": MC_AGENT_SECRET! },
  });
  return res.json();
}

export async function addToWhitelist(username: string) {
  const res = await fetch(`${MC_AGENT_URL}/players/whitelist`, {
    method: "POST",
    headers: {
      "X-MC-Agent-Secret": MC_AGENT_SECRET!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  return res.json();
}
```

Add to bot `.env`:

```
MC_AGENT_URL=https://mc-api.sweber.dev
MC_AGENT_SECRET=<same shared secret>
```

---

## 11. Safety & Backup System

### Dummy-Safe Design Principles

Every destructive action in the dashboard follows this safety protocol:

#### 1. Confirmation Levels

| Risk Level | Actions | Confirmation |
|------------|---------|-------------|
| **Low**    | Send chat command, view files | None (instant) |
| **Medium** | Kick player, add to whitelist, edit config | Single confirmation modal |
| **High**   | Restart server, install modpack, restore backup | Double confirmation (modal + checkbox "I understand") |
| **Critical**| Stop server, delete world, uninstall modpack | Triple confirmation (modal + checkbox + type action name) |

#### 2. Auto-Backup Before Destructive Actions

These actions **always** create a backup before executing:

- Modpack install/uninstall/update
- Backup restore
- World deletion
- Config file changes (backed up to `config_backups/`)
- Server JAR replacement

#### 3. Command Safety

```typescript
// Commands are validated before reaching the server

// BLOCKED (never sent via RCON, even for admin):
const ALWAYS_BLOCKED = ["stop", "restart"]; // Must use dashboard buttons (which create backups)

// ROLE-GATED:
// Operator: only commands in OPERATOR_COMMANDS list
// Manager: all commands except ALWAYS_BLOCKED
// Admin: all commands except ALWAYS_BLOCKED

// DANGEROUS (require confirmation modal):
const DANGEROUS_COMMANDS = [
  /^(kill|clear)\s/,              // Kills entities/clears inventories
  /^(fill|clone|setblock)\s/,     // World modification
  /^(ban|ban-ip)\s/,              // Player bans
  /^gamerule\s/,                  // Rule changes
  /^difficulty\s/,                // Difficulty changes
  /^defaultgamemode\s/,           // Default gamemode changes
];
```

#### 4. Undo System

- Config changes: Automatic backup stored at `/opt/minecraft/config_backups/` with timestamps
- Modpack installs: Pre-install backup always available in backup list
- Player management: Ban/unban and whitelist actions logged with one-click reversal

#### 5. Rate Limiting

```typescript
// Server-side rate limits on the agent
const RATE_LIMITS = {
  "server.start":   { window: 60_000, max: 2 },   // 2 starts per minute
  "server.stop":    { window: 60_000, max: 2 },
  "server.restart": { window: 300_000, max: 3 },   // 3 restarts per 5 min
  "backup.create":  { window: 600_000, max: 3 },   // 3 backups per 10 min
  "modpack.install":{ window: 600_000, max: 1 },   // 1 install per 10 min
  "console.command":{ window: 1_000, max: 5 },     // 5 commands per second
};
```

---

## 12. Real-Time Communication

### SSE (Server-Sent Events) Architecture

```
Browser (EventSource) ←── Vercel API Route (proxy) ←── Server Agent (SSE source)
```

#### Console Stream

```typescript
// Client-side hook
function useConsoleStream() {
  const [lines, setLines] = useState<ConsoleLine[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/gamehub/minecraft/server/console/stream");

    source.onmessage = (event) => {
      const line: ConsoleLine = JSON.parse(event.data);
      setLines((prev) => {
        const next = [...prev, line];
        // Trim to max lines
        return next.length > maxLines ? next.slice(-maxLines) : next;
      });
    };

    source.onerror = () => {
      // Auto-reconnect is built into EventSource
      // Show "Reconnecting..." indicator
    };

    return () => source.close();
  }, []);

  return lines;
}
```

#### Install Progress Stream

```typescript
// Client-side hook for modpack installation
function useInstallProgress() {
  const [progress, setProgress] = useState<InstallProgressEvent | null>(null);

  function startListening() {
    const source = new EventSource("/api/gamehub/minecraft/server/modpacks/progress");

    source.onmessage = (event) => {
      const data: InstallProgressEvent = JSON.parse(event.data);
      setProgress(data);

      if (data.progress === 100 || data.error) {
        source.close();
      }
    };

    return () => source.close();
  }

  return { progress, startListening };
}
```

#### Vercel SSE Proxy Route

```typescript
// /api/gamehub/minecraft/server/console/stream/route.ts
// Vercel supports streaming responses via Web Streams API

export async function GET() {
  // Auth check...

  const agentResponse = await fetch(`${MC_AGENT_URL}/console/stream`, {
    headers: { "X-MC-Agent-Secret": MC_AGENT_SECRET },
  });

  // Proxy the SSE stream directly
  return new Response(agentResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Polling Fallback

For data that doesn't need real-time updates, use SWR polling:

```typescript
// Server status — poll every 10 seconds
const { data: status } = useSWR("/api/gamehub/minecraft/server/status", fetcher, {
  refreshInterval: 10_000,
});

// Player list — poll every 15 seconds
const { data: players } = useSWR("/api/gamehub/minecraft/server/players", fetcher, {
  refreshInterval: 15_000,
});
```

---

## 13. File Structure

### Website (Next.js) — New Files

```
nxrthstack/
├── app/(dashboard)/dashboard/gamehub/minecraft/server/
│   ├── page.tsx                         # Access gate / Overview
│   ├── layout.tsx                       # MC dashboard layout (sidebar, theme)
│   ├── console/page.tsx
│   ├── players/page.tsx
│   ├── files/page.tsx
│   ├── modpacks/page.tsx
│   ├── modpacks/[modId]/page.tsx
│   ├── backups/page.tsx
│   ├── config/page.tsx
│   ├── scheduler/page.tsx
│   ├── events/page.tsx
│   └── settings/page.tsx
│
├── app/api/gamehub/minecraft/server/
│   ├── access/route.ts
│   ├── access/validate/route.ts
│   ├── status/route.ts
│   ├── console/route.ts
│   ├── console/stream/route.ts
│   ├── players/route.ts
│   ├── players/kick/route.ts
│   ├── players/ban/route.ts
│   ├── players/whitelist/route.ts
│   ├── players/ops/route.ts
│   ├── files/route.ts
│   ├── files/read/route.ts
│   ├── files/write/route.ts
│   ├── files/delete/route.ts
│   ├── config/properties/route.ts
│   ├── config/java/route.ts
│   ├── backups/route.ts
│   ├── backups/[id]/route.ts
│   ├── backups/restore/route.ts
│   ├── modpacks/route.ts
│   ├── modpacks/search/route.ts
│   ├── modpacks/install/route.ts
│   ├── modpacks/uninstall/route.ts
│   ├── modpacks/progress/route.ts
│   ├── scheduler/route.ts
│   ├── events/route.ts
│   ├── layout/route.ts
│   └── preferences/route.ts
│
├── app/(admin)/admin/gamehub/minecraft/
│   └── page.tsx                         # Admin: manage access codes + user roles
│
├── components/minecraft/
│   ├── mc-theme-provider.tsx            # Theme context provider
│   ├── mc-sidebar.tsx                   # Dashboard sidebar navigation
│   ├── mc-access-gate.tsx               # Access code entry form
│   ├── mc-server-status.tsx             # Status widget
│   ├── mc-quick-actions.tsx             # Start/Stop/Restart buttons
│   ├── mc-console.tsx                   # Live console with SSE
│   ├── mc-console-input.tsx             # Command input with history
│   ├── mc-player-list.tsx               # Online player list
│   ├── mc-player-chart.tsx              # Player count chart
│   ├── mc-file-browser.tsx              # File tree + editor
│   ├── mc-file-editor.tsx               # Monaco editor wrapper
│   ├── mc-modpack-browser.tsx           # CurseForge search grid
│   ├── mc-modpack-card.tsx              # Individual modpack card
│   ├── mc-modpack-detail.tsx            # Full modpack info
│   ├── mc-install-progress.tsx          # Installation progress modal
│   ├── mc-backup-list.tsx               # Backup list with actions
│   ├── mc-config-form.tsx               # server.properties form editor
│   ├── mc-jvm-config.tsx                # JVM args editor
│   ├── mc-scheduler-list.tsx            # Scheduled tasks list
│   ├── mc-scheduler-form.tsx            # Create/edit task form
│   ├── mc-event-log.tsx                 # Event/audit log viewer
│   ├── mc-settings-form.tsx             # Dashboard preferences form
│   ├── mc-widget-grid.tsx               # react-grid-layout wrapper
│   ├── mc-confirm-modal.tsx             # Reusable confirmation dialog
│   └── mc-destructive-confirm.tsx       # Type-to-confirm dialog
│
├── hooks/
│   ├── use-mc-access.ts                 # Check user's MC access + role
│   ├── use-mc-preferences.ts            # Dashboard preferences state
│   ├── use-mc-console-stream.ts         # SSE console hook
│   ├── use-mc-install-progress.ts       # SSE install progress hook
│   └── use-mc-layout.ts                 # Grid layout state + persistence
│
├── lib/gamehub/
│   └── minecraft.ts                     # Server-side MC helpers (access checks, agent proxy)
│
└── lib/db/schema.ts                     # + new tables (mcAccessCodes, mcAccessGrants, etc.)
```

### Server Agent (Alpine Linux) — New Project

```
/opt/minecraft-agent/
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs                 # PM2 configuration
├── .env                                 # RCON_PASSWORD, MC_AGENT_SECRET, CURSEFORGE_API_KEY
├── src/
│   ├── index.ts                         # Express server entrypoint
│   ├── middleware/
│   │   ├── auth.ts                      # X-MC-Agent-Secret validation
│   │   └── rate-limit.ts               # Per-endpoint rate limiting
│   ├── routes/
│   │   ├── status.ts                    # GET /status
│   │   ├── control.ts                   # POST /start, /stop, /restart, /kill
│   │   ├── console.ts                   # GET /console/stream, /console/history, POST /console/command
│   │   ├── players.ts                   # All /players/* routes
│   │   ├── files.ts                     # All /files/* routes
│   │   ├── config.ts                    # GET/PUT /config/*
│   │   ├── backups.ts                   # All /backups/* routes
│   │   ├── modpacks.ts                  # All /modpacks/* routes
│   │   └── scheduler.ts                # All /scheduler/* routes
│   ├── services/
│   │   ├── rcon.ts                      # RCON connection pool
│   │   ├── process.ts                   # Minecraft process lifecycle
│   │   ├── file-sandbox.ts             # Path validation + sandboxing
│   │   ├── backup.ts                    # Backup creation/restoration
│   │   ├── curseforge.ts               # CurseForge API client
│   │   ├── modpack-installer.ts        # Full install orchestration
│   │   ├── scheduler.ts                # Cron task runner
│   │   ├── stats.ts                    # TPS/memory/player collectors
│   │   └── webhook.ts                  # Notify website of MC events
│   ├── utils/
│   │   ├── properties-parser.ts        # server.properties read/write
│   │   ├── start-script-parser.ts      # start.sh JVM arg extraction
│   │   └── log-parser.ts              # Minecraft log line parser
│   └── types/
│       ├── curseforge.ts               # CurseForge API types
│       ├── server.ts                   # Server status/config types
│       └── events.ts                   # SSE event types
└── backups/                             # Backup storage directory
```

### Discord Bot — New Files

```
nxrthstack-bot/src/
├── commands/minecraft/
│   ├── server.ts                        # /mc server
│   ├── players.ts                       # /mc players
│   ├── whitelist.ts                     # /mc whitelist add/remove
│   └── ip.ts                           # /mc ip
└── services/
    └── minecraft.ts                     # Agent API client for bot
```

---

## 14. Implementation Phases

### Phase 1: Foundation (Server Agent + Access System)

**Goal:** Server agent running on Alpine Linux, access code gate working.

**Tasks:**
1. Create the `minecraft-agent` Node.js project with Express
2. Implement auth middleware (`X-MC-Agent-Secret`)
3. Implement RCON service (`rcon-client`)
4. Implement process manager (start/stop/restart via `child_process`)
5. Implement `/status` endpoint (running state, TPS via RCON `tps`, memory via `process.memoryUsage()` + RCON)
6. Add `mcAccessCodes`, `mcAccessGrants` tables to schema
7. Run Drizzle migration
8. Build access code gate UI (`mc-access-gate.tsx`)
9. Build `/api/gamehub/minecraft/server/access` route
10. Build MC dashboard layout with sidebar (`layout.tsx`, `mc-sidebar.tsx`)
11. Add Cloudflare Tunnel route: `mc-api.sweber.dev → :3003`
12. Deploy agent via PM2 on Alpine Linux

**Deliverable:** User can enter access code and see server status on overview page.

### Phase 2: Console + Players

**Goal:** Real-time console and player management working.

**Tasks:**
1. Implement console SSE stream on agent (`chokidar` + `/console/stream`)
2. Implement console history endpoint
3. Implement RCON command execution with role-based filtering
4. Build console page UI with SSE hook
5. Implement all player endpoints (list, kick, ban, whitelist, ops)
6. Build players page UI
7. Build command input component with history and autocomplete

**Deliverable:** Users can watch live console, send commands, and manage players.

### Phase 3: File Browser + Config Editor

**Goal:** Browse and edit server files, configure server.properties via form.

**Tasks:**
1. Implement file sandbox service (path validation, traversal prevention)
2. Implement file listing, read, write, delete, upload, download endpoints
3. Build file browser component with breadcrumb navigation
4. Integrate Monaco Editor for file editing
5. Build `server.properties` form-based editor
6. Build JVM argument editor
7. Implement config backup system

**Deliverable:** Users can browse files, edit configs via form or raw editor.

### Phase 4: Backups + Scheduler

**Goal:** Backup management and scheduled tasks working.

**Tasks:**
1. Implement backup creation (tar.gz with `save-all`/`save-off`/`save-on`)
2. Implement backup restoration (with triple confirmation)
3. Implement backup listing, download, deletion
4. Build backup page UI
5. Add `mcScheduledTasks` table
6. Implement cron-based scheduler on agent
7. Build scheduler page UI with task creation form

**Deliverable:** Users can create/restore backups and schedule recurring tasks.

### Phase 5: CurseForge + Modpacks

**Goal:** Browse CurseForge, one-click install modpacks.

**Tasks:**
1. Implement CurseForge API client on agent
2. Build CurseForge search proxy route
3. Implement full modpack installation orchestration (9-step flow)
4. Implement install progress SSE stream
5. Build modpack browser page with search, filters, pagination
6. Build modpack detail page with version picker
7. Build install progress modal with real-time updates
8. Implement modpack uninstall
9. Implement modpack update check

**Deliverable:** Users can browse CurseForge and one-click install modpacks.

### Phase 6: Customizable Layout + Themes

**Goal:** Drag-and-drop widget layout, theme customization.

**Tasks:**
1. Install `react-grid-layout`
2. Add `mcDashboardLayouts`, `mcDashboardPreferences` tables
3. Build widget grid wrapper component
4. Define all overview widgets as grid-compatible components
5. Implement layout persistence (auto-save on drag/resize)
6. Build settings page with theme picker
7. Implement theme provider with CSS variable overrides
8. Build custom color picker for custom theme
9. Implement responsive breakpoint handling

**Deliverable:** Users can rearrange widgets, pick themes, customize their view.

### Phase 7: Discord Integration + Events

**Goal:** Discord bot commands, webhook notifications, audit log.

**Tasks:**
1. Add `mcServerEvents` table
2. Log all actions to events table throughout existing endpoints
3. Build events page with filtering
4. Add `/mc server`, `/mc players`, `/mc whitelist`, `/mc ip` bot commands
5. Add MC event types to bot webhook handler
6. Implement agent → website webhook notifications
7. Add 'minecraft' webhook config type for Discord channel selection

**Deliverable:** Full audit trail, Discord bot integration, cross-platform notifications.

### Phase 8: Admin Panel

**Goal:** Admin can manage access codes and user roles.

**Tasks:**
1. Build admin MC dashboard page at `/admin/gamehub/minecraft`
2. Access code CRUD (create, list, deactivate, delete)
3. User access management (list grants, change roles, revoke access)
4. Server overview for admin (quick status, recent events)
5. Add link to admin sidebar navigation

**Deliverable:** Admin can manage who has access and at what level.

---

## Appendix A: Environment Variables Summary

### Vercel (Website)

```
MC_AGENT_URL=https://mc-api.sweber.dev
MC_AGENT_SECRET=<shared secret>
```

### Server Agent (Alpine Linux)

```
PORT=3003
MC_AGENT_SECRET=<shared secret>
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=<from server.properties>
MC_SERVER_DIR=/opt/minecraft
BACKUP_DIR=/opt/minecraft/backups
CURSEFORGE_API_KEY=<from console.curseforge.com>
MAX_BACKUP_SIZE_GB=50
WEBHOOK_URL=https://nxrthstack.sweber.dev/api/gamehub/minecraft/server/events
WEBHOOK_SECRET=<shared secret for event notifications>
```

### Discord Bot

```
MC_AGENT_URL=https://mc-api.sweber.dev
MC_AGENT_SECRET=<shared secret>
```

### Cloudflare Tunnel Addition

```yaml
# Add to ~/.cloudflared/config.yml
- hostname: mc-api.sweber.dev
  service: http://localhost:3003
```

```bash
# Create DNS route
cloudflared tunnel route dns nxrthserver mc-api.sweber.dev
```

---

## Appendix B: NPM Dependencies

### Server Agent (`/opt/minecraft-agent/package.json`)

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "rcon-client": "^4.2.4",
    "chokidar": "^4.0.0",
    "node-cron": "^3.0.3",
    "unzipper": "^0.12.0",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/multer": "^1.4.12",
    "@types/node-cron": "^3.0.11"
  }
}
```

### Website Additions (`nxrthstack/package.json`)

```json
{
  "dependencies": {
    "react-grid-layout": "^1.5.0",
    "@monaco-editor/react": "^4.7.0",
    "dompurify": "^3.2.0"
  },
  "devDependencies": {
    "@types/react-grid-layout": "^1.3.5",
    "@types/dompurify": "^3.2.0"
  }
}
```

---

## Appendix C: Minecraft Server Properties Reference

For the form-based config editor, map each property to a human-friendly form field:

| Property | Label | Type | Options/Validation |
|----------|-------|------|-------------------|
| `server-port` | Server Port | number | 1024-65535 |
| `motd` | Server Name (MOTD) | text | max 59 chars, preview with MC formatting |
| `max-players` | Max Players | number | 1-1000 |
| `gamemode` | Default Game Mode | select | survival, creative, adventure, spectator |
| `difficulty` | Difficulty | select | peaceful, easy, normal, hard |
| `pvp` | PvP | toggle | |
| `online-mode` | Online Mode (Auth) | toggle | Warning if disabled |
| `white-list` | Whitelist | toggle | |
| `view-distance` | View Distance | slider | 2-32 chunks |
| `simulation-distance` | Simulation Distance | slider | 2-32 chunks |
| `spawn-protection` | Spawn Protection | number | 0-256 blocks |
| `enable-command-block` | Command Blocks | toggle | |
| `allow-flight` | Allow Flight | toggle | |
| `allow-nether` | Allow Nether | toggle | |
| `generate-structures` | Generate Structures | toggle | |
| `level-name` | World Name | text | Read-only (informational) |
| `level-seed` | World Seed | text | Read-only after generation |
| `level-type` | World Type | select | minecraft:normal, minecraft:flat, etc. |
| `max-world-size` | Max World Size | number | 1-29999984 |
| `max-tick-time` | Max Tick Time | number | -1 or 0-60000 ms |
| `network-compression-threshold` | Network Compression | number | -1 to 65535 |
| `enable-rcon` | RCON | toggle | Always true (required for dashboard) |
| `rcon.port` | RCON Port | number | Read-only |
| `rcon.password` | RCON Password | password | Hidden, change requires restart |

---

## Appendix D: Security Considerations

1. **File Sandbox**: Agent MUST validate all file paths resolve within `/opt/minecraft/`. Use `path.resolve()` and verify the resolved path starts with the base directory. Reject any path containing `..` after resolution.

2. **RCON Password**: Never expose via API. The agent connects locally; the password never leaves the server.

3. **Agent Secret**: The `X-MC-Agent-Secret` header is the only auth between Vercel and the agent. Use a cryptographically random 256-bit value: `openssl rand -base64 32`.

4. **Cloudflare Tunnel**: The agent is NOT directly accessible from the internet. Traffic goes through Cloudflare's network with DDoS protection and TLS termination.

5. **Rate Limiting**: Implemented on both the Vercel API routes (per-user) and the agent (per-endpoint) to prevent abuse.

6. **Event Logging**: Every action is logged to `mcServerEvents` with actor ID. This creates an audit trail for accountability.

7. **CurseForge Downloads**: Only download from CurseForge's official CDN URLs (`edge.forgecdn.net`). Validate file hashes when provided by the CurseForge API.

8. **No Arbitrary Code Execution**: The dashboard NEVER executes arbitrary system commands. It only controls the Minecraft process through RCON and the defined start/stop scripts.
