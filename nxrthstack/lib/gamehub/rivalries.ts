import {
  db,
  rivalries,
  rivalryMatches,
  rivalryStats,
  users,
  activityFeed,
} from "@/lib/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { areFriends } from "./friends";

export type RivalryStatus = "pending" | "active" | "ended";

export type RivalryWithDetails = {
  id: string;
  challengerId: string;
  challengerName: string | null;
  challengerEmail: string;
  challengerAvatar: string | null;
  opponentId: string;
  opponentName: string | null;
  opponentEmail: string;
  opponentAvatar: string | null;
  status: string;
  season: number;
  createdAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
  myStats: {
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
    bestStreak: number;
  } | null;
  opponentStats: {
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
    bestStreak: number;
  } | null;
  totalMatches: number;
};

export type RivalryMatch = {
  id: string;
  game: string;
  winnerId: string | null;
  winnerName: string | null;
  loserId: string | null;
  loserName: string | null;
  isDraw: boolean;
  metadata: Record<string, unknown>;
  playedAt: Date;
};

// Get all rivalries for a user
export async function getUserRivalries(userId: string): Promise<RivalryWithDetails[]> {
  const challenger = await db
    .select({
      id: rivalries.id,
      challengerId: rivalries.challengerId,
      challengerName: sql<string | null>`challenger.name`,
      challengerEmail: sql<string>`challenger.email`,
      challengerAvatar: sql<string | null>`challenger.discord_avatar`,
      opponentId: rivalries.opponentId,
      opponentName: sql<string | null>`opponent.name`,
      opponentEmail: sql<string>`opponent.email`,
      opponentAvatar: sql<string | null>`opponent.discord_avatar`,
      status: rivalries.status,
      season: rivalries.season,
      createdAt: rivalries.createdAt,
      acceptedAt: rivalries.acceptedAt,
      endedAt: rivalries.endedAt,
    })
    .from(rivalries)
    .innerJoin(sql`${users} as challenger`, sql`${rivalries.challengerId} = challenger.id`)
    .innerJoin(sql`${users} as opponent`, sql`${rivalries.opponentId} = opponent.id`)
    .where(or(eq(rivalries.challengerId, userId), eq(rivalries.opponentId, userId)))
    .orderBy(desc(rivalries.createdAt));

  // Get stats for each rivalry
  const rivalryData: RivalryWithDetails[] = [];

  for (const rivalry of challenger) {
    const [stats, matchCount] = await Promise.all([
      db
        .select()
        .from(rivalryStats)
        .where(eq(rivalryStats.rivalryId, rivalry.id)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(rivalryMatches)
        .where(eq(rivalryMatches.rivalryId, rivalry.id)),
    ]);

    const myStats = stats.find((s) => s.userId === userId);
    const opponentId = rivalry.challengerId === userId ? rivalry.opponentId : rivalry.challengerId;
    const opponentStats = stats.find((s) => s.userId === opponentId);

    rivalryData.push({
      ...rivalry,
      myStats: myStats
        ? {
            wins: myStats.wins,
            losses: myStats.losses,
            draws: myStats.draws,
            currentStreak: myStats.currentStreak,
            bestStreak: myStats.bestStreak,
          }
        : null,
      opponentStats: opponentStats
        ? {
            wins: opponentStats.wins,
            losses: opponentStats.losses,
            draws: opponentStats.draws,
            currentStreak: opponentStats.currentStreak,
            bestStreak: opponentStats.bestStreak,
          }
        : null,
      totalMatches: matchCount[0]?.count || 0,
    });
  }

  return rivalryData;
}

// Get a single rivalry by ID
export async function getRivalry(
  userId: string,
  rivalryId: string
): Promise<RivalryWithDetails | null> {
  const rivalryList = await getUserRivalries(userId);
  return rivalryList.find((r) => r.id === rivalryId) || null;
}

// Get rivalry matches
export async function getRivalryMatches(rivalryId: string): Promise<RivalryMatch[]> {
  return db
    .select({
      id: rivalryMatches.id,
      game: rivalryMatches.game,
      winnerId: rivalryMatches.winnerId,
      winnerName: sql<string | null>`winner.name`,
      loserId: rivalryMatches.loserId,
      loserName: sql<string | null>`loser.name`,
      isDraw: rivalryMatches.isDraw,
      metadata: rivalryMatches.metadata,
      playedAt: rivalryMatches.playedAt,
    })
    .from(rivalryMatches)
    .leftJoin(sql`${users} as winner`, sql`${rivalryMatches.winnerId} = winner.id`)
    .leftJoin(sql`${users} as loser`, sql`${rivalryMatches.loserId} = loser.id`)
    .where(eq(rivalryMatches.rivalryId, rivalryId))
    .orderBy(desc(rivalryMatches.playedAt)) as unknown as Promise<RivalryMatch[]>;
}

// Create a rivalry challenge
export async function createRivalry(
  challengerId: string,
  opponentId: string
): Promise<{ success: boolean; error?: string; rivalryId?: string }> {
  // Can't challenge yourself
  if (challengerId === opponentId) {
    return { success: false, error: "Cannot challenge yourself" };
  }

  // Check if they are friends
  const friends = await areFriends(challengerId, opponentId);
  if (!friends) {
    return { success: false, error: "You can only challenge friends" };
  }

  // Check for existing active rivalry
  const existing = await db.query.rivalries.findFirst({
    where: and(
      or(
        and(eq(rivalries.challengerId, challengerId), eq(rivalries.opponentId, opponentId)),
        and(eq(rivalries.challengerId, opponentId), eq(rivalries.opponentId, challengerId))
      ),
      or(eq(rivalries.status, "pending"), eq(rivalries.status, "active"))
    ),
  });

  if (existing) {
    if (existing.status === "pending") {
      return { success: false, error: "Rivalry challenge already pending" };
    }
    return { success: false, error: "Already in an active rivalry with this user" };
  }

  const [rivalry] = await db
    .insert(rivalries)
    .values({
      challengerId,
      opponentId,
      status: "pending",
    })
    .returning();

  return { success: true, rivalryId: rivalry.id };
}

// Accept a rivalry challenge
export async function acceptRivalry(
  userId: string,
  rivalryId: string
): Promise<{ success: boolean; error?: string }> {
  const rivalry = await db.query.rivalries.findFirst({
    where: and(
      eq(rivalries.id, rivalryId),
      eq(rivalries.opponentId, userId),
      eq(rivalries.status, "pending")
    ),
  });

  if (!rivalry) {
    return { success: false, error: "Rivalry challenge not found" };
  }

  await db
    .update(rivalries)
    .set({
      status: "active",
      acceptedAt: new Date(),
    })
    .where(eq(rivalries.id, rivalryId));

  // Initialize stats for both users
  await db.insert(rivalryStats).values([
    { rivalryId, userId: rivalry.challengerId },
    { rivalryId, userId: rivalry.opponentId },
  ]);

  // Create activity
  const [challenger, opponent] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, rivalry.challengerId) }),
    db.query.users.findFirst({ where: eq(users.id, rivalry.opponentId) }),
  ]);

  await db.insert(activityFeed).values([
    {
      userId: rivalry.challengerId,
      activityType: "rivalry_update",
      title: `Started a rivalry with ${opponent?.name || opponent?.email}`,
      metadata: { rivalryId, opponentId: rivalry.opponentId },
    },
    {
      userId: rivalry.opponentId,
      activityType: "rivalry_update",
      title: `Started a rivalry with ${challenger?.name || challenger?.email}`,
      metadata: { rivalryId, opponentId: rivalry.challengerId },
    },
  ]);

  return { success: true };
}

