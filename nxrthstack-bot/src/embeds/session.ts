import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GAME_COLORS } from "../types/index.js";
import { formatDiscordTime, formatRelativeTime, formatDuration } from "../utils/formatters.js";

export interface SessionData {
  id: string;
  title: string;
  game: string;
  scheduledAt: Date;
  durationMinutes: number;
  hostName: string;
  hostAvatar?: string;
  participantCount: number;
  maxParticipants?: number | null;
}

export function buildSessionEmbed(data: SessionData): EmbedBuilder {
  const gameInfo = GAME_COLORS[data.game] || GAME_COLORS.other;
  const participants = data.maxParticipants
    ? `${data.participantCount}/${data.maxParticipants}`
    : `${data.participantCount}`;

  const embed = new EmbedBuilder()
    .setColor(gameInfo.color)
    .setTitle(data.title)
    .setDescription(`Hosted by **${data.hostName}**`)
    .addFields(
      { name: "Game", value: gameInfo.name, inline: true },
      {
        name: "Time",
        value: `${formatDiscordTime(data.scheduledAt)}\n(${formatRelativeTime(data.scheduledAt)})`,
        inline: true,
      },
      { name: "Duration", value: formatDuration(data.durationMinutes), inline: true },
      { name: "Participants", value: participants, inline: true }
    )
    .setFooter({ text: `Session ID: ${data.id.slice(0, 8)}` })
    .setTimestamp(data.scheduledAt);

  if (data.hostAvatar) {
    embed.setThumbnail(data.hostAvatar);
  }

  return embed;
}

export function buildSessionButtons(sessionId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`session_join:${sessionId}:going`)
      .setLabel("Going")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId(`session_join:${sessionId}:maybe`)
      .setLabel("Maybe")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🤔")
  );
}
