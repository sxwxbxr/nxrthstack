import {
  db,
  activityFeed,
  activityLikes,
  activityComments,
  users,
} from "@/lib/db";
import { eq, desc, and, or, inArray, sql } from "drizzle-orm";
import { getFriendIds } from "./friends";

export type ActivityType =
  | "achievement_unlocked"
  | "session_joined"
  | "session_created"
  | "match_won"
  | "rivalry_update"
  | "clip_uploaded"
  | "friend_added"
  | "tournament_won"
  | "shiny_found";

export type ActivityWithDetails = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatar: string | null;
  activityType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  game: string | null;
  isPublic: boolean;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  isLikedByUser: boolean;
};

export type ActivityComment = {
  id: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  createdAt: Date;
};

// Create a new activity entry
export async function createActivity(data: {
  userId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  game?: string;
  isPublic?: boolean;
}): Promise<string> {
  const [activity] = await db
    .insert(activityFeed)
    .values({
      userId: data.userId,
      activityType: data.activityType,
      title: data.title,
      description: data.description,
      metadata: data.metadata || {},
      game: data.game,
      isPublic: data.isPublic ?? true,
    })
    .returning({ id: activityFeed.id });

  return activity.id;
}

// Get activity feed for a user (includes friends' public activities)
export async function getFeed(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    game?: string;
    type?: ActivityType;
    friendsOnly?: boolean;
  } = {}
): Promise<ActivityWithDetails[]> {
  const { limit = 20, offset = 0, game, type, friendsOnly = false } = options;

  // Get friend IDs
  const friendIds = await getFriendIds(userId);
  const relevantUserIds = friendsOnly ? friendIds : [userId, ...friendIds];

  if (relevantUserIds.length === 0) {
    return [];
  }

  // Build conditions
  const conditions = [
    or(
      // User's own activities (public and private)
      eq(activityFeed.userId, userId),
      // Friends' public activities
      and(
        inArray(activityFeed.userId, friendIds.length > 0 ? friendIds : [userId]),
        eq(activityFeed.isPublic, true)
      )
    ),
  ];

  if (game) {
    conditions.push(eq(activityFeed.game, game));
  }

  if (type) {
    conditions.push(eq(activityFeed.activityType, type));
  }

  // Get activities with user info
  const activities = await db
    .select({
      id: activityFeed.id,
      userId: activityFeed.userId,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.discordAvatar,
      activityType: activityFeed.activityType,
      title: activityFeed.title,
      description: activityFeed.description,
      metadata: activityFeed.metadata,
      game: activityFeed.game,
      isPublic: activityFeed.isPublic,
      createdAt: activityFeed.createdAt,
    })
    .from(activityFeed)
    .innerJoin(users, eq(activityFeed.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit)
    .offset(offset);

  // Get like counts and comment counts for each activity
  const activityIds = activities.map((a) => a.id);

  if (activityIds.length === 0) {
    return [];
  }

  const [likeCounts, commentCounts, userLikes] = await Promise.all([
    db
      .select({
        activityId: activityLikes.activityId,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLikes)
      .where(inArray(activityLikes.activityId, activityIds))
      .groupBy(activityLikes.activityId),
    db
      .select({
        activityId: activityComments.activityId,
        count: sql<number>`count(*)::int`,
      })
      .from(activityComments)
      .where(inArray(activityComments.activityId, activityIds))
      .groupBy(activityComments.activityId),
    db
      .select({ activityId: activityLikes.activityId })
      .from(activityLikes)
      .where(
        and(
          inArray(activityLikes.activityId, activityIds),
          eq(activityLikes.userId, userId)
        )
      ),
  ]);

  const likeCountMap = new Map(likeCounts.map((l) => [l.activityId, l.count]));
  const commentCountMap = new Map(commentCounts.map((c) => [c.activityId, c.count]));
  const userLikedSet = new Set(userLikes.map((l) => l.activityId));

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata as Record<string, unknown>,
    likeCount: likeCountMap.get(activity.id) || 0,
    commentCount: commentCountMap.get(activity.id) || 0,
    isLikedByUser: userLikedSet.has(activity.id),
  }));
}

// Get a user's own activities
export async function getUserActivities(
  userId: string,
  limit = 20
): Promise<ActivityWithDetails[]> {
  return getFeed(userId, { limit, friendsOnly: false });
}

// Like an activity
export async function likeActivity(
  userId: string,
  activityId: string
): Promise<{ success: boolean; liked: boolean }> {
  // Check if already liked
  const existing = await db.query.activityLikes.findFirst({
    where: and(
      eq(activityLikes.activityId, activityId),
      eq(activityLikes.userId, userId)
    ),
  });

  if (existing) {
    // Unlike
    await db
      .delete(activityLikes)
      .where(
        and(
          eq(activityLikes.activityId, activityId),
          eq(activityLikes.userId, userId)
        )
      );
    return { success: true, liked: false };
  }

  // Like
  await db.insert(activityLikes).values({
    activityId,
    userId,
  });

  return { success: true, liked: true };
}

// Get comments for an activity
export async function getActivityComments(
  activityId: string
): Promise<ActivityComment[]> {
  return db
    .select({
      id: activityComments.id,
      userId: activityComments.userId,
      userName: users.name,
      userAvatar: users.discordAvatar,
      content: activityComments.content,
      createdAt: activityComments.createdAt,
    })
    .from(activityComments)
    .innerJoin(users, eq(activityComments.userId, users.id))
    .where(eq(activityComments.activityId, activityId))
    .orderBy(activityComments.createdAt);
}

// Add a comment to an activity
export async function addComment(
  userId: string,
  activityId: string,
  content: string
): Promise<{ success: boolean; comment?: ActivityComment }> {
  if (!content.trim() || content.length > 500) {
    return { success: false };
  }

  const [comment] = await db
    .insert(activityComments)
    .values({
      activityId,
      userId,
      content: content.trim(),
    })
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return {
    success: true,
    comment: {
      id: comment.id,
      userId: comment.userId,
      userName: user?.name || null,
      userAvatar: user?.discordAvatar || null,
      content: comment.content,
      createdAt: comment.createdAt,
    },
  };
}

// Delete a comment
export async function deleteComment(
  userId: string,
  commentId: string
): Promise<boolean> {
  const result = await db
    .delete(activityComments)
    .where(
      and(eq(activityComments.id, commentId), eq(activityComments.userId, userId))
    );

  return true;
}

// Delete an activity (only owner can delete)
export async function deleteActivity(
  userId: string,
  activityId: string
): Promise<boolean> {
  await db
    .delete(activityFeed)
    .where(and(eq(activityFeed.id, activityId), eq(activityFeed.userId, userId)));

  return true;
}
