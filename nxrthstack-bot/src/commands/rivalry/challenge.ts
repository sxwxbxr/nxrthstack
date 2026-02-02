import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, rivalries, rivalryStats, users } from "../../db.js";
import { eq, or, and } from "drizzle-orm";
import { requireLinked, getNxrthUser } from "../../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("rivalry")
  .setDescription("Rivalry system commands")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("challenge")
      .setDescription("Challenge another user to a rivalry")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to challenge")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("accept")
      .setDescription("Accept a pending rivalry challenge")
      .addStringOption((option) =>
        option
          .setName("rivalry_id")
          .setDescription("The rivalry ID to accept")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("stats")
      .setDescription("View your rivalry statistics")
      .addUserOption((option) =>
        option
          .setName("against")
          .setDescription("View rivalry stats against a specific user")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("record")
      .setDescription("Record a rivalry match result")
      .addStringOption((option) =>
        option
          .setName("rivalry_id")
          .setDescription("The rivalry ID")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("result")
          .setDescription("The match result")
          .setRequired(true)
          .addChoices(
            { name: "I Won", value: "win" },
            { name: "I Lost", value: "loss" },
            { name: "Draw", value: "draw" }
          )
      )
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription("The game played")
          .setRequired(true)
          .addChoices(
            { name: "Rainbow Six Siege", value: "r6" },
            { name: "Valorant", value: "valorant" },
            { name: "Counter-Strike 2", value: "cs2" },
            { name: "Other", value: "other" }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "challenge":
      await handleChallenge(interaction);
      break;
    case "accept":
      await handleAccept(interaction);
      break;
    case "stats":
      await handleStats(interaction);
      break;
    case "record":
      await handleRecord(interaction);
      break;
  }
}

async function handleChallenge(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  let challenger;
  try {
    challenger = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const targetDiscordUser = interaction.options.getUser("user", true);

  if (targetDiscordUser.id === interaction.user.id) {
    await interaction.editReply({ content: "You can't challenge yourself!" });
    return;
  }

  if (targetDiscordUser.bot) {
    await interaction.editReply({ content: "You can't challenge a bot!" });
    return;
  }

  const opponent = await getNxrthUser(targetDiscordUser.id);
  if (!opponent) {
    await interaction.editReply({
      content: `${targetDiscordUser.username} hasn't linked their Discord to NxrthStack yet.`,
    });
    return;
  }

  // Check for existing rivalry
  const [existingRivalry] = await db
    .select()
    .from(rivalries)
    .where(
      or(
        and(
          eq(rivalries.challengerId, challenger.id),
          eq(rivalries.opponentId, opponent.id)
        ),
        and(
          eq(rivalries.challengerId, opponent.id),
          eq(rivalries.opponentId, challenger.id)
        )
      )
    )
    .limit(1);

  if (existingRivalry) {
    if (existingRivalry.status === "active") {
      await interaction.editReply({
        content: `You already have an active rivalry with ${targetDiscordUser.username}!`,
      });
    } else if (existingRivalry.status === "pending") {
      await interaction.editReply({
        content: `There's already a pending challenge between you and ${targetDiscordUser.username}.`,
      });
    } else {
      // Create new season
      const [newRivalry] = await db
        .insert(rivalries)
        .values({
          challengerId: challenger.id,
          opponentId: opponent.id,
          status: "pending",
          season: (existingRivalry.season || 1) + 1,
        })
        .returning();

      const embed = new EmbedBuilder()
        .setColor(0xff5500)
        .setTitle("Rivalry Challenge Sent!")
        .setDescription(
          `You've challenged **${targetDiscordUser.username}** to Season ${newRivalry.season} of your rivalry!`
        )
        .addFields({
          name: "Next Steps",
          value: `${targetDiscordUser.username} needs to accept the challenge using:\n\`/rivalry accept rivalry_id:${newRivalry.id.slice(0, 8)}\``,
        })
        .setFooter({ text: "May the best gamer win!" });

      await interaction.editReply({ embeds: [embed] });
    }
    return;
  }

  // Create new rivalry
  const [rivalry] = await db
    .insert(rivalries)
    .values({
      challengerId: challenger.id,
      opponentId: opponent.id,
      status: "pending",
      season: 1,
    })
    .returning();

  const embed = new EmbedBuilder()
    .setColor(0xff5500)
    .setTitle("⚔️ Rivalry Challenge Sent!")
    .setDescription(`You've challenged **${targetDiscordUser.username}** to a rivalry!`)
    .addFields(
      {
        name: "What is a Rivalry?",
        value:
          "Track your head-to-head matches against a friend. Record wins, losses, and build your rivalry history!",
      },
      {
        name: "Next Steps",
        value: `${targetDiscordUser.username} needs to accept using:\n\`/rivalry accept rivalry_id:${rivalry.id.slice(0, 8)}\``,
      }
    )
    .setFooter({ text: "Rivalry ID: " + rivalry.id.slice(0, 8) });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAccept(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const rivalryIdInput = interaction.options.getString("rivalry_id", true);

  // Find the rivalry
  const allPending = await db
    .select()
    .from(rivalries)
    .where(and(eq(rivalries.opponentId, user.id), eq(rivalries.status, "pending")));

  const rivalry = allPending.find(
    (r) => r.id.startsWith(rivalryIdInput) || r.id === rivalryIdInput
  );

  if (!rivalry) {
    await interaction.editReply({
      content: "Rivalry not found or you're not the challenged party.",
    });
    return;
  }

  // Accept the rivalry
  await db
    .update(rivalries)
    .set({ status: "active", acceptedAt: new Date() })
    .where(eq(rivalries.id, rivalry.id));

  // Initialize stats for both users
  await db.insert(rivalryStats).values([
    { rivalryId: rivalry.id, userId: rivalry.challengerId },
    { rivalryId: rivalry.id, userId: rivalry.opponentId },
  ]);

  // Get challenger info
  const [challenger] = await db
    .select()
    .from(users)
    .where(eq(users.id, rivalry.challengerId))
    .limit(1);

  const embed = new EmbedBuilder()
    .setColor(0x44ff44)
    .setTitle("⚔️ Rivalry Accepted!")
    .setDescription(
      `The rivalry between you and **${challenger?.discordUsername || challenger?.name || "your opponent"}** is now active!`
    )
    .addFields(
      { name: "Season", value: `${rivalry.season}`, inline: true },
      {
        name: "Record Matches",
        value: `Use \`/rivalry record rivalry_id:${rivalry.id.slice(0, 8)}\` after each match`,
      }
    )
    .setFooter({ text: "Good luck!" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const againstUser = interaction.options.getUser("against");

  // Get user's active rivalries
  const userRivalries = await db
    .select()
    .from(rivalries)
    .where(
      and(
        or(eq(rivalries.challengerId, user.id), eq(rivalries.opponentId, user.id)),
        eq(rivalries.status, "active")
      )
    );

  if (userRivalries.length === 0) {
    await interaction.editReply({
      content:
        "You don't have any active rivalries. Use `/rivalry challenge @user` to start one!",
    });
    return;
  }

  // Get stats for each rivalry
  const statsWithOpponents = await Promise.all(
    userRivalries.map(async (rivalry) => {
      const opponentId =
        rivalry.challengerId === user.id ? rivalry.opponentId : rivalry.challengerId;

      const [opponent] = await db
        .select()
        .from(users)
        .where(eq(users.id, opponentId))
        .limit(1);

      const [userStat] = await db
        .select()
        .from(rivalryStats)
        .where(and(eq(rivalryStats.rivalryId, rivalry.id), eq(rivalryStats.userId, user.id)))
        .limit(1);

      return {
        rivalry,
        opponent,
        stats: userStat || { wins: 0, losses: 0, draws: 0, currentStreak: 0 },
      };
    })
  );

  // If filtering by specific opponent
  if (againstUser) {
    const opponent = await getNxrthUser(againstUser.id);
    if (!opponent) {
      await interaction.editReply({
        content: `${againstUser.username} hasn't linked their Discord to NxrthStack.`,
      });
      return;
    }

    const rivalryData = statsWithOpponents.find((s) => s.opponent?.id === opponent.id);
    if (!rivalryData) {
      await interaction.editReply({
        content: `You don't have an active rivalry with ${againstUser.username}.`,
      });
      return;
    }

    const embed = buildRivalryEmbed(
      rivalryData.stats,
      rivalryData.opponent,
      rivalryData.rivalry.season
    );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Show all rivalries
  const embed = new EmbedBuilder()
    .setColor(0xff5500)
    .setTitle("⚔️ Your Rivalries")
    .setDescription(`You have ${userRivalries.length} active rivalry(ies)`);

  for (const { rivalry, opponent, stats } of statsWithOpponents.slice(0, 5)) {
    const opponentName = opponent?.discordUsername || opponent?.name || "Unknown";
    embed.addFields({
      name: `vs ${opponentName} (Season ${rivalry.season})`,
      value: [
        `**Record:** ${stats.wins}W - ${stats.losses}L - ${stats.draws}D`,
        `**Streak:** ${stats.currentStreak > 0 ? `${stats.currentStreak} wins` : stats.currentStreak < 0 ? `${Math.abs(stats.currentStreak)} losses` : "None"}`,
        `\`ID: ${rivalry.id.slice(0, 8)}\``,
      ].join("\n"),
      inline: true,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleRecord(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const rivalryIdInput = interaction.options.getString("rivalry_id", true);
  const result = interaction.options.getString("result", true);
  const game = interaction.options.getString("game", true);

  // Find the rivalry
  const userRivalries = await db
    .select()
    .from(rivalries)
    .where(
      and(
        or(eq(rivalries.challengerId, user.id), eq(rivalries.opponentId, user.id)),
        eq(rivalries.status, "active")
      )
    );

  const rivalry = userRivalries.find(
    (r) => r.id.startsWith(rivalryIdInput) || r.id === rivalryIdInput
  );

  if (!rivalry) {
    await interaction.editReply({
      content: "Rivalry not found or not active.",
    });
    return;
  }

  const opponentId =
    rivalry.challengerId === user.id ? rivalry.opponentId : rivalry.challengerId;

  // Determine winner/loser
  const winnerId = result === "win" ? user.id : result === "loss" ? opponentId : null;
  const loserId = result === "loss" ? user.id : result === "win" ? opponentId : null;

  // Record the match
  const { rivalryMatches } = await import("../../db.js");
  await db.insert(rivalryMatches).values({
    rivalryId: rivalry.id,
    game,
    winnerId,
    loserId,
    isDraw: result === "draw",
  });

  // Update stats
  const updateStats = async (userId: string, isWin: boolean, isLoss: boolean) => {
    const [currentStats] = await db
      .select()
      .from(rivalryStats)
      .where(and(eq(rivalryStats.rivalryId, rivalry.id), eq(rivalryStats.userId, userId)))
      .limit(1);

    if (currentStats) {
      const newStreak = isWin
        ? Math.max(1, (currentStats.currentStreak || 0) + 1)
        : isLoss
          ? Math.min(-1, (currentStats.currentStreak || 0) - 1)
          : 0;

      await db
        .update(rivalryStats)
        .set({
          wins: (currentStats.wins || 0) + (isWin ? 1 : 0),
          losses: (currentStats.losses || 0) + (isLoss ? 1 : 0),
          draws: (currentStats.draws || 0) + (result === "draw" ? 1 : 0),
          currentStreak: newStreak,
          bestStreak: isWin
            ? Math.max(currentStats.bestStreak || 0, newStreak)
            : currentStats.bestStreak,
          updatedAt: new Date(),
        })
        .where(eq(rivalryStats.id, currentStats.id));
    } else {
      await db.insert(rivalryStats).values({
        rivalryId: rivalry.id,
        userId,
        wins: isWin ? 1 : 0,
        losses: isLoss ? 1 : 0,
        draws: result === "draw" ? 1 : 0,
        currentStreak: isWin ? 1 : isLoss ? -1 : 0,
        bestStreak: isWin ? 1 : 0,
      });
    }
  };

  await updateStats(user.id, result === "win", result === "loss");
  await updateStats(opponentId, result === "loss", result === "win");

  // Get opponent info
  const [opponent] = await db.select().from(users).where(eq(users.id, opponentId)).limit(1);

  const resultEmoji = result === "win" ? "🏆" : result === "loss" ? "😢" : "🤝";
  const resultText = result === "win" ? "Victory!" : result === "loss" ? "Defeat" : "Draw";

  const embed = new EmbedBuilder()
    .setColor(result === "win" ? 0x44ff44 : result === "loss" ? 0xff4444 : 0xffaa00)
    .setTitle(`${resultEmoji} Match Recorded: ${resultText}`)
    .setDescription(
      `vs **${opponent?.discordUsername || opponent?.name || "Unknown"}**`
    )
    .addFields(
      { name: "Game", value: game.toUpperCase(), inline: true },
      { name: "Season", value: `${rivalry.season}`, inline: true }
    )
    .setFooter({ text: "Keep the rivalry going!" });

  await interaction.editReply({ embeds: [embed] });
}

function buildRivalryEmbed(
  stats: { wins: number; losses: number; draws: number; currentStreak: number },
  opponent: { name: string | null; discordUsername: string | null } | undefined,
  season: number
) {
  const opponentName = opponent?.discordUsername || opponent?.name || "Unknown";

  return new EmbedBuilder()
    .setColor(0xff5500)
    .setTitle(`⚔️ Rivalry vs ${opponentName}`)
    .addFields(
      { name: "Season", value: `${season}`, inline: true },
      { name: "Wins", value: `${stats.wins}`, inline: true },
      { name: "Losses", value: `${stats.losses}`, inline: true },
      { name: "Draws", value: `${stats.draws}`, inline: true },
      {
        name: "Current Streak",
        value:
          stats.currentStreak > 0
            ? `${stats.currentStreak} win(s)`
            : stats.currentStreak < 0
              ? `${Math.abs(stats.currentStreak)} loss(es)`
              : "None",
        inline: true,
      }
    );
}
