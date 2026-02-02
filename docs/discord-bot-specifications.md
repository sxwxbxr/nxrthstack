# NxrthStack Discord Bot - Technical Specifications

## Overview

**Bot Name:** NxrthStack Bot
**Framework:** Discord.js v14
**Runtime:** Node.js 20+
**Database:** Shared PostgreSQL (Neon) with NxrthStack main app
**Hosting:** Dedicated process or Vercel Edge Function (for webhook handlers)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NxrthStack Ecosystem                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   Web App   │◄──►│  PostgreSQL │◄──►│  Discord Bot    │ │
│  │  (Next.js)  │    │   (Neon)    │    │  (Discord.js)   │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│         │                                       │           │
│         ▼                                       ▼           │
│  ┌─────────────┐                      ┌─────────────────┐  │
│  │  Webhooks   │─────────────────────►│ Discord Server  │  │
│  │  (Events)   │                      │   (Channels)    │  │
│  └─────────────┘                      └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Bot Framework | Discord.js 14.x |
| Runtime | Node.js 20 LTS |
| Database ORM | Drizzle ORM (shared with web app) |
| Database | PostgreSQL (Neon Serverless) |
| Caching | Redis (optional, for rate limiting) |
| Deployment | Railway / Fly.io / Self-hosted |
| Package Manager | pnpm |

---

## Database Schema Extensions

### discord_links Table
```sql
CREATE TABLE "discord_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "discord_id" varchar(20) NOT NULL UNIQUE,
  "discord_username" varchar(100),
  "discord_avatar" varchar(100),
  "linked_at" timestamp DEFAULT now() NOT NULL,
  "is_verified" boolean DEFAULT false
);

CREATE INDEX idx_discord_links_user ON discord_links(user_id);
CREATE INDEX idx_discord_links_discord ON discord_links(discord_id);
```

### bot_notifications Table
```sql
CREATE TABLE "bot_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "notification_type" varchar(50) NOT NULL,
  "enabled" boolean DEFAULT true,
  "channel_override" varchar(20), -- DM or specific channel
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

### webhook_configs Table
```sql
CREATE TABLE "webhook_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id" varchar(20) NOT NULL,
  "channel_id" varchar(20) NOT NULL,
  "webhook_url" varchar(300) NOT NULL,
  "event_type" varchar(50) NOT NULL, -- achievement, session, rivalry, etc.
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE(guild_id, event_type)
);
```

---

## Slash Commands

### Account Commands

#### `/link`
Links Discord account to NxrthStack account.
```
Options: None
Response: OAuth2 link button
Permissions: Everyone
Cooldown: 1 per 60 seconds
```

#### `/unlink`
Unlinks Discord account from NxrthStack.
```
Options: None
Response: Confirmation prompt
Permissions: Verified users
Cooldown: 1 per 300 seconds
```

#### `/profile [user]`
Displays a user's Gaming Passport.
```
Options:
  - user: Discord user (optional, defaults to self)
Response: Embed with stats, achievements, rivalries
Permissions: Everyone
Cooldown: 1 per 10 seconds
```

### Session Commands

#### `/session create`
Creates a new gaming session.
```
Options:
  - game: Select (R6, Minecraft, Pokemon, etc.)
  - title: String (optional)
  - date: String (YYYY-MM-DD)
  - time: String (HH:MM)
  - duration: Integer (minutes, default 60)
Response: Confirmation embed with session details
Permissions: Verified users
Cooldown: 3 per 300 seconds
```

#### `/session list`
Lists upcoming sessions.
```
Options:
  - game: Select (optional filter)
  - mine: Boolean (only my sessions)
Response: Paginated embed of sessions
Permissions: Everyone
Cooldown: 1 per 10 seconds
```

#### `/session join <session_id>`
RSVP to a gaming session.
```
Options:
  - session_id: String
  - status: Select (going, maybe)
Response: Confirmation message
Permissions: Verified users
Cooldown: 5 per 60 seconds
```

#### `/session cancel <session_id>`
Cancels a session you're hosting.
```
Options:
  - session_id: String
