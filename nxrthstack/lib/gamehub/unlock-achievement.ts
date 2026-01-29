import { db } from "@/lib/db";
import { gamehubAchievements, userAchievements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notifyAchievementUnlocked } from "@/lib/notifications/gamehub";

/**
 * Unlock an achievement for a user
 * @param userId - The user's ID
 * @param achievementKey - The achievement key (e.g., "discord_connected")
 * @returns Object with success status and whether it was already unlocked
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: string
): Promise<{ success: boolean; alreadyUnlocked: boolean }> {
  try {
    // Find the achievement
    const [achievement] = await db
      .select()
      .from(gamehubAchievements)
      .where(eq(gamehubAchievements.key, achievementKey))
      .limit(1);

    if (!achievement) {
      console.error(`Achievement not found: ${achievementKey}`);
      return { success: false, alreadyUnlocked: false };
    }

    // Check if already unlocked
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id)
        )
      )
      .limit(1);

    if (existing) {
      return { success: true, alreadyUnlocked: true };
    }

    // Unlock the achievement
    await db.insert(userAchievements).values({
      userId,
      achievementId: achievement.id,
      unlockedAt: new Date(),
    });

    // Send notification
    await notifyAchievementUnlocked(
      userId,
      achievement.key,
      achievement.name,
      achievement.points
    );

    return { success: true, alreadyUnlocked: false };
  } catch (error) {
    console.error(`Failed to unlock achievement ${achievementKey}:`, error);
    return { success: false, alreadyUnlocked: false };
  }
}

/**
 * Check if a user has unlocked a specific achievement
 */
export async function hasAchievement(
  userId: string,
  achievementKey: string
): Promise<boolean> {
  try {
    const [achievement] = await db
      .select()
      .from(gamehubAchievements)
      .where(eq(gamehubAchievements.key, achievementKey))
      .limit(1);

    if (!achievement) return false;

    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id)
        )
      )
      .limit(1);

    return !!existing;
  } catch {
    return false;
  }
}
