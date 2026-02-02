# NxrthStack Discord Server Structure

## Server Overview

**Server Name:** NxrthStack
**Purpose:** Community hub for NxrthStack users to coordinate gaming sessions, share achievements, discuss features, and provide support.

---

## Category & Channel Structure

### Information
| Channel | Type | Description |
|---------|------|-------------|
| #welcome | Text | Server rules, overview, and role assignment |
| #announcements | Text | Official NxrthStack updates and news |
| #changelog | Text | Feature releases and bug fixes |
| #roadmap | Text | Upcoming features and community voting |

### General
| Channel | Type | Description |
|---------|------|-------------|
| #general | Text | Main community chat |
| #introductions | Text | New member introductions |
| #media | Text | Screenshots, clips, and memes |
| #off-topic | Text | Non-gaming discussions |
| General VC | Voice | General voice chat |

### R6 Siege
| Channel | Type | Description |
|---------|------|-------------|
| #r6-general | Text | R6 Siege discussions |
| #r6-lfg | Text | Looking for group/team |
| #r6-stats | Text | Bot posts R6 stat updates and achievements |
| #r6-1v1-results | Text | 1v1 match results feed |
| R6 Squad 1-3 | Voice | Voice channels for R6 sessions |

### Minecraft
| Channel | Type | Description |
|---------|------|-------------|
| #mc-general | Text | Minecraft discussions |
| #mc-server-status | Text | Bot posts server online/offline status |
| #mc-builds | Text | Share builds and creations |
| #mc-coordinates | Text | Important location sharing |
| Minecraft VC | Voice | Voice chat for MC sessions |

### Pokemon
| Channel | Type | Description |
|---------|------|-------------|
| #pokemon-general | Text | Pokemon game discussions |
| #pokemon-trades | Text | Trade requests and offers |
| #pokemon-shinies | Text | Shiny hunting showcases |
| #pkhex-support | Text | PKHeX tool questions and help |
| Pokemon VC | Voice | Voice chat for Pokemon sessions |

### Session Scheduler
| Channel | Type | Description |
|---------|------|-------------|
| #scheduled-sessions | Text | Bot posts upcoming gaming sessions |
| #session-reminders | Text | Bot sends session reminder pings |
| #session-results | Text | Post-session summaries and highlights |

### Achievements & Rivalries
| Channel | Type | Description |
|---------|------|-------------|
| #achievement-feed | Text | Bot posts member achievement unlocks |
| #leaderboards | Text | Weekly/monthly leaderboard updates |
| #rivalry-matches | Text | Rivalry match results and updates |
| #clip-gallery | Text | Video clip showcase |

### Support
| Channel | Type | Description |
|---------|------|-------------|
| #bug-reports | Text | Report NxrthStack bugs |
| #feature-requests | Text | Suggest new features |
| #help | Text | General support questions |
| Support VC | Voice | Voice support channel |

### Admin
| Channel | Type | Description |
|---------|------|-------------|
| #admin-logs | Text | Bot/moderation logs |
| #admin-chat | Text | Staff-only discussions |
| Admin VC | Voice | Staff-only voice |

---

## Role Structure

### Staff Roles
| Role | Color | Permissions |
|------|-------|-------------|
| Owner | Gold (#FFD700) | Full admin |
| Admin | Red (#FF4444) | Server management, can assign roles |
| Moderator | Orange (#FF8C00) | Manage messages, mute/kick |

### Member Roles
| Role | Color | Description |
|------|-------|-------------|
| Verified | Green (#44FF44) | Linked NxrthStack account |
| Supporter | Purple (#9B59B6) | Premium/supporter tier |
| OG | Blue (#3498DB) | Early community member |

### Game Roles (Self-assignable)
| Role | Color | Game |
|------|-------|------|
| R6 Player | Orange (#FF5500) | Rainbow Six Siege |
| Minecrafter | Green (#44AA00) | Minecraft |
| Pokemon Trainer | Yellow (#FFD700) | Pokemon |
| Valorant Player | Red (#FF4655) | Valorant |
| CS2 Player | Blue (#4B69FF) | Counter-Strike 2 |

### Activity Roles (Bot-assigned)
| Role | Description |
|------|-------------|
| Session Host | Currently hosting a gaming session |
| Top 10 | In top 10 on any leaderboard |
| Rival | Has an active rivalry |
| Achievement Hunter | 50+ achievements unlocked |

---

## Bot Integration Points

### NxrthStack Bot Commands
- `/session create` - Create a gaming session
- `/session list` - List upcoming sessions
- `/stats [game] [user]` - View game stats
- `/rivalry challenge @user` - Challenge to rivalry
- `/rivalry record` - Record rivalry match result
- `/leaderboard [category]` - View leaderboard
- `/profile [user]` - View gaming passport
- `/link` - Link Discord to NxrthStack account

### Webhook Feeds
- Achievement unlock notifications
- Session reminders (30 min, 5 min before)
- Rivalry match results
- Leaderboard position changes
- Minecraft server status changes

### Scheduled Posts
- Daily: Today's scheduled sessions
- Weekly: Leaderboard updates
- Monthly: Top achievers spotlight

---

## Verification Flow

1. User joins server, lands in #welcome
2. User runs `/link` command
3. Bot provides OAuth link to NxrthStack
4. User authorizes Discord connection
5. Bot verifies and assigns "Verified" role
6. User gains access to all channels

---

## Permission Matrix

| Action | Guest | Verified | Mod | Admin |
|--------|-------|----------|-----|-------|
| Read general channels | Yes | Yes | Yes | Yes |
| Post in general channels | No | Yes | Yes | Yes |
| Create sessions | No | Yes | Yes | Yes |
| View admin channels | No | No | Yes | Yes |
| Manage messages | No | No | Yes | Yes |
| Assign roles | No | No | No | Yes |
| Manage channels | No | No | No | Yes |

---

## Notes

- All game-specific channels use channel topics to display relevant NxrthStack links
- Session channels use slowmode to prevent spam
- Media channels require attachments to post
- Bot logs all moderation actions to #admin-logs
- Webhook channels are locked to prevent user posts
