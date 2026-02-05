import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, users, userProfiles, userAchievements, gamehubAchievements, rivalries } from "../db.js";
import { eq, or, and, count } from "drizzle-orm";
import { getNxrthUser } from "../utils/permissions.js";
import { formatNumber } from "../utils/formatters.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View a Gaming Passport")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to view (defaults to yourself)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser("user") || interaction.user;
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

  // Get profile data
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, nxrthUser.id))
    .limit(1);

  // Get achievement count and points
  const achievementData = await db
    .select({
      count: count(),
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, nxrthUser.id));

  const achievementCount = achievementData[0]?.count || 0;

  // Get total achievement points
  const pointsData = await db
    .select({
      points: gamehubAchievements.points,
    })
    .from(userAchievements)
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .where(eq(userAchievements.userId, nxrthUser.id));

  const totalPoints = pointsData.reduce((sum, a) => sum + (a.points || 0), 0);

  // Get active rivalries count
  const activeRivalries = await db
    .select({ count: count() })
    .from(rivalries)
    .where(
      and(
        or(
          eq(rivalries.challengerId, nxrthUser.id),
          eq(rivalries.opponentId, nxrthUser.id)
        ),
        eq(rivalries.status, "active")
      )
    );

  const rivalryCount = activeRivalries[0]?.count || 0;

  // Build embed
  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setAuthor({
      name: nxrthUser.name || nxrthUser.discordUsername || "Unknown",
      iconURL: targetUser.displayAvatarURL(),
    })
    .setTitle("Gaming Passport")
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: "Achievement Points",
        value: formatNumber(totalPoints),
        inline: true,
      },
      {
        name: "Achievements",
        value: formatNumber(achievementCount),
        inline: true,
      },
      {
        name: "Active Rivalries",
        value: formatNumber(rivalryCount),
        inline: true,
      }
    );

  // Add bio if exists
  if (profile?.bio) {
    embed.setDescription(profile.bio);
  }

  // Add profile URL
  const profileUrl = profile?.usernameSlug
    ? `${process.env.NXRTH_API_URL || "https://nxrthstack.sweber.dev"}/u/${profile.usernameSlug}`
    : `${process.env.NXRTH_API_URL || "https://nxrthstack.sweber.dev"}/dashboard/gamehub/passport`;

  embed.setFooter({ text: `View full profile at ${profileUrl}` });

  await interaction.editReply({ embeds: [embed] });
}
