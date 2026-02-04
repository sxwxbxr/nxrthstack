import { EmbedBuilder } from "discord.js";
import { formatNumber } from "../utils/formatters.js";

const RARITY_COLORS: Record<string, number> = {
  common: 0x9e9e9e,
  uncommon: 0x4caf50,
  rare: 0x2196f3,
  epic: 0x9c27b0,
  legendary: 0xff9800,
};

const RARITY_EMOJI: Record<string, string> = {
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟠",
};

export interface AchievementData {
  name: string;
  description: string;
  points: number;
  rarity: string;
  category: string;
  unlockedBy?: number;
  isUnlocked?: boolean;
  unlockedAt?: Date | null;
}

export interface AchievementUnlockData {
  username: string;
  avatarUrl?: string;
  achievementName: string;
  achievementDescription: string;
  points: number;
  rarity: string;
}

export function buildAchievementEmbed(data: AchievementData): EmbedBuilder {
  const color = RARITY_COLORS[data.rarity] || RARITY_COLORS.common;
  const emoji = RARITY_EMOJI[data.rarity] || RARITY_EMOJI.common;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${data.name}`)
    .setDescription(data.description)
    .addFields(
      { name: "Points", value: `${data.points}`, inline: true },
      {
        name: "Rarity",
        value: data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1),
        inline: true,
      },
      {
        name: "Category",
        value: data.category.charAt(0).toUpperCase() + data.category.slice(1),
        inline: true,
      }
    );

  if (data.unlockedBy !== undefined) {
    embed.addFields({
      name: "Unlocked By",
      value: `${formatNumber(data.unlockedBy)} user(s)`,
      inline: true,
    });
  }

  if (data.isUnlocked !== undefined) {
    if (data.isUnlocked && data.unlockedAt) {
      embed.addFields({
        name: "Your Status",
        value: `✅ Unlocked on ${data.unlockedAt.toLocaleDateString()}`,
        inline: true,
      });
    } else if (!data.isUnlocked) {
      embed.addFields({
        name: "Your Status",
        value: "🔒 Not yet unlocked",
        inline: true,
      });
    }
  }

  return embed;
}

export function buildAchievementUnlockEmbed(data: AchievementUnlockData): EmbedBuilder {
  const emoji = RARITY_EMOJI[data.rarity] || RARITY_EMOJI.common;

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 Achievement Unlocked!")
    .setDescription(`**${data.username}** just unlocked **${data.achievementName}**!`)
    .addFields(
      { name: "Description", value: data.achievementDescription, inline: false },
      { name: "Points", value: `+${data.points}`, inline: true },
      {
        name: "Rarity",
        value: `${emoji} ${data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1)}`,
        inline: true,
      }
    )
    .setFooter({ text: "nxrthstack.vercel.app/dashboard/gamehub/achievements" })
    .setTimestamp();

  if (data.avatarUrl) {
    embed.setThumbnail(data.avatarUrl);
  }

  return embed;
}

export function buildAchievementListEmbed(
  username: string,
  avatarUrl: string,
  achievements: Array<{
    name: string;
    description: string;
    points: number;
    rarity: string;
  }>,
  totalPoints: number,
  unlocked: number,
  total: number
): EmbedBuilder {
  const lines = achievements.slice(0, 10).map((a) => {
    const emoji = RARITY_EMOJI[a.rarity] || RARITY_EMOJI.common;
    return `${emoji} **${a.name}** (+${a.points}pts)\n└ ${a.description}`;
  });

  return new EmbedBuilder()
    .setColor(0x6801ff)
    .setAuthor({
      name: `${username}'s Achievements`,
      iconURL: avatarUrl,
    })
    .setDescription(lines.join("\n\n") || "No achievements unlocked yet.")
    .addFields(
      { name: "Total Points", value: formatNumber(totalPoints), inline: true },
      { name: "Unlocked", value: `${unlocked}/${total}`, inline: true }
    )
    .setFooter({ text: "View all at nxrthstack.vercel.app/dashboard/gamehub/achievements" });
}