// Decline a rivalry challenge
export async function declineRivalry(
  userId: string,
  rivalryId: string
): Promise<{ success: boolean; error?: string }> {
  const rivalry = await db.query.rivalries.findFirst({
    where: and(
      eq(rivalries.id, rivalryId),
      eq(rivalries.opponentId, userId),
      eq(rivalries.status, "pending")
    ),
  });

  if (!rivalry) {
    return { success: false, error: "Rivalry challenge not found" };
  }

  await db.delete(rivalries).where(eq(rivalries.id, rivalryId));

  return { success: true };
}

// End a rivalry (either user can end it)
export async function endRivalry(
  userId: string,
  rivalryId: string
): Promise<{ success: boolean; error?: string }> {
  const rivalry = await db.query.rivalries.findFirst({
    where: and(
      eq(rivalries.id, rivalryId),
      eq(rivalries.status, "active"),
      or(eq(rivalries.challengerId, userId), eq(rivalries.opponentId, userId))
    ),
  });

  if (!rivalry) {
    return { success: false, error: "Active rivalry not found" };
  }

  await db
    .update(rivalries)
    .set({
      status: "ended",
      endedAt: new Date(),
    })
    .where(eq(rivalries.id, rivalryId));

  return { success: true };
}

// Record a match result
export async function recordMatch(
  userId: string,
  rivalryId: string,
  data: {
    game: string;
    winnerId?: string;
    loserId?: string;
    isDraw?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  // Verify rivalry is active and user is part of it
  const rivalry = await db.query.rivalries.findFirst({
    where: and(
      eq(rivalries.id, rivalryId),
      eq(rivalries.status, "active"),
      or(eq(rivalries.challengerId, userId), eq(rivalries.opponentId, userId))
    ),
  });

  if (!rivalry) {
    return { success: false, error: "Active rivalry not found" };
  }

  const { game, winnerId, loserId, isDraw = false, metadata = {} } = data;

  // Validate winner/loser are part of rivalry
  const validUsers = [rivalry.challengerId, rivalry.opponentId];
  if (winnerId && !validUsers.includes(winnerId)) {
    return { success: false, error: "Invalid winner" };
  }
  if (loserId && !validUsers.includes(loserId)) {
    return { success: false, error: "Invalid loser" };
  }

  // Insert match
  await db.insert(rivalryMatches).values({
    rivalryId,
    game,
    winnerId: isDraw ? null : winnerId,
    loserId: isDraw ? null : loserId,
    isDraw,
    metadata,
  });

  // Update stats
  if (isDraw) {
    await db
      .update(rivalryStats)
      .set({
        draws: sql`${rivalryStats.draws} + 1`,
        currentStreak: 0,
        updatedAt: new Date(),
      })
      .where(eq(rivalryStats.rivalryId, rivalryId));
  } else if (winnerId && loserId) {
    // Update winner stats
    await db
      .update(rivalryStats)
      .set({
        wins: sql`${rivalryStats.wins} + 1`,
        currentStreak: sql`${rivalryStats.currentStreak} + 1`,
        bestStreak: sql`GREATEST(${rivalryStats.bestStreak}, ${rivalryStats.currentStreak} + 1)`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(rivalryStats.rivalryId, rivalryId), eq(rivalryStats.userId, winnerId))
      );

    // Update loser stats
    await db
      .update(rivalryStats)
      .set({
        losses: sql`${rivalryStats.losses} + 1`,
        currentStreak: 0,
        updatedAt: new Date(),
      })
      .where(
        and(eq(rivalryStats.rivalryId, rivalryId), eq(rivalryStats.userId, loserId))
      );

    // Create activity for winner
    const winner = await db.query.users.findFirst({ where: eq(users.id, winnerId) });
    const loser = await db.query.users.findFirst({ where: eq(users.id, loserId) });

    await db.insert(activityFeed).values({
      userId: winnerId,
      activityType: "rivalry_update",
      title: `Won a rivalry match against ${loser?.name || loser?.email} in ${game}`,
      game,
      metadata: { rivalryId, opponentId: loserId },
    });
  }

  return { success: true };
}
