# Discord Integration Setup Guide

This guide explains how to set up and configure the complete Discord integration for NxrthStack, including OAuth2 account linking and the Discord bot.

## Table of Contents

1. [Overview](#overview)
2. [Discord Developer Portal Setup](#discord-developer-portal-setup)
3. [Environment Variables](#environment-variables)
4. [OAuth2 Account Linking](#oauth2-account-linking)
5. [Discord Bot Setup](#discord-bot-setup)
6. [Bot Commands Reference](#bot-commands-reference)
7. [Webhook Notifications](#webhook-notifications)
8. [Database Schema](#database-schema)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The NxrthStack Discord integration consists of two main components:

1. **OAuth2 Account Linking** - Allows users to connect their Discord account to their NxrthStack profile
2. **Discord Bot** - Provides slash commands for viewing stats, leaderboards, gaming sessions, and more

### Features

- Link Discord accounts to NxrthStack profiles
- View gaming statistics and achievements via bot commands
- Create and join gaming sessions from Discord
- Global leaderboards accessible from Discord
- Server-specific webhook notifications for events
- Achievement unlock for connecting Discord

---

## Discord Developer Portal Setup

### Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter a name (e.g., "NxrthStack")
4. Click **"Create"**

### Step 2: Configure OAuth2

1. In your application, go to **OAuth2 > General**
2. Note down your **Client ID** and **Client Secret**
3. Add redirect URIs:
   ```
   http://localhost:3000/api/auth/discord/callback    (development)
   https://yourdomain.com/api/auth/discord/callback   (production)
   ```

### Step 3: Create the Bot

1. Go to **Bot** section
2. Click **"Add Bot"**
3. Configure bot settings:
   - **Public Bot**: Enable if you want others to add it
   - **Requires OAuth2 Code Grant**: Disable
   - **Message Content Intent**: Enable if needed
   - **Server Members Intent**: Enable
   - **Presence Intent**: Optional
4. Click **"Reset Token"** and save the token securely

### Step 4: Generate Bot Invite URL

1. Go to **OAuth2 > URL Generator**
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Use Slash Commands
   - Read Message History (optional)
4. Copy the generated URL and use it to invite the bot to your server

---

## Environment Variables

### Web Application (`nxrthstack/.env.local`)

```env
# Discord OAuth2 (for account linking)
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### Discord Bot (`nxrthstack-bot/.env`)

```env
# Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_dev_server_id    # For development command sync

# Database (same as web app)
DATABASE_URL=postgresql://...

# API Connection
NXRTH_API_URL=https://yourdomain.com   # or http://localhost:3000
BOT_SECRET=shared_secret_for_api_auth   # Generate a secure random string
```

### Generating Secrets

```bash
# Generate BOT_SECRET
openssl rand -base64 32
```

---

## OAuth2 Account Linking

### How It Works

1. User clicks "Connect Discord" in settings
2. Redirected to Discord OAuth2 authorization
3. User grants permission
4. Discord redirects back with authorization code
5. Server exchanges code for access token
6. Server fetches Discord user info
7. Discord ID, username, and avatar stored in database
8. "discord_connected" achievement unlocked

### API Endpoints

#### Initiate OAuth Flow
```
GET /api/auth/discord
```
Redirects to Discord authorization page. Requires authenticated session.

#### OAuth Callback
```
GET /api/auth/discord/callback?code=...&state=...
```
Handles the OAuth callback, links accounts, redirects to settings.

#### Disconnect Account
```
POST /api/auth/discord/disconnect
```
Removes Discord connection from user account.

### Frontend Component

The `DiscordConnection` component (`components/settings/discord-connection.tsx`) provides the UI:

```tsx
import { DiscordConnection } from "@/components/settings/discord-connection";

// In your settings page
<DiscordConnection user={user} />
```

---

## Discord Bot Setup

### Project Structure

```
nxrthstack-bot/
├── src/
│   ├── index.ts              # Main entry point
│   ├── client.ts             # Discord client setup
│   ├── db.ts                 # Database connection
│   ├── deploy-commands.ts    # Command deployment script
│   ├── commands/
│   │   ├── link.ts           # /link command
│   │   ├── profile.ts        # /profile command
│   │   ├── stats.ts          # /stats command
│   │   ├── leaderboard.ts    # /leaderboard command
│   │   ├── session/
│   │   │   └── list.ts       # /session commands
│   │   ├── rivalry/
│   │   │   └── challenge.ts  # /rivalry commands
│   │   └── admin/
│   │       └── config.ts     # /config command
│   └── events/
│       ├── ready.ts          # Bot ready event
│       ├── interactionCreate.ts
│       └── guildMemberAdd.ts
├── package.json
└── tsconfig.json
```

### Installation

```bash
cd nxrthstack-bot
npm install
```

### Running the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Deploying Commands

Commands must be registered with Discord before use:

```bash
# Deploy to specific guild (instant, for development)
npm run deploy

# Deploy globally (takes up to 1 hour to propagate)
npm run deploy:global
```

---

## Bot Commands Reference

### User Commands

#### `/link`
Links Discord account to NxrthStack profile.

**Usage:** `/link`

**Response:** Embed with magic link URL and feature list

---

#### `/profile [user]`
View a user's Gaming Passport.

**Parameters:**
- `user` (optional): Discord user to view

**Response:** Embed showing:
- Achievement points
- Total achievements
- Active rivalries
- Bio (if set)
- Link to full profile

---

#### `/stats [game] [user]`
View gaming statistics.

**Parameters:**
- `game` (optional): Filter by game (r6, minecraft, pokemon, valorant, etc.)
- `user` (optional): Discord user to view

**Response:** Embed with game-specific or general stats

**R6 Stats Include:**
- Total matches (wins/losses)
- Win rate
- Total kills/deaths
- K/D ratio
- Best streak

---

#### `/leaderboard <category> [period]`
View global leaderboards.

**Parameters:**
- `category` (required): achievement_points, r6_wins, pokemon_shinies, etc.
- `period` (optional): all_time (default), monthly, weekly

**Response:** Top 10 users with your position highlighted

---

#### `/session list [game]`
List upcoming gaming sessions.

**Parameters:**
- `game` (optional): Filter by game

---

#### `/session create <game> [title] [hours] [duration]`
Create a new gaming session.

**Parameters:**
- `game` (required): Game type
- `title` (optional): Session title
- `hours` (optional): Hours until session starts
- `duration` (optional): Duration in minutes

---

#### `/session join <session_id> [status]`
RSVP to a gaming session.

**Parameters:**
- `session_id` (required): Session to join
- `status` (optional): going, maybe, not_going

---

### Admin Commands

#### `/config channel <type> <channel>`
Set notification channel for event type.

**Parameters:**
- `type`: sessions, achievements, rivalries, announcements
- `channel`: Discord channel

**Permissions:** Administrator

---

#### `/config disable <type>`
Disable notifications for event type.

**Parameters:**
- `type`: sessions, achievements, rivalries, announcements

**Permissions:** Administrator

---

#### `/config view`
View current webhook configuration.

**Permissions:** Administrator

---

## Webhook Notifications

Servers can configure webhook notifications for various events.

### Event Types

| Type | Description |
|------|-------------|
| `sessions` | Gaming session created/starting soon |
| `achievements` | Member unlocked an achievement |
| `rivalries` | Rivalry challenges and results |
| `announcements` | System announcements |

### Configuration

Admins use `/config` commands to set up notifications:

```
/config channel sessions #gaming-sessions
/config channel achievements #achievements
/config disable rivalries
/config view
```

### Database Storage

Webhook configs are stored in `webhook_configs` table:

```sql
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(20) NOT NULL,
  webhook_url VARCHAR(300),
  event_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Database Schema

### User Discord Fields

```typescript
// In users table
discordId: varchar(50).unique()       // Discord user ID
discordUsername: varchar(100)          // Display name
discordAvatar: varchar(255)            // Avatar hash/URL
discordConnectedAt: timestamp          // When connected
```

### Webhook Configuration

```typescript
webhookConfigs: pgTable("webhook_configs", {
  id: uuid().primaryKey(),
  guildId: varchar(20).notNull(),
  channelId: varchar(20).notNull(),
  webhookUrl: varchar(300),
  eventType: varchar(50).notNull(),
  isActive: boolean().default(true),
  createdAt: timestamp().defaultNow(),
})
```

### Session Invites (Discord Support)

```typescript
// In session_invites table
invitedDiscordId: varchar(50)  // Can invite by Discord ID
```

---

## Troubleshooting

### OAuth2 Issues

#### "Invalid redirect URI"
- Ensure the callback URL in Discord Developer Portal exactly matches your app
- Check for trailing slashes
- Verify http vs https

#### "Access denied" or user not linked
- Check that `DISCORD_CLIENT_SECRET` is correct
- Verify the user completed the OAuth flow
- Check server logs for errors

### Bot Issues

#### Commands not appearing
- Run `npm run deploy` to register commands
- Wait up to 1 hour for global commands
- Check bot has `applications.commands` scope

#### Bot not responding
- Verify `DISCORD_BOT_TOKEN` is correct
- Check bot has required permissions in server
- Review console for error messages

#### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from bot host
- Ensure SSL settings match your database

### Webhook Issues

#### Notifications not sending
- Verify channel ID is correct
- Check bot has permission to send messages in channel
- Confirm webhook config is active (`is_active = true`)

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid token` | Bot token incorrect | Reset token in Developer Portal |
| `Missing Access` | Bot lacks permissions | Re-invite with correct permissions |
| `Unknown interaction` | Command not registered | Run deploy script |
| `Cannot send messages` | Missing channel permission | Grant Send Messages permission |

---

## Security Considerations

1. **Never commit secrets** - Keep `.env` files out of version control
2. **Validate state parameter** - Prevents CSRF attacks on OAuth
3. **Use BOT_SECRET** - Authenticate internal API calls from bot
4. **Check user ownership** - Verify Discord account isn't already linked
5. **Rate limiting** - Discord has rate limits; handle 429 responses

---

## Additional Resources

- [Discord Developer Documentation](https://discord.com/developers/docs)
- [discord.js Guide](https://discordjs.guide/)
- [OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Slash Commands Guide](https://discord.com/developers/docs/interactions/application-commands)
