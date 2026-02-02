import {
  db,
  leaderboardEntries,
  users,
  userAchievements,
  gamehubAchievements,
  r6Matches,
  r6Lobbies,
  rivalryStats,
  gamingSessions,
} from "@/lib/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export type LeaderboardCategory =
  | "achievement_points"
  | "r6_wins"
  | "r6_kd"
  | "rivalry_wins"
  | "sessions_hosted";

export type LeaderboardPeriod = "weekly" | "monthly" | "all_time";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatar: string | null;
  score: number;
  isCurrentUser: boolean;
};

export type LeaderboardData = {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  userRank: number | null;
  userScore: number | null;
};

const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  achievement_points: "Achievement Points",
  r6_wins: "R6 1v1 Wins",
  r6_kd: "R6 K/D Ratio",
  rivalry_wins: "Rivalry Wins",
  sessions_hosted: "Sessions Hosted",
};

// Get leaderboard for a category
export async function getLeaderboard(
  userId: string,
  category: LeaderboardCategory,
  period: LeaderboardPeriod = "all_time",
  limit = 50
): Promise<LeaderboardData> {
  let entries: LeaderboardEntry[] = [];
  let userRank: number | null = null;
  let userScore: number | null = null;

  // Get period start date
  const periodStart = getPeriodStart(period);

  switch (category) {
    case "achievement_points":
      const pointsData = await getAchievementPointsLeaderboard(periodStart, limit);
      entries = pointsData.entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        isCurrentUser: e.userId === userId,
      }));
      const userPoints = pointsData.entries.find((e) => e.userId === userId);
      if (userPoints) {
        userRank = pointsData.entries.findIndex((e) => e.userId === userId) + 1;
        userScore = userPoints.score;
      }
      break;

    case "r6_wins":
      const r6Data = await getR6WinsLeaderboard(periodStart, limit);
      entries = r6Data.entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        isCurrentUser: e.userId === userId,
      }));
      const userR6 = r6Data.entries.find((e) => e.userId === userId);
      if (userR6) {
        userRank = r6Data.entries.findIndex((e) => e.userId === userId) + 1;
        userScore = userR6.score;
      }
      break;

    case "rivalry_wins":
      const rivalryData = await getRivalryWinsLeaderboard(limit);
      entries = rivalryData.entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        isCurrentUser: e.userId === userId,
      }));
      const userRivalry = rivalryData.entries.find((e) => e.userId === userId);
      if (userRivalry) {
        userRank = rivalryData.entries.findIndex((e) => e.userId === userId) + 1;
        userScore = userRivalry.score;
      }
      break;

    case "sessions_hosted":
      const sessionsData = await getSessionsHostedLeaderboard(periodStart, limit);
      entries = sessionsData.entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        isCurrentUser: e.userId === userId,
      }));
      const userSessions = sessionsData.entries.find((e) => e.userId === userId);
      if (userSessions) {
        userRank = sessionsData.entries.findIndex((e) => e.userId === userId) + 1;
        userScore = userSessions.score;
      }
      break;

    default:
      break;
  }

  return {
    category,
    period,
    entries,
    userRank,
    userScore,
  };
}

// Get achievement points leaderboard
async function getAchievementPointsLeaderboard(
  periodStart: Date | null,
  limit: number
) {
  const whereClause = periodStart
    ? gte(userAchievements.unlockedAt, periodStart)
    : undefined;

  const results = await db
    .select({
      userId: userAchievements.userId,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.discordAvatar,
      score: sql<number>`sum(${gamehubAchievements.points})::int`,
    })
    .from(userAchievements)
    .innerJoin(users, eq(userAchievements.userId, users.id))
    .innerJoin(gamehubAchievements, eq(userAchievements.achievementId, gamehubAchievements.id))
    .where(whereClause)
    .groupBy(userAchievements.userId, users.id)
    .orderBy(desc(sql`sum(${gamehubAchievements.points})`))
    .limit(limit);

  return {
    entries: results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userAvatar: r.userAvatar,
      score: r.score || 0,
    })),
  };
}

// Get R6 1v1 wins leaderboard
async function getR6WinsLeaderboard(periodStart: Date | null, limit: number) {
  const whereClause = periodStart
    ? gte(r6Matches.createdAt, periodStart)
    : undefined;

  const results = await db
    .select({
      userId: r6Matches.winnerId,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.discordAvatar,
      score: sql<number>`count(*)::int`,
    })
    .from(r6Matches)
    .innerJoin(users, eq(r6Matches.winnerId, users.id))
    .where(whereClause)
    .groupBy(r6Matches.winnerId, users.id)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return {
    entries: results.map((r) => ({
      userId: r.userId!,
      userName: r.userName,
      userEmail: r.userEmail,
      userAvatar: r.userAvatar,
      score: r.score || 0,
    })),
  };
}

// Get rivalry wins leaderboard
async function getRivalryWinsLeaderboard(limit: number) {
  const results = await db
    .select({
      userId: rivalryStats.userId,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.discordAvatar,
      score: sql<number>`sum(${rivalryStats.wins})::int`,
    })
    .from(rivalryStats)
    .innerJoin(users, eq(rivalryStats.userId, users.id))
    .groupBy(rivalryStats.userId, users.id)
    .orderBy(desc(sql`sum(${rivalryStats.wins})`))
    .limit(limit);

  return {
    entries: results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userAvatar: r.userAvatar,
      score: r.score || 0,
    })),
  };
}

// Get sessions hosted leaderboard
async function getSessionsHostedLeaderboard(
  periodStart: Date | null,
  limit: number
) {
  const whereClause = periodStart
    ? gte(gamingSessions.createdAt, periodStart)
    : undefined;

  const results = await db
    .select({
      userId: gamingSessions.hostId,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.discordAvatar,
      score: sql<number>`count(*)::int`,
    })
    .from(gamingSessions)
    .innerJoin(users, eq(gamingSessions.hostId, users.id))
    .where(whereClause)
    .groupBy(gamingSessions.hostId, users.id)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return {
    entries: results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userAvatar: r.userAvatar,
      score: r.score || 0,
    })),
  };
}

// Get period start date
function getPeriodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case "weekly":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;

    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case "all_time":
    default:
      return null;
  }
}

// Get all available categories
export function getLeaderboardCategories(): {
  value: LeaderboardCategory;
  label: string;
}[] {
  return Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as LeaderboardCategory,
    label,
  }));
}

// Get user's rank in a specific category
export async function getUserRank(
  userId: string,
  category: LeaderboardCategory,
  period: LeaderboardPeriod = "all_time"
): Promise<{ rank: number | null; score: number | null }> {
  const data = await getLeaderboard(userId, category, period, 1000);
  return {
    rank: data.userRank,
    score: data.userScore,
  };
}
