import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getNxrthUser } from "../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link your Discord account to NxrthStack");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  // Check if already linked
  const existingUser = await getNxrthUser(discordId);
  if (existingUser) {
    const embed = new EmbedBuilder()
      .setColor(0x44ff44)
      .setTitle("Already Linked!")
      .setDescription(
        `Your Discord account is already linked to **${existingUser.name || existingUser.email}**.`
      )
      .addFields(
        { name: "Account Email", value: existingUser.email, inline: true },
        {
          name: "Linked Since",
          value: existingUser.discordConnectedAt
            ? existingUser.discordConnectedAt.toLocaleDateString()
            : "Unknown",
          inline: true,
        }
      )
      .setFooter({ text: "Use /profile to view your Gaming Passport" });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Generate link URL
  const linkUrl = `${process.env.NXRTH_API_URL || "https://nxrthstack.sweber.dev"}/dashboard/settings?link_discord=${discordId}`;

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("Link Your Account")
    .setDescription(
      "Connect your Discord to NxrthStack to unlock all bot features!"
    )
    .addFields(
      {
        name: "What You Get",
        value: [
          "- View your Gaming Passport with `/profile`",
          "- Create and join sessions with `/session`",
          "- Track rivalries with `/rivalry`",
          "- Check leaderboards with `/leaderboard`",
        ].join("\n"),
      },
      {
        name: "How to Link",
        value:
          "1. Click the button below\n2. Log in to NxrthStack (or create an account)\n3. Your accounts will be linked automatically",
      }
    )
    .setFooter({ text: "nxrthstack.sweber.dev" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Link Account")
      .setURL(linkUrl)
      .setStyle(ButtonStyle.Link)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}
