import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, gamingSessions, users, sessionRsvps } from "../../db.js";
import { eq, gte, and, count } from "drizzle-orm";
import { GAME_CHOICES, GAME_COLORS } from "../../types/index.js";
import { formatDiscordTime, formatRelativeTime, formatDuration } from "../../utils/formatters.js";

export const data = new SlashCommandBuilder()
  .setName("session")
  .setDescription("Gaming session commands")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List upcoming gaming sessions")
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription("Filter by game")
          .setRequired(false)
          .addChoices(...GAME_CHOICES)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a new gaming session")
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription("The game to play")
          .setRequired(true)
          .addChoices(...GAME_CHOICES)
      )
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Session title (optional)")
          .setRequired(false)
      )
      .addIntegerOption((option) =>
        option
          .setName("hours")
          .setDescription("Hours from now to start (default: 1)")
          .setRequired(false)
          .setMinValue(0)
          .setMaxValue(168)
      )
      .addIntegerOption((option) =>
        option
          .setName("duration")
          .setDescription("Duration in minutes (default: 60)")
          .setRequired(false)
          .setMinValue(15)
          .setMaxValue(480)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("join")
      .setDescription("RSVP to a gaming session")
      .addStringOption((option) =>
        option
          .setName("session_id")
          .setDescription("The session ID to join")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("Your RSVP status")
          .setRequired(false)
          .addChoices(
            { name: "Going", value: "going" },
            { name: "Maybe", value: "maybe" },
            { name: "Not Going", value: "not_going" }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "list":
      await handleList(interaction);
      break;
    case "create":
      await handleCreate(interaction);
      break;
    case "join":
      await handleJoin(interaction);
      break;
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const gameFilter = interaction.options.getString("game");
  const now = new Date();

  // Build query conditions
  const conditions = [
    gte(gamingSessions.scheduledAt, now),
    eq(gamingSessions.status, "scheduled"),
    eq(gamingSessions.isPrivate, false),
  ];

  if (gameFilter) {
    conditions.push(eq(gamingSessions.game, gameFilter));
  }

  // Get upcoming sessions
  const sessions = await db
    .select({
      id: gamingSessions.id,
      title: gamingSessions.title,
      game: gamingSessions.game,
      scheduledAt: gamingSessions.scheduledAt,
      durationMinutes: gamingSessions.durationMinutes,
      maxParticipants: gamingSessions.maxParticipants,
      hostName: users.name,
      hostDiscord: users.discordUsername,
    })
    .from(gamingSessions)
    .innerJoin(users, eq(gamingSessions.hostId, users.id))
    .where(and(...conditions))
    .orderBy(gamingSessions.scheduledAt)
    .limit(10);

  if (sessions.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle("No Upcoming Sessions")
      .setDescription(
        gameFilter
          ? `No ${GAME_COLORS[gameFilter]?.name || gameFilter} sessions scheduled.`
          : "No gaming sessions scheduled. Use `/session create` to start one!"
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get RSVP counts for each session
  const sessionIds = sessions.map((s) => s.id);
  const rsvpCounts = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const [result] = await db
        .select({ count: count() })
        .from(sessionRsvps)
        .where(and(eq(sessionRsvps.sessionId, sessionId), eq(sessionRsvps.status, "going")));
      return { sessionId, count: result?.count || 0 };
    })
  );

  const rsvpMap = new Map(rsvpCounts.map((r) => [r.sessionId, r.count]));

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle("Upcoming Gaming Sessions")
    .setDescription(`Found ${sessions.length} upcoming session(s)`);

  for (const session of sessions.slice(0, 5)) {
    const gameInfo = GAME_COLORS[session.game] || GAME_COLORS.other;
    const going = rsvpMap.get(session.id) || 0;
    const participants = session.maxParticipants
      ? `${going}/${session.maxParticipants}`
      : `${going}`;

    embed.addFields({
      name: `${session.title || gameInfo.name}`,
      value: [
        `**Game:** ${gameInfo.name}`,
        `**When:** ${formatDiscordTime(session.scheduledAt)} (${formatRelativeTime(session.scheduledAt)})`,
        `**Duration:** ${formatDuration(session.durationMinutes || 60)}`,
        `**Host:** ${session.hostDiscord || session.hostName || "Unknown"}`,
        `**Going:** ${participants}`,
        `\`ID: ${session.id.slice(0, 8)}\``,
      ].join("\n"),
      inline: false,
    });
  }

  embed.setFooter({ text: "Use /session join <id> to RSVP" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Import permission check
  const { requireLinked } = await import("../../utils/permissions.js");

  let nxrthUser;
  try {
    nxrthUser = await requireLinked(interaction.user.id);
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("Account Not Linked")
      .setDescription("You need to link your Discord account first. Use `/link` to get started.");

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const game = interaction.options.getString("game", true);
  const title = interaction.options.getString("title");
  const hoursFromNow = interaction.options.getInteger("hours") ?? 1;
  const duration = interaction.options.getInteger("duration") ?? 60;

  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + hoursFromNow);

  const gameInfo = GAME_COLORS[game] || GAME_COLORS.other;
  const sessionTitle = title || `${interaction.user.username}'s ${gameInfo.name} Session`;

  // Create session
  const [session] = await db
    .insert(gamingSessions)
    .values({
      hostId: nxrthUser.id,
      title: sessionTitle,
      game,
      scheduledAt,
      durationMinutes: duration,
      status: "scheduled",
    })
    .returning();

  // Auto-RSVP host as going
  await db.insert(sessionRsvps).values({
    sessionId: session.id,
    userId: nxrthUser.id,
    status: "going",
    respondedAt: new Date(),
  });

  const embed = new EmbedBuilder()
    .setColor(gameInfo.color)
    .setTitle("Session Created!")
    .setDescription(`Your ${gameInfo.name} session has been scheduled.`)
    .addFields(
      { name: "Title", value: sessionTitle, inline: true },
      { name: "Game", value: gameInfo.name, inline: true },
      { name: "Duration", value: formatDuration(duration), inline: true },
      {
        name: "Starts",
        value: `${formatDiscordTime(scheduledAt)}\n(${formatRelativeTime(scheduledAt)})`,
      },
      { name: "Session ID", value: `\`${session.id.slice(0, 8)}\``, inline: true }
    )
    .setFooter({ text: "Share the session ID with friends so they can join!" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const { requireLinked } = await import("../../utils/permissions.js");

  let nxrthUser;
  try {
    nxrthUser = await requireLinked(interaction.user.id);
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("Account Not Linked")
      .setDescription("You need to link your Discord account first. Use `/link` to get started.");

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const sessionIdInput = interaction.options.getString("session_id", true);
  const status = interaction.options.getString("status") || "going";

  // Find session (supports partial ID)
  const [session] = await db
    .select()
    .from(gamingSessions)
    .where(eq(gamingSessions.status, "scheduled"))
    .limit(100);

  const matchingSession = await db
    .select({
      id: gamingSessions.id,
      title: gamingSessions.title,
      game: gamingSessions.game,
      scheduledAt: gamingSessions.scheduledAt,
    })
    .from(gamingSessions)
    .where(eq(gamingSessions.status, "scheduled"))
    .then((sessions) =>
      sessions.find((s) => s.id.startsWith(sessionIdInput) || s.id === sessionIdInput)
    );

  if (!matchingSession) {
    await interaction.editReply({
      content: "Session not found. Make sure you entered the correct ID.",
    });
    return;
  }

  // Check if already RSVP'd
  const [existingRsvp] = await db
    .select()
    .from(sessionRsvps)
    .where(
      and(
        eq(sessionRsvps.sessionId, matchingSession.id),
        eq(sessionRsvps.userId, nxrthUser.id)
      )
    )
    .limit(1);

  if (existingRsvp) {
    // Update existing RSVP
    await db
      .update(sessionRsvps)
      .set({ status, respondedAt: new Date() })
      .where(eq(sessionRsvps.id, existingRsvp.id));
  } else {
    // Create new RSVP
    await db.insert(sessionRsvps).values({
      sessionId: matchingSession.id,
      userId: nxrthUser.id,
      status,
      respondedAt: new Date(),
    });
  }

  const statusEmoji = status === "going" ? "✅" : status === "maybe" ? "🤔" : "❌";
  const gameInfo = GAME_COLORS[matchingSession.game] || GAME_COLORS.other;

  const embed = new EmbedBuilder()
    .setColor(gameInfo.color)
    .setTitle(`${statusEmoji} RSVP Updated`)
    .setDescription(
      `You're now marked as **${status.replace("_", " ")}** for **${matchingSession.title}**`
    )
    .addFields({
      name: "Session Time",
      value: `${formatDiscordTime(matchingSession.scheduledAt)} (${formatRelativeTime(matchingSession.scheduledAt)})`,
    });

  await interaction.editReply({ embeds: [embed] });
}
