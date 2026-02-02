import { db } from "@/lib/db";
import {
  users,
  r6Lobbies,
  r6Matches,
  r6Tournaments,
  r6TournamentParticipants,
  r6TournamentGames,
  userAchievements,
  gamehubAchievements,
  streamOverlays,
  featureRequests,
} from "@/lib/db/schema";
import { eq, and, or, count, sum, desc } from "drizzle-orm";
import { ACHIEVEMENT_DEFINITIONS, calculateTotalPoints } from "./achievements";

export interface R6Stats {
  totalLobbies: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  tournamentsJoined: number;
  tournamentsWon: number;
  recentMatches: Array<{
    date: Date;
    won: boolean;
    kills: number;
    deaths: number;
  }>;
}

export interface AchievementStats {
  totalUnlocked: number;
  totalAvailable: number;
  totalPoints: number;
  maxPoints: number;
  byCategory: Record<string, { unlocked: number; total: number }>;
  recentUnlocks: Array<{
    key: string;
    name: string;
    unlockedAt: Date;
    points: number;
  }>;
}

export interface OverviewStats {
  discordConnected: boolean;
  discordUsername: string | null;
  memberSince: Date;
  totalOverlays: number;
  totalFeedback: number;
}

export interface GamingStats {
  r6: R6Stats;
  achievements: AchievementStats;
  overview: OverviewStats;
}

/**
 * Get comprehensive gaming statistics for a user
 */
export async function getGamingStats(userId: string): Promise<GamingStats> {
  const [r6Stats, achievementStats, overviewStats] = await Promise.all([
    getR6Stats(userId),
    getAchievementStats(userId),
    getOverviewStats(userId),
  ]);

  return {
    r6: r6Stats,
    achievements: achievementStats,
    overview: overviewStats,
  };
}

/**
 * Get R6 1v1 statistics
 */
async function getR6Stats(userId: string): Promise<R6Stats> {
  // Get lobby count where user is host or opponent
  const lobbiesResult = await db
    .select({ count: count() })
    .from(r6Lobbies)
    .where(or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId)));
  const totalLobbies = lobbiesResult[0]?.count ?? 0;

  // Get all lobbies user participated in
  const userLobbies = await db
    .select({ id: r6Lobbies.id, hostId: r6Lobbies.hostId })
    .from(r6Lobbies)
    .where(or(eq(r6Lobbies.hostId, userId), eq(r6Lobbies.opponentId, userId)));

  const lobbyIds = userLobbies.map((l) => l.id);

  // Get match statistics
  let totalMatches = 0;
  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  const recentMatches: R6Stats["recentMatches"] = [];

  if (lobbyIds.length > 0) {
    const matches = await db
      .select()
      .from(r6Matches)
      .where(
        or(...lobbyIds.map((id) => eq(r6Matches.lobbyId, id)))
      )
      .orderBy(desc(r6Matches.createdAt))
      .limit(100);

    totalMatches = matches.length;

    // Create a map of lobbyId -> hostId for quick lookup
    const lobbyHostMap = new Map(userLobbies.map((l) => [l.id, l.hostId]));

    for (const match of matches) {
      const isHost = lobbyHostMap.get(match.lobbyId) === userId;
      const won = match.winnerId === userId;

      if (match.winnerId) {
        if (won) wins++;
        else losses++;
      }

      // Calculate kills/deaths based on position
      const myKills = isHost
        ? (match.player1Kills ?? 0)
        : (match.player2Kills ?? 0);
      const myDeaths = isHost
        ? (match.player1Deaths ?? 0)
        : (match.player2Deaths ?? 0);

      totalKills += myKills;
      totalDeaths += myDeaths;

      // Add to recent matches (first 5)
      if (recentMatches.length < 5) {
        recentMatches.push({
          date: match.createdAt,
          won,
          kills: myKills,
          deaths: myDeaths,
        });
      }
    }
  }

  // Get tournament stats
  const tournamentParticipation = await db
    .select()
    .from(r6TournamentParticipants)
    .where(eq(r6TournamentParticipants.userId, userId));

  const tournamentsJoined = tournamentParticipation.length;
  const tournamentsWon = tournamentParticipation.filter(
    (p) => p.finalPlacement === 1
  ).length;

  // Add tournament kills/deaths
  for (const p of tournamentParticipation) {
    totalKills += p.totalKills;
    totalDeaths += p.totalDeaths;
  }

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const kdRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

  return {
    totalLobbies,
    totalMatches,
    wins,
    losses,
    winRate: Math.round(winRate * 10) / 10,
    totalKills,
    totalDeaths,
    kdRatio: Math.round(kdRatio * 100) / 100,
    tournamentsJoined,
    tournamentsWon,
    recentMatches,
  };
}

/**
 * Get achievement statistics
 */
async function getAchievementStats(userId: string): Promise<AchievementStats> {
  // Get user's unlocked achievements
  const unlockedAchievements = await db
    .select({
      achievementId: userAchievements.achievementId,
      unlockedAt: userAchievements.unlockedAt,
      key: gamehubAchievements.key,
      name: gamehubAchievements.name,
      points: gamehubAchievements.points,
      category: gamehubAchievements.category,
    })
    .from(userAchievements)
    .innerJoin(
      gamehubAchievements,
      eq(userAchievements.achievementId, gamehubAchievements.id)
    )
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));

  const unlockedKeys = unlockedAchievements.map((a) => a.key);
  const totalPoints = calculateTotalPoints(unlockedKeys);

  // Calculate max possible points
  const maxPoints = ACHIEVEMENT_DEFINITIONS.reduce((sum, a) => sum + a.points, 0);

  // Calculate by category
  const byCategory: Record<string, { unlocked: number; total: number }> = {};
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!byCategory[def.category]) {
      byCategory[def.category] = { unlocked: 0, total: 0 };
    }
    byCategory[def.category].total++;
  }
  for (const unlocked of unlockedAchievements) {
    if (byCategory[unlocked.category]) {
      byCategory[unlocked.category].unlocked++;
    }
  }

  // Get recent unlocks (top 5)
  const recentUnlocks = unlockedAchievements.slice(0, 5).map((a) => ({
    key: a.key,
    name: a.name,
    unlockedAt: a.unlockedAt,
    points: a.points,
  }));

  return {
    totalUnlocked: unlockedAchievements.length,
    totalAvailable: ACHIEVEMENT_DEFINITIONS.length,
    totalPoints,
    maxPoints,
    byCategory,
    recentUnlocks,
  };
}

/**
 * Get overview statistics
 */
async function getOverviewStats(userId: string): Promise<OverviewStats> {
  // Get user info
  const [user] = await db
    .select({
      discordUsername: users.discordUsername,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Get overlay count
  const overlayResult = await db
    .select({ count: count() })
    .from(streamOverlays)
    .where(eq(streamOverlays.userId, userId));

  // Get feedback count
  const feedbackResult = await db
    .select({ count: count() })
    .from(featureRequests)
    .where(eq(featureRequests.authorId, userId));

  return {
    discordConnected: !!user?.discordUsername,
    discordUsername: user?.discordUsername ?? null,
    memberSince: user?.createdAt ?? new Date(),
    totalOverlays: overlayResult[0]?.count ?? 0,
    totalFeedback: feedbackResult[0]?.count ?? 0,
  };
}
