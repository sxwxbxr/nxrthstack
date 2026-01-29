import { db } from "@/lib/db";
import { notifications, notificationPreferences } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray, isNull, or, gt } from "drizzle-orm";
import {
  NotificationType,
  NotificationMetadata,
  NOTIFICATION_CONFIG,
} from "./types";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title?: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: NotificationMetadata;
  expiresAt?: Date;
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string }> {
  try {
    const config = NOTIFICATION_CONFIG[params.type];

    // Check user preferences
    const preferences = await getUserPreferences(params.userId);
    if (!shouldSendNotification(params.type, preferences)) {
      return { success: true }; // Silently skip if user disabled this type
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        category: config.category,
        title: params.title || config.defaultTitle,
        message: params.message,
        actionUrl: params.actionUrl,
        actionLabel: params.actionLabel,
        metadata: params.metadata || {},
        emailEnabled: config.emailEligible,
        expiresAt: params.expiresAt,
      })
      .returning();

    return { success: true, notificationId: notification.id };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false };
  }
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<{ success: boolean; count: number }> {
  try {
    if (userIds.length === 0) {
      return { success: true, count: 0 };
    }

    const config = NOTIFICATION_CONFIG[params.type];

    // Fetch all user preferences in one query
    const allPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(inArray(notificationPreferences.userId, userIds));

    const preferencesMap = new Map(
      allPreferences.map((p) => [p.userId, p])
    );

    // Filter users based on preferences
    const eligibleUserIds = userIds.filter((userId) => {
      const prefs = preferencesMap.get(userId);
      return shouldSendNotification(params.type, prefs);
    });

    if (eligibleUserIds.length === 0) {
      return { success: true, count: 0 };
    }

    const notificationValues = eligibleUserIds.map((userId) => ({
      userId,
      type: params.type,
      category: config.category,
      title: params.title || config.defaultTitle,
      message: params.message,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      metadata: params.metadata || {},
      emailEnabled: config.emailEligible,
      expiresAt: params.expiresAt,
    }));

    await db.insert(notifications).values(notificationValues);

    return { success: true, count: eligibleUserIds.length };
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
    return { success: false, count: 0 };
  }
}

export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false, category } = options;

  const conditions = [
    eq(notifications.userId, userId),
    or(
      isNull(notifications.expiresAt),
      gt(notifications.expiresAt, new Date())
    ),
  ];

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  if (category) {
    conditions.push(eq(notifications.category, category));
  }

  const results = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        or(
          isNull(notifications.expiresAt),
          gt(notifications.expiresAt, new Date())
        )
      )
    );

  return result?.count || 0;
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    return true;
  } catch {
    return false;
  }
}

export async function markAllAsRead(
  userId: string,
  category?: string
): Promise<boolean> {
  try {
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ];

    if (category) {
      conditions.push(eq(notifications.category, category));
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(...conditions));

    return true;
  } catch {
    return false;
  }
}

export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    return true;
  } catch {
    return false;
  }
}

export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return prefs;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<
    Omit<typeof notificationPreferences.$inferInsert, "id" | "userId">
  >
): Promise<boolean> {
  try {
    const existing = await getUserPreferences(userId);

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId));
    } else {
      await db.insert(notificationPreferences).values({
        userId,
        ...updates,
      });
    }

    return true;
  } catch {
    return false;
  }
}

function shouldSendNotification(
  type: NotificationType,
  preferences: typeof notificationPreferences.$inferSelect | undefined
): boolean {
  if (!preferences) return true; // Default to enabled if no preferences set

  switch (type) {
    case "achievement_unlocked":
      return preferences.gamehubAchievements;
    case "lobby_invite":
    case "lobby_joined":
    case "lobby_opponent_left":
      return preferences.gamehubLobbyInvites;
    case "match_completed":
    case "match_recorded":
      return preferences.gamehubMatchResults;
    case "tournament_registration_open":
    case "tournament_match_scheduled":
    case "tournament_match_ready":
    case "tournament_eliminated":
    case "tournament_won":
      return preferences.gamehubTournaments;
    case "gamehub_announcement":
      return preferences.gamehubAnnouncements;
    case "product_update_available":
    case "product_news":
      return preferences.productUpdates;
    case "system_announcement":
    case "welcome":
      return preferences.systemAnnouncements;
    default:
      return true;
  }
}