Response: Confirmation prompt
Permissions: Session host only
Cooldown: 1 per 60 seconds
```

### Stats Commands

#### `/stats [game] [user]`
Displays game-specific statistics.
```
Options:
  - game: Select (R6, Pokemon, etc.)
  - user: Discord user (optional)
Response: Embed with game stats
Permissions: Everyone
Cooldown: 1 per 10 seconds
```

#### `/leaderboard <category>`
Shows leaderboard rankings.
```
Options:
  - category: Select (achievement_points, r6_wins, etc.)
  - period: Select (weekly, monthly, all_time)
Response: Paginated leaderboard embed
Permissions: Everyone
Cooldown: 1 per 30 seconds
```

### Rivalry Commands

#### `/rivalry challenge <user>`
Challenges another user to a rivalry.
```
Options:
  - user: Discord user
Response: Challenge embed with accept button
Permissions: Verified users
Cooldown: 3 per 3600 seconds
```

#### `/rivalry record`
Records a rivalry match result.
```
Options:
  - rivalry: Select (your active rivalries)
  - game: Select
  - result: Select (win, loss, draw)
Response: Updated rivalry stats embed
Permissions: Rivalry participants
Cooldown: 5 per 300 seconds
```

#### `/rivalry stats [rivalry_id]`
Shows rivalry head-to-head stats.
```
Options:
  - rivalry_id: String (optional, shows all if omitted)
Response: Rivalry stats embed
Permissions: Everyone
Cooldown: 1 per 10 seconds
```

### Admin Commands

#### `/config webhook <event_type> <channel>`
Configures webhook notifications for a channel.
```
Options:
  - event_type: Select (achievements, sessions, rivalries, etc.)
  - channel: Channel
Response: Confirmation message
Permissions: Server Administrators
Cooldown: 1 per 60 seconds
```

#### `/config notifications`
Manages server notification settings.
```
Options: Subcommands for each notification type
Permissions: Server Administrators
Cooldown: 1 per 30 seconds
```

---

## Event Handlers

### Discord Events

| Event | Handler |
|-------|---------|
| `ready` | Initialize bot, sync commands, restore state |
| `guildMemberAdd` | Send welcome DM with link instructions |
| `interactionCreate` | Route slash commands and buttons |
| `messageCreate` | (Future) Chat commands or triggers |

### NxrthStack Webhook Events

| Event | Trigger | Action |
|-------|---------|--------|
| `achievement.unlocked` | User unlocks achievement | Post to #achievement-feed |
| `session.created` | New session created | Post to #scheduled-sessions |
| `session.reminder` | 30min/5min before session | Ping RSVPed users |
| `session.started` | Session time reached | Post "Session starting!" |
| `rivalry.created` | New rivalry accepted | Post to #rivalry-matches |
| `rivalry.match` | Match recorded | Post result to #rivalry-matches |
| `leaderboard.update` | Position change | DM user if significant |
| `minecraft.status` | Server start/stop | Post to #mc-server-status |

---

## Embed Templates

### Profile Embed
```javascript
{
  color: 0x6801FF, // Primary purple
  author: {
    name: username,
    icon_url: avatarUrl
  },
  title: "Gaming Passport",
  thumbnail: { url: avatarUrl },
  fields: [
    { name: "Achievement Points", value: points, inline: true },
    { name: "Sessions Hosted", value: count, inline: true },
    { name: "Active Rivalries", value: count, inline: true },
    { name: "Top Games", value: gameList },
    { name: "Recent Achievements", value: achievementList }
  ],
  footer: { text: "View full profile at nxrth.dev/u/username" }
}
```

### Session Embed
```javascript
{
  color: gameColor, // Based on game
  title: sessionTitle,
  description: `Hosted by ${hostName}`,
  fields: [
    { name: "Game", value: gameName, inline: true },
    { name: "Time", value: formattedTime, inline: true },
    { name: "Duration", value: durationStr, inline: true },
    { name: "Participants", value: `${going}/${max || "∞"}` }
  ],
  footer: { text: `Session ID: ${sessionId}` },
  timestamp: scheduledAt
}
```

### Rivalry Stats Embed
```javascript
{
  color: 0xFF5500,
  title: `${user1} vs ${user2}`,
  description: `Season ${season} • ${status}`,
  fields: [
    { name: user1, value: `${wins1} wins`, inline: true },
    { name: "vs", value: "⚔️", inline: true },
    { name: user2, value: `${wins2} wins`, inline: true },
    { name: "Total Matches", value: totalMatches },
    { name: "Current Streak", value: streakInfo }
  ]
}
```

---

## API Integration

### Internal API Calls
Bot communicates with NxrthStack via internal API routes:

```typescript
// Example: Get user by Discord ID
const response = await fetch(`${NXRTH_API_URL}/api/internal/discord/user/${discordId}`, {
  headers: { 'X-Bot-Secret': BOT_SECRET }
});

