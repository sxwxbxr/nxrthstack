import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, users, userAchievements, gamehubAchievements } from "../db.js";
import { eq, desc, and, count } from "drizzle-orm";
import { getNxrthUser } from "../utils/permissions.js";
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

export const data = new SlashCommandBuilder()
  .setName("achievements")
  .setDescription("View achievements")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List your unlocked achievements")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("View another user's achievements")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("recent")
      .setDescription("View recently unlocked achievements")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("info")
      .setDescription("View details about a specific achievement")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Achievement name to look up")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "list":
      await handleList(interaction);
      break;
    case "recent":
      await handleRecent(interaction);
      break;
    case "info":
      await handleInfo(interaction);
      break;
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser("user") || interaction.user;
  const discordId = targetUser.id;

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

  // Get user's achievements with details
  const achievements = await db
    .select({
      id: gamehubAchievements.id,
      name: gamehubAchievements.name,
      description: gamehubAchievements.description,
      icon: gamehubAchievements.icon,
      points: gamehubAchievements.points,
      rarity: gamehubAchievements.rarity,
      category: gamehubAchievements.category,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .where(eq(userAchievements.userId, nxrthUser.id))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(15);

  // Get total counts
  const [totalUnlocked] = await db
    .select({ count: count() })
    .from(userAchievements)
    .where(eq(userAchievements.userId, nxrthUser.id));

  const [totalAvailable] = await db
    .select({ count: count() })
    .from(gamehubAchievements)
    .where(eq(gamehubAchievements.isSecret, false));

  // Calculate total points
  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

  if (achievements.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle(`${targetUser.username}'s Achievements`)
      .setDescription("No achievements unlocked yet. Start exploring NxrthStack to earn some!")
      .setThumbnail(targetUser.displayAvatarURL());

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const achievementLines = achievements.slice(0, 10).map((a) => {
    const emoji = RARITY_EMOJI[a.rarity || "common"];
    return `${emoji} **${a.name}** (+${a.points}pts)\n└ ${a.description}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setAuthor({
      name: `${targetUser.username}'s Achievements`,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setDescription(achievementLines.join("\n\n"))
    .addFields(
      {
        name: "Total Points",
        value: formatNumber(totalPoints),
        inline: true,
      },
      {
        name: "Unlocked",
        value: `${totalUnlocked.count}/${totalAvailable.count}`,
        inline: true,
      }
    )
    .setFooter({
      text: `View all achievements at nxrthstack.vercel.app/dashboard/gamehub/achievements`,
    });

  await interaction.editReply({ embeds: [embed] });
}

async function handleRecent(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Get globally recent achievements
  const recentAchievements = await db
    .select({
      achievementName: gamehubAchievements.name,
      achievementIcon: gamehubAchievements.icon,
      achievementPoints: gamehubAchievements.points,
      achievementRarity: gamehubAchievements.rarity,
      userName: users.name,
      discordUsername: users.discordUsername,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .innerJoin(users, eq(userAchievements.userId, users.id))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(10);

  if (recentAchievements.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle("Recent Achievements")
      .setDescription("No achievements have been unlocked recently.");

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const lines = recentAchievements.map((a) => {
    const emoji = RARITY_EMOJI[a.achievementRarity || "common"];
    const userName = a.discordUsername || a.userName || "Unknown";
    const timeAgo = formatTimeAgo(a.unlockedAt);
    return `${emoji} **${userName}** unlocked **${a.achievementName}** (+${a.achievementPoints}pts)\n└ ${timeAgo}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("🏆 Recent Achievements")
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: "Globally across all NxrthStack users" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const name = interaction.options.getString("name", true);

  // Search for achievement by name (case-insensitive partial match)
  const achievements = await db
    .select()
    .from(gamehubAchievements)
    .where(eq(gamehubAchievements.isSecret, false));

  const achievement = achievements.find(
    (a) => a.name.toLowerCase().includes(name.toLowerCase())
  );

  if (!achievement) {
    await interaction.editReply({
      content: `No achievement found matching "${name}". Try a different search term.`,
    });
    return;
  }

  // Count how many users have this achievement
  const [unlockCount] = await db
    .select({ count: count() })
    .from(userAchievements)
    .where(eq(userAchievements.achievementId, achievement.id));

  const rarityColor = RARITY_COLORS[achievement.rarity || "common"];
  const rarityEmoji = RARITY_EMOJI[achievement.rarity || "common"];

  const embed = new EmbedBuilder()
    .setColor(rarityColor)
    .setTitle(`${rarityEmoji} ${achievement.name}`)
    .setDescription(achievement.description || "No description")
    .addFields(
      { name: "Points", value: `${achievement.points}`, inline: true },
      {
        name: "Rarity",
        value: (achievement.rarity || "common").charAt(0).toUpperCase() + (achievement.rarity || "common").slice(1),
        inline: true,
      },
      {
        name: "Category",
        value: (achievement.category || "general").charAt(0).toUpperCase() + (achievement.category || "general").slice(1),
        inline: true,
      },
      {
        name: "Unlocked By",
        value: `${unlockCount.count} user(s)`,
        inline: true,
      }
    );

  // Check if current user has this achievement
  const nxrthUser = await getNxrthUser(interaction.user.id);
  if (nxrthUser) {
    const [userHas] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, nxrthUser.id),
          eq(userAchievements.achievementId, achievement.id)
        )
      )
      .limit(1);

    if (userHas) {
      embed.addFields({
        name: "Your Status",
        value: `✅ Unlocked on ${userHas.unlockedAt?.toLocaleDateString() || "Unknown"}`,
        inline: true,
      });
    } else {
      embed.addFields({
        name: "Your Status",
        value: "🔒 Not yet unlocked",
        inline: true,
      });
    }
  }

  await interaction.editReply({ embeds: [embed] });
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}
