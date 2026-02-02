import {
  db,
  userProfiles,
  profileViews,
  users,
  userAchievements,
  gamehubAchievements,
  rivalryStats,
  r6Matches,
} from "@/lib/db";
import { eq, desc, sql, and } from "drizzle-orm";

export type UserProfileData = {
  id: string;
  userId: string;
  usernameSlug: string | null;
  bio: string | null;
  bannerUrl: string | null;
  featuredAchievements: string[];
  socialLinks: Record<string, string>;
  isPublic: boolean;
  showStats: boolean;
  showActivity: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProfileData = UserProfileData & {
  user: {
    name: string | null;
    email: string;
    discordUsername: string | null;
    discordAvatar: string | null;
  };
  stats: {
    achievementPoints: number;
    achievementCount: number;
    rivalryWins: number;
    r6Wins: number;
  };
  achievements: {
    id: string;
    key: string;
    name: string;
    icon: string | null;
    rarity: string | null;
    unlockedAt: Date;
  }[];
  viewCount: number;
};

// Get or create user profile
export async function getOrCreateProfile(userId: string): Promise<UserProfileData> {
  let profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!profile) {
    // Create default profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Generate a unique slug from username or email
    const baseSlug = (user?.name || user?.email?.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40);

    let slug = baseSlug;
    let counter = 1;

    // Ensure uniqueness
    while (true) {
      const existing = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.usernameSlug, slug),
      });
      if (!existing) break;
      slug = `${baseSlug}${counter}`;
      counter++;
    }

    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        userId,
        usernameSlug: slug,
        isPublic: true,
        showStats: true,
        showActivity: true,
      })
      .returning();

    profile = newProfile;
  }

  return {
    ...profile,
    featuredAchievements: (profile.featuredAchievements as string[]) || [],
    socialLinks: (profile.socialLinks as Record<string, string>) || {},
  };
}

// Get public profile by username slug
export async function getPublicProfile(
  usernameSlug: string
): Promise<PublicProfileData | null> {
  const profile = await db.query.userProfiles.findFirst({
    where: and(
      eq(userProfiles.usernameSlug, usernameSlug),
      eq(userProfiles.isPublic, true)
    ),
  });

  if (!profile) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, profile.userId),
  });

  if (!user) return null;

  // Get stats
  const [achievementData, rivalryData, r6Data, viewCount] = await Promise.all([
    // Achievement stats
    db
      .select({
        points: sql<number>`coalesce(sum(${gamehubAchievements.points}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(userAchievements)
      .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
      .where(eq(userAchievements.userId, profile.userId)),

    // Rivalry wins
    db
      .select({
        wins: sql<number>`coalesce(sum(${rivalryStats.wins}), 0)::int`,
      })
      .from(rivalryStats)
      .where(eq(rivalryStats.userId, profile.userId)),

    // R6 wins
    db
      .select({
        wins: sql<number>`count(*)::int`,
      })
      .from(r6Matches)
      .where(eq(r6Matches.winnerId, profile.userId)),

    // View count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profileViews)
      .where(eq(profileViews.profileId, profile.id)),
  ]);

  // Get featured achievements or recent ones
  const featuredIds = (profile.featuredAchievements as string[]) || [];
  let achievements: {
    id: string;
    key: string;
    name: string;
    icon: string | null;
    rarity: string | null;
    unlockedAt: Date;
  }[] = [];

  if (featuredIds.length > 0 && profile.showStats) {
    achievements = await db
      .select({
        id: gamehubAchievements.id,
        key: gamehubAchievements.key,
        name: gamehubAchievements.name,
        icon: gamehubAchievements.icon,
        rarity: gamehubAchievements.rarity,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
      .where(
        and(
          eq(userAchievements.userId, profile.userId),
          sql`${gamehubAchievements.id} = ANY(${featuredIds})`
        )
      )
      .limit(6);
  } else if (profile.showStats) {
    // Get recent achievements
    achievements = await db
      .select({
        id: gamehubAchievements.id,
        key: gamehubAchievements.key,
        name: gamehubAchievements.name,
        icon: gamehubAchievements.icon,
        rarity: gamehubAchievements.rarity,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
      .where(eq(userAchievements.userId, profile.userId))
      .orderBy(desc(userAchievements.unlockedAt))
      .limit(6);
  } else {
    achievements = [];
  }

  return {
    ...profile,
    featuredAchievements: (profile.featuredAchievements as string[]) || [],
    socialLinks: (profile.socialLinks as Record<string, string>) || {},
    user: {
      name: user.name,
      email: user.email,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
    },
    stats: profile.showStats
      ? {
          achievementPoints: achievementData[0]?.points || 0,
          achievementCount: achievementData[0]?.count || 0,
          rivalryWins: rivalryData[0]?.wins || 0,
          r6Wins: r6Data[0]?.wins || 0,
        }
      : {
          achievementPoints: 0,
          achievementCount: 0,
          rivalryWins: 0,
          r6Wins: 0,
        },
    achievements,
    viewCount: viewCount[0]?.count || 0,
  };
}

// Update profile
export async function updateProfile(
  userId: string,
  data: {
    bio?: string;
    bannerUrl?: string;
    usernameSlug?: string;
    socialLinks?: Record<string, string>;
    isPublic?: boolean;
    showStats?: boolean;
    showActivity?: boolean;
    featuredAchievements?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  // Check username uniqueness
  if (data.usernameSlug) {
    const existing = await db.query.userProfiles.findFirst({
      where: and(
        eq(userProfiles.usernameSlug, data.usernameSlug),
        sql`${userProfiles.userId} != ${userId}`
      ),
    });

    if (existing) {
      return { success: false, error: "Username already taken" };
    }

    // Validate username format
    if (!/^[a-z0-9_-]{3,50}$/.test(data.usernameSlug)) {
      return {
        success: false,
        error: "Username must be 3-50 characters, lowercase letters, numbers, underscores, or hyphens",
      };
    }
  }

  await db
    .update(userProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));

  return { success: true };
}

// Track profile view
export async function trackProfileView(
  profileId: string,
  viewerId?: string
): Promise<void> {
  await db.insert(profileViews).values({
    profileId,
    viewerId,
  });
}

// Get user's achievements for featuring
export async function getUserAchievements(userId: string) {
  return db
    .select({
      id: gamehubAchievements.id,
      key: gamehubAchievements.key,
      name: gamehubAchievements.name,
      icon: gamehubAchievements.icon,
      rarity: gamehubAchievements.rarity,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
}
