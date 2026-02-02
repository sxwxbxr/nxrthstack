import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, leaderboardEntries, users } from "../db.js";
import { eq, and, desc } from "drizzle-orm";
import { LEADERBOARD_CATEGORIES } from "../types/index.js";
import { formatNumber, formatRank } from "../utils/formatters.js";
import { getNxrthUser } from "../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View global leaderboards")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Leaderboard category")
      .setRequired(true)
      .addChoices(...LEADERBOARD_CATEGORIES)
  )
  .addStringOption((option) =>
    option
      .setName("period")
      .setDescription("Time period")
      .setRequired(false)
      .addChoices(
        { name: "All Time", value: "all_time" },
        { name: "Monthly", value: "monthly" },
        { name: "Weekly", value: "weekly" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const category = interaction.options.getString("category", true);
  const period = interaction.options.getString("period") || "all_time";

  // Get leaderboard entries
  const entries = await db
    .select({
      userId: leaderboardEntries.userId,
      score: leaderboardEntries.score,
      rank: leaderboardEntries.rank,
      userName: users.name,
      discordUsername: users.discordUsername,
    })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .where(
      and(
        eq(leaderboardEntries.category, category),
        eq(leaderboardEntries.period, period)
      )
    )
    .orderBy(desc(leaderboardEntries.score))
    .limit(10);

  const categoryInfo = LEADERBOARD_CATEGORIES.find((c) => c.value === category);
  const periodLabel =
    period === "all_time" ? "All Time" : period === "monthly" ? "This Month" : "This Week";

  if (entries.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle(`${categoryInfo?.name || category} Leaderboard`)
      .setDescription(`No entries yet for ${periodLabel.toLowerCase()}.`);

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Build leaderboard display
  const leaderboardLines = entries.map((entry, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
    const name = entry.discordUsername || entry.userName || "Unknown";
    return `${medal} **${name}** - ${formatNumber(entry.score)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(`🏆 ${categoryInfo?.name || category}`)
    .setDescription(leaderboardLines.join("\n"))
    .addFields({ name: "Period", value: periodLabel, inline: true });

  // Check if the command user is on the leaderboard
  const nxrthUser = await getNxrthUser(interaction.user.id);
  if (nxrthUser) {
    const userEntry = entries.find((e) => e.userId === nxrthUser.id);
    if (userEntry) {
      const userRank = entries.findIndex((e) => e.userId === nxrthUser.id) + 1;
      embed.addFields({
        name: "Your Position",
        value: `${formatRank(userRank)} with ${formatNumber(userEntry.score)}`,
        inline: true,
      });
    } else {
      // Check if user has an entry not in top 10
      const [userLeaderboardEntry] = await db
        .select()
        .from(leaderboardEntries)
        .where(
          and(
            eq(leaderboardEntries.userId, nxrthUser.id),
            eq(leaderboardEntries.category, category),
            eq(leaderboardEntries.period, period)
          )
        )
        .limit(1);

      if (userLeaderboardEntry) {
        embed.addFields({
          name: "Your Position",
          value: userLeaderboardEntry.rank
            ? `${formatRank(userLeaderboardEntry.rank)} with ${formatNumber(userLeaderboardEntry.score)}`
            : `Score: ${formatNumber(userLeaderboardEntry.score)}`,
          inline: true,
        });
      }
    }
  }

  embed.setFooter({ text: "Rankings update periodically" });

  await interaction.editReply({ embeds: [embed] });
}
