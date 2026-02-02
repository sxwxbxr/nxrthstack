import { db, friendships, users, activityFeed } from "@/lib/db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export type FriendWithUser = {
  id: string;
  friendId: string;
  name: string | null;
  email: string;
  discordUsername: string | null;
  discordAvatar: string | null;
  status: string;
  createdAt: Date;
  acceptedAt: Date | null;
};

export type FriendRequest = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  discordUsername: string | null;
  discordAvatar: string | null;
  createdAt: Date;
};

// Get all accepted friends for a user
export async function getFriends(userId: string): Promise<FriendWithUser[]> {
  const friendsAsUser = await db
    .select({
      id: friendships.id,
      friendId: friendships.friendId,
      name: users.name,
      email: users.email,
      discordUsername: users.discordUsername,
      discordAvatar: users.discordAvatar,
      status: friendships.status,
      createdAt: friendships.createdAt,
      acceptedAt: friendships.acceptedAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.status, "accepted")
      )
    )
    .orderBy(desc(friendships.acceptedAt));

  const friendsAsFriend = await db
    .select({
      id: friendships.id,
      friendId: friendships.userId,
      name: users.name,
      email: users.email,
      discordUsername: users.discordUsername,
      discordAvatar: users.discordAvatar,
      status: friendships.status,
      createdAt: friendships.createdAt,
      acceptedAt: friendships.acceptedAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .where(
      and(
        eq(friendships.friendId, userId),
        eq(friendships.status, "accepted")
      )
    )
    .orderBy(desc(friendships.acceptedAt));

  return [...friendsAsUser, ...friendsAsFriend];
}

// Get pending friend requests (received)
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  return db
    .select({
      id: friendships.id,
      userId: friendships.userId,
      name: users.name,
      email: users.email,
      discordUsername: users.discordUsername,
      discordAvatar: users.discordAvatar,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .where(
      and(
        eq(friendships.friendId, userId),
        eq(friendships.status, "pending")
      )
    )
    .orderBy(desc(friendships.createdAt));
}

// Get sent friend requests
export async function getSentRequests(userId: string): Promise<FriendRequest[]> {
  return db
    .select({
      id: friendships.id,
      userId: friendships.friendId,
      name: users.name,
      email: users.email,
      discordUsername: users.discordUsername,
      discordAvatar: users.discordAvatar,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.status, "pending")
      )
    )
    .orderBy(desc(friendships.createdAt));
}

// Send a friend request
export async function sendFriendRequest(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  // Can't friend yourself
  if (userId === friendId) {
    return { success: false, error: "Cannot send friend request to yourself" };
  }

  // Check if friend exists and has GameHub access
  const friend = await db.query.users.findFirst({
    where: and(eq(users.id, friendId), eq(users.isFriend, true)),
  });

  if (!friend) {
    return { success: false, error: "User not found or doesn't have GameHub access" };
  }

  // Check for existing friendship
  const existing = await db.query.friendships.findFirst({
    where: or(
      and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
      and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
    ),
  });

  if (existing) {
    if (existing.status === "accepted") {
      return { success: false, error: "Already friends" };
    }
    if (existing.status === "pending") {
      return { success: false, error: "Friend request already pending" };
    }
    if (existing.status === "blocked") {
      return { success: false, error: "Unable to send request" };
    }
  }

  await db.insert(friendships).values({
    userId,
    friendId,
    status: "pending",
  });

  return { success: true };
}

// Accept a friend request
export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const request = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.id, requestId),
      eq(friendships.friendId, userId),
      eq(friendships.status, "pending")
    ),
  });

  if (!request) {
    return { success: false, error: "Friend request not found" };
  }

  await db
    .update(friendships)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(friendships.id, requestId));

  // Create activity for both users
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const requester = await db.query.users.findFirst({
    where: eq(users.id, request.userId),
  });

  if (user && requester) {
    await db.insert(activityFeed).values([
      {
        userId,
        activityType: "friend_added",
        title: `Became friends with ${requester.name || requester.email}`,
        metadata: { friendId: request.userId },
      },
      {
        userId: request.userId,
        activityType: "friend_added",
        title: `Became friends with ${user.name || user.email}`,
        metadata: { friendId: userId },
      },
    ]);
  }

  return { success: true };
}

// Decline a friend request
export async function declineFriendRequest(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const request = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.id, requestId),
      eq(friendships.friendId, userId),
      eq(friendships.status, "pending")
    ),
  });

  if (!request) {
    return { success: false, error: "Friend request not found" };
  }

  await db.delete(friendships).where(eq(friendships.id, requestId));

  return { success: true };
}

// Remove a friend
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await db
    .delete(friendships)
    .where(
      and(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        ),
        eq(friendships.status, "accepted")
      )
    );

  return { success: true };
}

// Search users to add as friends
export async function searchUsers(
  userId: string,
  query: string,
  limit = 10
): Promise<{ id: string; name: string | null; email: string; discordUsername: string | null }[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      discordUsername: users.discordUsername,
    })
    .from(users)
    .where(
      and(
        eq(users.isFriend, true),
        sql`(${users.name} ILIKE ${"%" + query + "%"} OR ${users.email} ILIKE ${"%" + query + "%"} OR ${users.discordUsername} ILIKE ${"%" + query + "%"})`,
        sql`${users.id} != ${userId}`
      )
    )
    .limit(limit);

  return results;
}

// Check if two users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await db.query.friendships.findFirst({
    where: and(
      or(
        and(eq(friendships.userId, userId1), eq(friendships.friendId, userId2)),
        and(eq(friendships.userId, userId2), eq(friendships.friendId, userId1))
      ),
      eq(friendships.status, "accepted")
    ),
  });

  return !!friendship;
}

// Get friend IDs for a user (useful for activity feed filtering)
export async function getFriendIds(userId: string): Promise<string[]> {
  const friends = await getFriends(userId);
  return friends.map((f) => f.friendId);
}
