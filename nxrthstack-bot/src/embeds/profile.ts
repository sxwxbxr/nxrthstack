import { EmbedBuilder } from "discord.js";
import { formatNumber } from "../utils/formatters.js";

export interface ProfileData {
  username: string;
  avatarUrl: string;
  bio?: string | null;
  achievementPoints: number;
  achievementCount: number;
  rivalryCount: number;
  profileUrl: string;
}

export function buildProfileEmbed(data: ProfileData): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setAuthor({
      name: data.username,
      iconURL: data.avatarUrl,
    })
    .setTitle("Gaming Passport")
    .setThumbnail(data.avatarUrl)
    .addFields(
      {
        name: "Achievement Points",
        value: formatNumber(data.achievementPoints),
        inline: true,
      },
      {
        name: "Achievements",
        value: formatNumber(data.achievementCount),
        inline: true,
      },
      {
        name: "Active Rivalries",
        value: formatNumber(data.rivalryCount),
        inline: true,
      }
    )
    .setFooter({ text: `View full profile at ${data.profileUrl}` });

  if (data.bio) {
    embed.setDescription(data.bio);
  }

  return embed;
}
