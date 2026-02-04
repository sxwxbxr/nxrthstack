import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { db, gamehubAnnouncements, webhookConfigs } from "../../db.js";
import { eq, and } from "drizzle-orm";
import { isGuildAdmin, getNxrthUser } from "../../utils/permissions.js";

const CATEGORY_CHOICES = [
  { name: "General", value: "general" },
  { name: "Update", value: "update" },
  { name: "Event", value: "event" },
  { name: "Maintenance", value: "maintenance" },
  { name: "Community", value: "community" },
];

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Create and broadcast announcements (Admin only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a new announcement")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Announcement title")
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption((option) =>
        option
          .setName("content")
          .setDescription("Announcement content")
          .setRequired(true)
          .setMaxLength(2000)
      )
      .addStringOption((option) =>
        option
          .setName("category")
          .setDescription("Announcement category")
          .setRequired(false)
          .addChoices(...CATEGORY_CHOICES)
      )
      .addBooleanOption((option) =>
        option
          .setName("pinned")
          .setDescription("Pin this announcement")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("broadcast")
      .setDescription("Broadcast an existing announcement")
      .addStringOption((option) =>
        option
          .setName("announcement_id")
          .setDescription("The announcement ID to broadcast")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List recent announcements")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Verify admin permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "You need Administrator permissions to use this command.",
      ephemeral: true,
    });
    return;
  }

  // Also verify they're an admin on NxrthStack
  const nxrthUser = await getNxrthUser(interaction.user.id);
  if (!nxrthUser || nxrthUser.role !== "admin") {
    await interaction.reply({
      content: "You need to be a NxrthStack admin to create announcements.",
      ephemeral: true,
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "create":
      await handleCreate(interaction, nxrthUser.id);
      break;
    case "broadcast":
      await handleBroadcast(interaction);
      break;
    case "list":
      await handleList(interaction);
      break;
  }
}

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  authorId: string
) {
  await interaction.deferReply();

  const title = interaction.options.getString("title", true);
  const content = interaction.options.getString("content", true);
  const category = interaction.options.getString("category") || "general";
  const isPinned = interaction.options.getBoolean("pinned") || false;

  // Create the announcement in the database
  const [announcement] = await db
    .insert(gamehubAnnouncements)
    .values({
      title,
      content,
      category,
      isPinned,
      isActive: true,
      authorId,
    })
    .returning();

  const categoryEmoji: Record<string, string> = {
    update: "🆕",
    event: "🎉",
    maintenance: "🔧",
    community: "👥",
    general: "📢",
  };

  // Build announcement embed
  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(`${categoryEmoji[category]} ${title}`)
    .setDescription(content)
    .setFooter({ text: "nxrthstack.vercel.app • GameHub Announcement" })
    .setTimestamp();

  if (isPinned) {
    embed.setAuthor({ name: "📌 Pinned Announcement" });
  }

  // Get configured announcement channels for this guild
  const guildId = interaction.guildId;
  if (guildId) {
    const configs = await db
      .select()
      .from(webhookConfigs)
      .where(
        and(
          eq(webhookConfigs.guildId, guildId),
          eq(webhookConfigs.eventType, "announcements"),
          eq(webhookConfigs.isActive, true)
        )
      );

    // Broadcast to configured channels
    for (const config of configs) {
      try {
        const channel = await interaction.client.channels.fetch(config.channelId);
        if (channel && channel.isTextBased() && "send" in channel) {
          await channel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error(`Failed to send to channel ${config.channelId}:`, error);
      }
    }

    const channelCount = configs.length;
    await interaction.editReply({
      content: `Announcement created and broadcast to ${channelCount} channel(s)!`,
      embeds: [embed],
    });
  } else {
    await interaction.editReply({
      content: "Announcement created! Use `/announce broadcast` to send it to configured channels.",
      embeds: [embed],
    });
  }
}

async function handleBroadcast(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const announcementId = interaction.options.getString("announcement_id", true);

  // Find the announcement
  const announcements = await db
    .select()
    .from(gamehubAnnouncements)
    .where(eq(gamehubAnnouncements.isActive, true));

  const announcement = announcements.find(
    (a) => a.id.startsWith(announcementId) || a.id === announcementId
  );

  if (!announcement) {
    await interaction.editReply({
      content: "Announcement not found. Make sure you entered the correct ID.",
    });
    return;
  }

  const categoryEmoji: Record<string, string> = {
    update: "🆕",
    event: "🎉",
    maintenance: "🔧",
    community: "👥",
    general: "📢",
  };

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(
      `${categoryEmoji[announcement.category || "general"]} ${announcement.title}`
    )
    .setDescription(announcement.content || "")
    .setFooter({ text: "nxrthstack.vercel.app • GameHub Announcement" })
    .setTimestamp(announcement.createdAt || new Date());

  if (announcement.isPinned) {
    embed.setAuthor({ name: "📌 Pinned Announcement" });
  }

  // Get ALL configured announcement channels
  const configs = await db
    .select()
    .from(webhookConfigs)
    .where(
      and(
        eq(webhookConfigs.eventType, "announcements"),
        eq(webhookConfigs.isActive, true)
      )
    );

  let successCount = 0;
  for (const config of configs) {
    try {
      const channel = await interaction.client.channels.fetch(config.channelId);
      if (channel && channel.isTextBased() && "send" in channel) {
        await channel.send({ embeds: [embed] });
        successCount++;
      }
    } catch (error) {
      console.error(`Failed to send to channel ${config.channelId}:`, error);
    }
  }

  await interaction.editReply({
    content: `Announcement broadcast to ${successCount}/${configs.length} configured channel(s).`,
  });
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const announcements = await db
    .select()
    .from(gamehubAnnouncements)
    .where(eq(gamehubAnnouncements.isActive, true))
    .limit(10);

  if (announcements.length === 0) {
    await interaction.editReply({
      content: "No announcements found.",
    });
    return;
  }

  const categoryEmoji: Record<string, string> = {
    update: "🆕",
    event: "🎉",
    maintenance: "🔧",
    community: "👥",
    general: "📢",
  };

  const lines = announcements.map((a) => {
    const emoji = categoryEmoji[a.category || "general"];
    const pin = a.isPinned ? "📌 " : "";
    const date = a.createdAt?.toLocaleDateString() || "Unknown";
    return `${pin}${emoji} **${a.title}**\n└ ID: \`${a.id.slice(0, 8)}\` • ${date}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("Recent Announcements")
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: "Use /announce broadcast <id> to re-broadcast" });

  await interaction.editReply({ embeds: [embed] });
}
