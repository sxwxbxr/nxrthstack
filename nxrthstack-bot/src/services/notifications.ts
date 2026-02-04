import { EmbedBuilder, TextChannel } from "discord.js";
import { client } from "../client.js";
import { db, webhookConfigs, users, gamehubAchievements, gamingSessions, gamehubAnnouncements } from "../db.js";
import { eq, and } from "drizzle-orm";
import { GAME_COLORS } from "../types/index.js";
import { formatDiscordTime, formatRelativeTime, formatDuration } from "../utils/formatters.js";

export type NotificationEventType = "sessions" | "achievements" | "rivalries" | "announcements";

interface NotificationPayload {
  eventType: NotificationEventType;
  guildId?: string; // If specified, only send to this guild
  data: unknown;
}

/**
 * Get all active webhook configs for an event type
 */
async function getActiveConfigs(eventType: NotificationEventType, guildId?: string) {
  const conditions = [
    eq(webhookConfigs.eventType, eventType),
    eq(webhookConfigs.isActive, true),
  ];

  if (guildId) {
    conditions.push(eq(webhookConfigs.guildId, guildId));
  }

  return db
    .select()
    .from(webhookConfigs)
    .where(and(...conditions));
}

/**
 * Send notification to a channel
 */
async function sendToChannel(channelId: string, embed: EmbedBuilder): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased() && "send" in channel) {
      await (channel as TextChannel).send({ embeds: [embed] });
      return true;
    }
  } catch (error) {
    console.error(`[Notifications] Failed to send to channel ${channelId}:`, error);
  }
  return false;
}

/**
 * Broadcast an achievement unlock
 */
export async function broadcastAchievementUnlock(data: {
  userId: string;
  achievementId: string;
  guildId?: string;
}) {
  // Get user info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  if (!user || !user.discordId) return;

  // Get achievement info
  const [achievement] = await db
    .select()
    .from(gamehubAchievements)
    .where(eq(gamehubAchievements.id, data.achievementId))
    .limit(1);

  if (!achievement) return;

  const rarityEmoji: Record<string, string> = {
    common: "⚪",
    uncommon: "🟢",
    rare: "🔵",
    epic: "🟣",
    legendary: "🟠",
  };

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 Achievement Unlocked!")
    .setDescription(
      `**${user.discordUsername || user.name || "A user"}** just unlocked **${achievement.name}**!`
    )
    .addFields(
      { name: "Description", value: achievement.description || "No description", inline: false },
      { name: "Points", value: `+${achievement.points}`, inline: true },
      {
        name: "Rarity",
        value: `${rarityEmoji[achievement.rarity || "common"]} ${(achievement.rarity || "common").charAt(0).toUpperCase() + (achievement.rarity || "common").slice(1)}`,
        inline: true,
      }
    )
    .setFooter({ text: "nxrthstack.vercel.app/dashboard/gamehub/achievements" })
    .setTimestamp();

  // Get configured channels
  const configs = await getActiveConfigs("achievements", data.guildId);

  for (const config of configs) {
    await sendToChannel(config.channelId, embed);
  }

  console.log(`[Notifications] Broadcasted achievement unlock to ${configs.length} channel(s)`);
}

/**
 * Broadcast a new gaming session
 */
export async function broadcastSessionCreated(data: {
  sessionId: string;
  guildId?: string;
}) {
  // Get session info
  const [session] = await db
    .select({
      id: gamingSessions.id,
      title: gamingSessions.title,
      game: gamingSessions.game,
      scheduledAt: gamingSessions.scheduledAt,
      durationMinutes: gamingSessions.durationMinutes,
      hostId: gamingSessions.hostId,
    })
    .from(gamingSessions)
    .where(eq(gamingSessions.id, data.sessionId))
    .limit(1);

  if (!session) return;

  // Get host info
  const [host] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.hostId))
    .limit(1);

  const gameInfo = GAME_COLORS[session.game] || GAME_COLORS.other;

  const embed = new EmbedBuilder()
    .setColor(gameInfo.color)
    .setTitle("🎮 New Gaming Session!")
    .setDescription(`**${host?.discordUsername || host?.name || "Someone"}** is hosting a gaming session!`)
    .addFields(
      { name: "Title", value: session.title || "Gaming Session", inline: true },
      { name: "Game", value: gameInfo.name, inline: true },
      {
        name: "When",
        value: `${formatDiscordTime(session.scheduledAt)}\n(${formatRelativeTime(session.scheduledAt)})`,
        inline: false,
      },
      { name: "Duration", value: formatDuration(session.durationMinutes || 60), inline: true }
    )
    .addFields({
      name: "How to Join",
      value: `Use \`/session join ${session.id.slice(0, 8)}\` to RSVP!`,
    })
    .setFooter({ text: `Session ID: ${session.id.slice(0, 8)}` })
    .setTimestamp();

  const configs = await getActiveConfigs("sessions", data.guildId);

  for (const config of configs) {
    await sendToChannel(config.channelId, embed);
  }

  console.log(`[Notifications] Broadcasted session created to ${configs.length} channel(s)`);
}

