import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db, users, friendships } from "../db.js";
import { eq, and, or, count } from "drizzle-orm";
import { getNxrthUser, requireLinked } from "../utils/permissions.js";
import { formatNumber } from "../utils/formatters.js";

export const data = new SlashCommandBuilder()
  .setName("friends")
  .setDescription("Friend system commands")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List your friends on NxrthStack")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Send a friend request")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to add as a friend")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("accept")
      .setDescription("Accept a pending friend request")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user whose request to accept")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("pending")
      .setDescription("View pending friend requests")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "list":
      await handleList(interaction);
      break;
    case "add":
      await handleAdd(interaction);
      break;
    case "accept":
      await handleAccept(interaction);
      break;
    case "pending":
      await handlePending(interaction);
      break;
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
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

  // Get accepted friendships
  const friendshipList = await db
    .select({
      id: friendships.id,
      friendId: friendships.friendId,
      userId: friendships.userId,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .where(
      and(
        or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id)),
        eq(friendships.status, "accepted")
      )
    )
    .limit(20);

  if (friendshipList.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle("Your Friends")
      .setDescription(
        "You don't have any friends on NxrthStack yet.\nUse `/friends add @user` to send a friend request!"
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get friend user details
  const friendIds = friendshipList.map((f) =>
    f.userId === user.id ? f.friendId : f.userId
  );

  const friendUsers = await db
    .select({
      id: users.id,
      name: users.name,
      discordUsername: users.discordUsername,
      discordId: users.discordId,
    })
    .from(users)
    .where(or(...friendIds.map((id) => eq(users.id, id))));

  const friendMap = new Map(friendUsers.map((u) => [u.id, u]));

  const friendLines = friendshipList.map((f) => {
    const friendId = f.userId === user.id ? f.friendId : f.userId;
    const friend = friendMap.get(friendId);
    const name = friend?.discordUsername || friend?.name || "Unknown";
    const mention = friend?.discordId ? `<@${friend.discordId}>` : name;
    return `- ${mention}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x6801ff)
    .setTitle(`Your Friends (${friendshipList.length})`)
    .setDescription(friendLines.join("\n"))
    .setFooter({ text: "Use /friends add @user to add more friends" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAdd(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const targetDiscordUser = interaction.options.getUser("user", true);

  if (targetDiscordUser.id === interaction.user.id) {
    await interaction.editReply({ content: "You can't add yourself as a friend!" });
    return;
  }

  if (targetDiscordUser.bot) {
    await interaction.editReply({ content: "You can't add a bot as a friend!" });
    return;
  }

  const friend = await getNxrthUser(targetDiscordUser.id);
  if (!friend) {
    await interaction.editReply({
      content: `${targetDiscordUser.username} hasn't linked their Discord to NxrthStack yet.`,
    });
    return;
  }

  // Check for existing friendship
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, user.id), eq(friendships.friendId, friend.id)),
        and(eq(friendships.userId, friend.id), eq(friendships.friendId, user.id))
      )
    )
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") {
      await interaction.editReply({
        content: `You're already friends with ${targetDiscordUser.username}!`,
      });
    } else if (existing.status === "pending") {
      if (existing.userId === user.id) {
        await interaction.editReply({
          content: `You already have a pending friend request to ${targetDiscordUser.username}.`,
        });
      } else {
        await interaction.editReply({
          content: `${targetDiscordUser.username} has already sent you a friend request! Use \`/friends accept @${targetDiscordUser.username}\` to accept.`,
        });
      }
    } else if (existing.status === "blocked") {
      await interaction.editReply({
        content: "Unable to send friend request.",
      });
    }
    return;
  }

  // Create friend request
  await db.insert(friendships).values({
    userId: user.id,
    friendId: friend.id,
    status: "pending",
  });

  const embed = new EmbedBuilder()
    .setColor(0x44ff44)
    .setTitle("Friend Request Sent!")
    .setDescription(`Friend request sent to **${targetDiscordUser.username}**!`)
    .addFields({
      name: "Next Steps",
      value: `${targetDiscordUser.username} needs to accept using:\n\`/friends accept @${interaction.user.username}\``,
    });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAccept(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  const targetDiscordUser = interaction.options.getUser("user", true);
  const requester = await getNxrthUser(targetDiscordUser.id);

  if (!requester) {
    await interaction.editReply({
      content: `${targetDiscordUser.username} hasn't linked their Discord to NxrthStack.`,
    });
    return;
  }

  // Find pending request FROM them TO us
  const [pendingRequest] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.userId, requester.id),
        eq(friendships.friendId, user.id),
        eq(friendships.status, "pending")
      )
    )
    .limit(1);

  if (!pendingRequest) {
    await interaction.editReply({
      content: `No pending friend request from ${targetDiscordUser.username}.`,
    });
    return;
  }

  // Accept the request
  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, pendingRequest.id));

  const embed = new EmbedBuilder()
    .setColor(0x44ff44)
    .setTitle("Friend Request Accepted!")
    .setDescription(`You are now friends with **${targetDiscordUser.username}**!`);

  await interaction.editReply({ embeds: [embed] });
}

async function handlePending(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  let user;
  try {
    user = await requireLinked(interaction.user.id);
  } catch {
    await interaction.editReply({
      content: "You need to link your Discord account first. Use `/link` to get started.",
    });
    return;
  }

  // Get pending requests TO the user
  const pendingRequests = await db
    .select({
      id: friendships.id,
      userId: friendships.userId,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .where(and(eq(friendships.friendId, user.id), eq(friendships.status, "pending")))
    .limit(10);

  if (pendingRequests.length === 0) {
    await interaction.editReply({
      content: "You have no pending friend requests.",
    });
    return;
  }

  // Get requester details
  const requesterIds = pendingRequests.map((r) => r.userId);
  const requesters = await db
    .select({
      id: users.id,
      name: users.name,
      discordUsername: users.discordUsername,
      discordId: users.discordId,
    })
    .from(users)
    .where(or(...requesterIds.map((id) => eq(users.id, id))));

  const requesterMap = new Map(requesters.map((u) => [u.id, u]));

  const lines = pendingRequests.map((r) => {
    const requester = requesterMap.get(r.userId);
    const name = requester?.discordUsername || requester?.name || "Unknown";
    const mention = requester?.discordId ? `<@${requester.discordId}>` : name;
    return `- ${mention}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle(`Pending Friend Requests (${pendingRequests.length})`)
    .setDescription(lines.join("\n"))
    .setFooter({ text: "Use /friends accept @user to accept" });

  await interaction.editReply({ embeds: [embed] });
}
