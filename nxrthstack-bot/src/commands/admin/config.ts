import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { db, webhookConfigs } from "../../db.js";
import { eq, and } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure bot settings for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("channel")
      .setDescription("Set a notification channel")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of notifications")
          .setRequired(true)
          .addChoices(
            { name: "Sessions", value: "sessions" },
            { name: "Achievements", value: "achievements" },
            { name: "Rivalries", value: "rivalries" },
            { name: "Announcements", value: "announcements" }
          )
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to send notifications to")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("disable")
      .setDescription("Disable notifications for a type")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of notifications to disable")
          .setRequired(true)
          .addChoices(
            { name: "Sessions", value: "sessions" },
            { name: "Achievements", value: "achievements" },
            { name: "Rivalries", value: "rivalries" },
            { name: "Announcements", value: "announcements" }
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("view").setDescription("View current notification settings")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "channel":
      await handleSetChannel(interaction);
      break;
    case "disable":
      await handleDisable(interaction);
      break;
    case "view":
      await handleView(interaction);
      break;
  }
}

async function handleSetChannel(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const type = interaction.options.getString("type", true);
  const channel = interaction.options.getChannel("channel", true);
  const guildId = interaction.guildId!;

  // Check for existing config
  const [existing] = await db
    .select()
    .from(webhookConfigs)
    .where(and(eq(webhookConfigs.guildId, guildId), eq(webhookConfigs.eventType, type)))
    .limit(1);

  if (existing) {
    // Update existing
    await db
      .update(webhookConfigs)
      .set({
        channelId: channel.id,
        isActive: true,
      })
      .where(eq(webhookConfigs.id, existing.id));
  } else {
    // Create new
    await db.insert(webhookConfigs).values({
      guildId,
      channelId: channel.id,
      eventType: type,
      isActive: true,
    });
  }

  const typeLabels: Record<string, string> = {
    sessions: "Gaming Sessions",
    achievements: "Achievement Unlocks",
    rivalries: "Rivalry Updates",
    announcements: "Announcements",
  };

  const embed = new EmbedBuilder()
    .setColor(0x44ff44)
    .setTitle("Configuration Updated")
    .setDescription(
      `**${typeLabels[type]}** notifications will now be sent to ${channel}.`
    )
    .setFooter({ text: "Use /config view to see all settings" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleDisable(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const type = interaction.options.getString("type", true);
  const guildId = interaction.guildId!;

  const [existing] = await db
    .select()
    .from(webhookConfigs)
    .where(and(eq(webhookConfigs.guildId, guildId), eq(webhookConfigs.eventType, type)))
    .limit(1);

  if (existing) {
    await db
      .update(webhookConfigs)
      .set({ isActive: false })
      .where(eq(webhookConfigs.id, existing.id));
  }

  const typeLabels: Record<string, string> = {
    sessions: "Gaming Sessions",
    achievements: "Achievement Unlocks",
    rivalries: "Rivalry Updates",
    announcements: "Announcements",
  };

  const embed = new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle("Notifications Disabled")
    .setDescription(`**${typeLabels[type]}** notifications have been disabled.`)
    .setFooter({ text: "Use /config channel to re-enable" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;

  const configs = await db
    .select()
    .from(webhookConfigs)
    .where(eq(webhookConfigs.guildId, guildId));

  const typeLabels: Record<string, string> = {
    sessions: "Gaming Sessions",
    achievements: "Achievement Unlocks",
    rivalries: "Rivalry Updates",
    announcements: "Announcements",
  };

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("Server Configuration")
    .setDescription("Current notification settings for this server");

  if (configs.length === 0) {
    embed.addFields({
      name: "No Configurations",
      value: "Use `/config channel` to set up notifications.",
    });
  } else {
    for (const config of configs) {
      const status = config.isActive ? "✅ Active" : "❌ Disabled";
      embed.addFields({
        name: typeLabels[config.eventType] || config.eventType,
        value: `Channel: <#${config.channelId}>\nStatus: ${status}`,
        inline: true,
      });
    }
  }

  // List unconfigured types
  const configuredTypes = configs.map((c) => c.eventType);
  const allTypes = ["sessions", "achievements", "rivalries", "announcements"];
  const unconfigured = allTypes.filter((t) => !configuredTypes.includes(t));

  if (unconfigured.length > 0) {
    embed.addFields({
      name: "Not Configured",
      value: unconfigured.map((t) => typeLabels[t]).join(", "),
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
