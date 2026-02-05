import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show available commands and how to use the bot");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("NxrthStack Bot Commands")
    .setDescription(
      "Welcome to NxrthStack! Here's everything you can do with the bot."
    )
    .addFields(
      {
        name: "🔗 Account",
        value: [
          "`/link` - Link your Discord to NxrthStack",
          "`/profile [@user]` - View Gaming Passport",
        ].join("\n"),
      },
      {
        name: "📊 Stats & Leaderboards",
        value: [
          "`/stats [game] [@user]` - View gaming statistics",
          "`/leaderboard <category> [period]` - View global rankings",
          "`/achievements list [@user]` - View unlocked achievements",
          "`/achievements recent` - See recent global unlocks",
          "`/achievements info <name>` - Get achievement details",
        ].join("\n"),
      },
      {
        name: "🎮 Gaming Sessions",
        value: [
          "`/session list [game]` - View upcoming sessions",
          "`/session create <game> [title] [hours] [duration]` - Host a session",
          "`/session join <id> [status]` - RSVP to a session",
        ].join("\n"),
      },
      {
        name: "⚔️ Rivalries",
        value: [
          "`/rivalry challenge @user` - Start a rivalry",
          "`/rivalry accept <id>` - Accept a challenge",
          "`/rivalry stats [@against]` - View rivalry stats",
          "`/rivalry record <id> <result> <game>` - Record a match",
        ].join("\n"),
      },
      {
        name: "👥 Friends",
        value: [
          "`/friends list` - View your friends",
          "`/friends add @user` - Send a friend request",
          "`/friends accept @user` - Accept a request",
          "`/friends pending` - View pending requests",
        ].join("\n"),
      },
      {
        name: "🔧 Server Config (Admin)",
        value: [
          "`/config channel <type> <channel>` - Set notification channel",
          "`/config disable <type>` - Disable notifications",
          "`/config view` - View current settings",
          "`/announce create` - Create an announcement",
          "`/announce broadcast <id>` - Re-broadcast announcement",
        ].join("\n"),
      }
    )
    .setFooter({ text: "nxrthstack.sweber.dev • Link your account to get started!" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("NxrthStack Website")
      .setURL("https://nxrthstack.sweber.dev")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("GameHub")
      .setURL("https://nxrthstack.sweber.dev/dashboard/gamehub")
      .setStyle(ButtonStyle.Link)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