// Example: Create session
const response = await fetch(`${NXRTH_API_URL}/api/internal/sessions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Bot-Secret': BOT_SECRET
  },
  body: JSON.stringify(sessionData)
});
```

### Webhook Receiver
Web app posts events to bot's webhook endpoint:

```typescript
// POST /webhook/events
{
  event: "achievement.unlocked",
  data: {
    userId: "uuid",
    discordId: "123456789",
    achievement: { name, points, rarity }
  },
  timestamp: "2024-01-15T12:00:00Z"
}
```

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Global commands | 50/second |
| Per-user commands | 5/10 seconds |
| API calls to NxrthStack | 100/minute |
| Webhook posts | 30/minute per channel |

---

## Environment Variables

```env
# Discord
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_GUILD_ID=          # Primary server for command sync

# Database (shared with web app)
DATABASE_URL=

# NxrthStack API
NXRTH_API_URL=https://nxrth.dev
BOT_SECRET=                 # For internal API auth

# Optional
REDIS_URL=                  # For rate limiting cache
SENTRY_DSN=                 # Error tracking
```

---

## File Structure

```
nxrthstack-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── client.ts             # Discord client setup
│   ├── commands/
│   │   ├── index.ts          # Command registry
│   │   ├── link.ts
│   │   ├── profile.ts
│   │   ├── session/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   └── join.ts
│   │   ├── stats.ts
│   │   ├── leaderboard.ts
│   │   ├── rivalry/
│   │   │   ├── challenge.ts
│   │   │   ├── record.ts
│   │   │   └── stats.ts
│   │   └── admin/
│   │       └── config.ts
│   ├── events/
│   │   ├── ready.ts
│   │   ├── interactionCreate.ts
│   │   └── guildMemberAdd.ts
│   ├── webhooks/
│   │   ├── handler.ts
│   │   └── events/
│   │       ├── achievement.ts
│   │       ├── session.ts
│   │       └── rivalry.ts
│   ├── embeds/
│   │   ├── profile.ts
│   │   ├── session.ts
│   │   ├── rivalry.ts
│   │   └── leaderboard.ts
│   ├── api/
│   │   └── nxrthstack.ts     # API client
│   ├── db/
│   │   ├── index.ts          # Drizzle connection
│   │   └── queries.ts        # Common queries
│   └── utils/
│       ├── permissions.ts
│       ├── cooldowns.ts
│       └── formatters.ts
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env
```

---

## Deployment

### Production Checklist
- [ ] Bot token in secure environment
- [ ] Database connection string configured
- [ ] Commands registered to Discord API
- [ ] Webhook endpoints configured in web app
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) configured
- [ ] Health check endpoint active
- [ ] Logging configured

### Scaling Considerations
- Bot can be sharded if joining 2500+ servers
- Database queries should use connection pooling
- Webhook processing should be async/queued
- Consider Redis for cross-process cooldown tracking

---

## Future Enhancements

1. **Voice Channel Integration**
   - Auto-create voice channels for sessions
   - Track voice activity for sessions

2. **Game Integration**
   - R6 Tracker API for live stats
   - Minecraft server RCON commands

3. **Moderation**
   - Auto-mod for spam
   - Report system integration

4. **Analytics**
   - Command usage tracking
   - Engagement metrics

5. **Localization**
   - Multi-language support
   - Timezone-aware scheduling
