import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, users, r6Matches, r6Lobbies, userAchievements, gamehubAchievements, rivalryMatches, rivalries } from "../db.js";
import { eq, or, and, count, sql } from "drizzle-orm";
import { getNxrthUser } from "../utils/permissions.js";
import { GAME_CHOICES, GAME_COLORS } from "../types/index.js";
import { formatNumber } from "../utils/formatters.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View gaming statistics")
  .addStringOption((option) =>
    option
      .setName("game")
      .setDescription("Game to view stats for")
      .setRequired(false)
      .addChoices(...GAME_CHOICES)
  )
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to view stats for (defaults to yourself)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser("user") || interaction.user;
  const game = interaction.options.getString("game");
  const discordId = targetUser.id;

  // Get NxrthStack user
  const nxrthUser = await getNxrthUser(discordId);

  if (!nxrthUser) {
    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("Account Not Linked")
      .setDescription(
        targetUser.id === interaction.user.id
          ? "Your Discord account is not linked to NxrthStack. Use `/link` to get started!"
          : `${targetUser.username} hasn't linked their Discord to NxrthStack yet.`
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // If specific game requested, show game-specific stats
  if (game === "r6") {
    await showR6Stats(interaction, nxrthUser.id, targetUser);
    return;
  }

  // Show general stats
  await showGeneralStats(interaction, nxrthUser.id, targetUser);
}

async function showR6Stats(
  interaction: ChatInputCommandInteraction,
  userId: string,
  discordUser: { username: string; displayAvatarURL: () => string }
) {
  // Get R6 1v1 match stats
  const lobbies = await db
    .select({ id: r6Lobbies.id })
    .from(r6Lobbies)
    .where(or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId)));

  const lobbyIds = lobbies.map((l) => l.id);

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;

  if (lobbyIds.length > 0) {
    const matches = await db
      .select({
        winnerId: r6Matches.winnerId,
        player1Kills: r6Matches.player1Kills,
        player1Deaths: r6Matches.player1Deaths,
        player2Kills: r6Matches.player2Kills,
        player2Deaths: r6Matches.player2Deaths,
        lobbyHostId: r6Lobbies.hostId,
      })
      .from(r6Matches)
      .innerJoin(r6Lobbies, eq(r6Matches.lobbyId, r6Lobbies.id))
      .where(or(...lobbyIds.map((id) => eq(r6Matches.lobbyId, id))));

    for (const match of matches) {
      if (match.winnerId === userId) wins++;
      else if (match.winnerId) losses++;

      // Determine if user was player 1 (host) or player 2
      const isPlayer1 = match.lobbyHostId === userId;
      if (isPlayer1) {
        totalKills += match.player1Kills || 0;
        totalDeaths += match.player1Deaths || 0;
      } else {
        totalKills += match.player2Kills || 0;
        totalDeaths += match.player2Deaths || 0;
      }
    }
  }

  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills > 0 ? "∞" : "0.00";
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";

  const embed = new EmbedBuilder()
    .setColor(GAME_COLORS.r6.color)
    .setAuthor({
      name: `${discordUser.username}'s R6 Stats`,
      iconURL: discordUser.displayAvatarURL(),
    })
    .setTitle("Rainbow Six Siege 1v1 Stats")
    .addFields(
      { name: "Wins", value: formatNumber(wins), inline: true },
      { name: "Losses", value: formatNumber(losses), inline: true },
      { name: "Win Rate", value: `${winRate}%`, inline: true },
      { name: "Total Kills", value: formatNumber(totalKills), inline: true },
      { name: "Total Deaths", value: formatNumber(totalDeaths), inline: true },
      { name: "K/D Ratio", value: kd, inline: true }
    )
    .setFooter({ text: "Stats from NxrthStack 1v1 lobbies" });

  await interaction.editReply({ embeds: [embed] });
}

async function showGeneralStats(
  interaction: ChatInputCommandInteraction,
  userId: string,
  discordUser: { username: string; displayAvatarURL: () => string }
) {
  // Get achievement stats
  const achievementData = await db
    .select({
      count: count(),
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const achievementCount = achievementData[0]?.count || 0;

  // Get total points
  const pointsData = await db
    .select({ points: gamehubAchievements.points })
    .from(userAchievements)
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .where(eq(userAchievements.userId, userId));

  const totalPoints = pointsData.reduce((sum, a) => sum + (a.points || 0), 0);

  // Get rivalry stats
  const rivalryWins = await db
    .select({ count: count() })
    .from(rivalryMatches)
    .where(eq(rivalryMatches.winnerId, userId));

  const rivalryLosses = await db
    .select({ count: count() })
    .from(rivalryMatches)
    .where(eq(rivalryMatches.loserId, userId));

  const activeRivalries = await db
    .select({ count: count() })
    .from(rivalries)
    .where(
      and(
        or(eq(rivalries.challengerId, userId), eq(rivalries.opponentId, userId)),
        eq(rivalries.status, "active")
      )
    );

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setAuthor({
      name: `${discordUser.username}'s Stats`,
      iconURL: discordUser.displayAvatarURL(),
    })
    .setTitle("Gaming Statistics")
    .addFields(
      { name: "Achievement Points", value: formatNumber(totalPoints), inline: true },
      { name: "Achievements", value: formatNumber(achievementCount), inline: true },
      { name: "Active Rivalries", value: formatNumber(activeRivalries[0]?.count || 0), inline: true },
      { name: "Rivalry Wins", value: formatNumber(rivalryWins[0]?.count || 0), inline: true },
      { name: "Rivalry Losses", value: formatNumber(rivalryLosses[0]?.count || 0), inline: true }
    )
    .setFooter({ text: "Use /stats game:r6 for game-specific stats" });

  await interaction.editReply({ embeds: [embed] });
}