/**
 * Broadcast a rivalry event (challenge sent, accepted, match recorded)
 */
export async function broadcastRivalryEvent(data: {
  type: "challenge" | "accepted" | "match";
  challengerName: string;
  opponentName: string;
  season?: number;
  result?: "win" | "loss" | "draw";
  game?: string;
  guildId?: string;
}) {
  let embed: EmbedBuilder;

  if (data.type === "challenge") {
    embed = new EmbedBuilder()
      .setColor(0xff5500)
      .setTitle("⚔️ New Rivalry Challenge!")
      .setDescription(`**${data.challengerName}** has challenged **${data.opponentName}** to a rivalry!`)
      .setFooter({ text: "Use /rivalry to manage your rivalries" })
      .setTimestamp();
  } else if (data.type === "accepted") {
    embed = new EmbedBuilder()
      .setColor(0x44ff44)
      .setTitle("⚔️ Rivalry Accepted!")
      .setDescription(
        `**${data.opponentName}** has accepted **${data.challengerName}**'s challenge!\nSeason ${data.season || 1} begins now!`
      )
      .setFooter({ text: "Let the games begin!" })
      .setTimestamp();
  } else {
    const resultEmoji = data.result === "win" ? "🏆" : data.result === "loss" ? "😢" : "🤝";
    const resultText = data.result === "win" ? "defeated" : data.result === "loss" ? "lost to" : "tied with";

    embed = new EmbedBuilder()
      .setColor(data.result === "win" ? 0x44ff44 : data.result === "loss" ? 0xff4444 : 0xffaa00)
      .setTitle(`${resultEmoji} Rivalry Match!`)
      .setDescription(
        `**${data.challengerName}** ${resultText} **${data.opponentName}** in ${data.game?.toUpperCase() || "a game"}!`
      )
      .setFooter({ text: `Season ${data.season || 1}` })
      .setTimestamp();
  }

  const configs = await getActiveConfigs("rivalries", data.guildId);

  for (const config of configs) {
    await sendToChannel(config.channelId, embed);
  }

  console.log(`[Notifications] Broadcasted rivalry event to ${configs.length} channel(s)`);
}

/**
 * Broadcast an announcement from the website
 */
export async function broadcastAnnouncement(data: {
  announcementId: string;
  guildId?: string;
}) {
  // Get announcement
  const [announcement] = await db
    .select()
    .from(gamehubAnnouncements)
    .where(eq(gamehubAnnouncements.id, data.announcementId))
    .limit(1);

  if (!announcement || !announcement.isActive) return;

  const categoryEmoji: Record<string, string> = {
    update: "🆕",
    event: "🎉",
    maintenance: "🔧",
    community: "👥",
    general: "📢",
  };

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(`${categoryEmoji[announcement.category || "general"] || "📢"} ${announcement.title}`)
    .setDescription(announcement.content || "No content")
    .setFooter({ text: "nxrthstack.vercel.app • GameHub Announcement" })
    .setTimestamp(announcement.createdAt || new Date());

  if (announcement.isPinned) {
    embed.setAuthor({ name: "📌 Pinned Announcement" });
  }

  const configs = await getActiveConfigs("announcements", data.guildId);

  for (const config of configs) {
    await sendToChannel(config.channelId, embed);
  }

  console.log(`[Notifications] Broadcasted announcement to ${configs.length} channel(s)`);
}

/**
 * Broadcast a custom embed to specific event channels
 */
export async function broadcastCustom(
  eventType: NotificationEventType,
  embed: EmbedBuilder,
  guildId?: string
) {
  const configs = await getActiveConfigs(eventType, guildId);

  for (const config of configs) {
    await sendToChannel(config.channelId, embed);
  }

  return configs.length;
}
