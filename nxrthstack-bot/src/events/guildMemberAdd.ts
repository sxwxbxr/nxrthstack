import { Events, type GuildMember, EmbedBuilder } from "discord.js";

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
  // Only send welcome DM if the guild is the primary NxrthStack server
  // You can customize this check based on your needs
  const primaryGuildId = process.env.DISCORD_GUILD_ID;
  if (member.guild.id !== primaryGuildId) return;

  try {
    const embed = new EmbedBuilder()
      .setColor(0x6801ff)
      .setTitle("Welcome to NxrthStack!")
      .setDescription(
        "Thanks for joining! To get the most out of this server, link your Discord account to NxrthStack."
      )
      .addFields(
        {
          name: "Get Started",
          value: "Use `/link` in the server to connect your accounts.",
        },
        {
          name: "What You Can Do",
          value: [
            "- Schedule gaming sessions with `/session create`",
            "- View your stats with `/stats`",
            "- Challenge friends with `/rivalry challenge`",
            "- Check leaderboards with `/leaderboard`",
          ].join("\n"),
        }
      )
      .setFooter({ text: "nxrthstack.sweber.dev" });

    await member.send({ embeds: [embed] });
  } catch (error) {
    // User might have DMs disabled, that's fine
    console.log(`[Welcome] Could not send DM to ${member.user.tag}`);
  }
}
