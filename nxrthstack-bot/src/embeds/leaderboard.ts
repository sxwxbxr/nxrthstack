import { EmbedBuilder } from "discord.js";
import { formatNumber, formatRank } from "../utils/formatters.js";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  category: string;
  categoryLabel: string;
  period: string;
  periodLabel: string;
  entries: LeaderboardEntry[];
  userPosition?: {
    rank: number;
    score: number;
  };
}

export function buildLeaderboardEmbed(data: LeaderboardData): EmbedBuilder {
  const leaderboardLines = data.entries.map((entry) => {
    const medal =
      entry.rank === 1
        ? "🥇"
        : entry.rank === 2
          ? "🥈"
          : entry.rank === 3
            ? "🥉"
            : `${entry.rank}.`;

    const highlight = entry.isCurrentUser ? "**" : "";
    return `${medal} ${highlight}${entry.username}${highlight} - ${formatNumber(entry.score)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(`🏆 ${data.categoryLabel}`)
    .setDescription(leaderboardLines.join("\n") || "No entries yet")
    .addFields({ name: "Period", value: data.periodLabel, inline: true });

  if (data.userPosition) {
    embed.addFields({
      name: "Your Position",
      value: `${formatRank(data.userPosition.rank)} with ${formatNumber(data.userPosition.score)}`,
      inline: true,
    });
  }

  embed.setFooter({ text: "Rankings update periodically" });

  return embed;
}

export function buildEmptyLeaderboardEmbed(
  categoryLabel: string,
  periodLabel: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x888888)
    .setTitle(`${categoryLabel} Leaderboard`)
    .setDescription(`No entries yet for ${periodLabel.toLowerCase()}.`);
}
