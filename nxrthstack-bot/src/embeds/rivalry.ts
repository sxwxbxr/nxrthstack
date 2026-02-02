import { EmbedBuilder } from "discord.js";
import { formatNumber } from "../utils/formatters.js";

export interface RivalryData {
  id: string;
  season: number;
  user1Name: string;
  user1Avatar?: string;
  user1Stats: {
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
  };
  user2Name: string;
  user2Avatar?: string;
  user2Stats: {
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
  };
}

export function buildRivalryEmbed(data: RivalryData): EmbedBuilder {
  const totalMatches =
    data.user1Stats.wins + data.user1Stats.losses + data.user1Stats.draws;

  const user1Streak = formatStreak(data.user1Stats.currentStreak);
  const user2Streak = formatStreak(data.user2Stats.currentStreak);

  const embed = new EmbedBuilder()
    .setColor(0xff5500)
    .setTitle(`⚔️ ${data.user1Name} vs ${data.user2Name}`)
    .setDescription(`Season ${data.season} • ${totalMatches} matches played`)
    .addFields(
      {
        name: data.user1Name,
        value: [
          `**Wins:** ${data.user1Stats.wins}`,
          `**Losses:** ${data.user1Stats.losses}`,
          `**Draws:** ${data.user1Stats.draws}`,
          `**Streak:** ${user1Streak}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "vs",
        value: "⚔️",
        inline: true,
      },
      {
        name: data.user2Name,
        value: [
          `**Wins:** ${data.user2Stats.wins}`,
          `**Losses:** ${data.user2Stats.losses}`,
          `**Draws:** ${data.user2Stats.draws}`,
          `**Streak:** ${user2Streak}`,
        ].join("\n"),
        inline: true,
      }
    )
    .setFooter({ text: `Rivalry ID: ${data.id.slice(0, 8)}` });

  return embed;
}

function formatStreak(streak: number): string {
  if (streak > 0) return `${streak} win${streak > 1 ? "s" : ""} 🔥`;
  if (streak < 0) return `${Math.abs(streak)} loss${Math.abs(streak) > 1 ? "es" : ""} ❄️`;
  return "None";
}

export function buildRivalryMatchEmbed(data: {
  result: "win" | "loss" | "draw";
  game: string;
  opponentName: string;
  season: number;
}): EmbedBuilder {
  const resultEmoji = data.result === "win" ? "🏆" : data.result === "loss" ? "😢" : "🤝";
  const resultText =
    data.result === "win" ? "Victory!" : data.result === "loss" ? "Defeat" : "Draw";
  const color =
    data.result === "win" ? 0x44ff44 : data.result === "loss" ? 0xff4444 : 0xffaa00;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${resultEmoji} Match Recorded: ${resultText}`)
    .setDescription(`vs **${data.opponentName}**`)
    .addFields(
      { name: "Game", value: data.game.toUpperCase(), inline: true },
      { name: "Season", value: `${data.season}`, inline: true }
    )
    .setFooter({ text: "Keep the rivalry going!" });
}
