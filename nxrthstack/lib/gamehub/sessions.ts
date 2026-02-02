import { db } from "@/lib/db";
import {
  gamingSessions,
  sessionRsvps,
  sessionInvites,
  users,
} from "@/lib/db/schema";
import { eq, and, or, desc, gte, count } from "drizzle-orm";
import { nanoid } from "nanoid";

// Re-export constants from the client-safe module
export { GAME_OPTIONS, ACTIVITY_OPTIONS, RSVP_STATUS } from "./sessions-constants";
import type { RsvpStatus } from "./sessions-constants";
export type { RsvpStatus };

export interface SessionWithDetails {
  id: string;
  title: string;
  description: string | null;
  game: string;
  activityType: string | null;
  scheduledAt: Date;
  durationMinutes: number | null;
  maxParticipants: number | null;
  isPrivate: boolean;
  inviteCode: string | null;
  status: string;
  createdAt: Date;
  host: {
    id: string;
    name: string | null;
    discordUsername: string | null;
    discordAvatar: string | null;
  };
  rsvpCounts: {
    going: number;
    maybe: number;
    not_going: number;
    pending: number;
  };
  userRsvp?: RsvpStatus;
}

/**
 * Create a new gaming session
 */
export async function createSession(
  hostId: string,
  data: {
    title: string;
    description?: string;
    game: string;
    activityType?: string;
    scheduledAt: Date;
    durationMinutes?: number;
    maxParticipants?: number;
    isPrivate?: boolean;
  }
) {
  const inviteCode = data.isPrivate ? nanoid(10) : null;

  const [session] = await db
    .insert(gamingSessions)
    .values({
      hostId,
      title: data.title,
      description: data.description,
      game: data.game,
      activityType: data.activityType,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes ?? 60,
      maxParticipants: data.maxParticipants,
      isPrivate: data.isPrivate ?? false,
      inviteCode,
    })
    .returning();

  // Host automatically RSVPs as going
  await db.insert(sessionRsvps).values({
    sessionId: session.id,
    userId: hostId,
    status: "going",
    respondedAt: new Date(),
  });

  return session;
}

/**
 * Get upcoming sessions (public and user's private)
 */
export async function getUpcomingSessions(
  userId?: string,
  limit = 20
): Promise<SessionWithDetails[]> {
  const now = new Date();

  // Get sessions
  const sessionsQuery = db
    .select()
    .from(gamingSessions)
    .where(
      and(
        gte(gamingSessions.scheduledAt, now),
        eq(gamingSessions.status, "scheduled"),
        userId
          ? or(
              eq(gamingSessions.isPrivate, false),
              eq(gamingSessions.hostId, userId)
            )
          : eq(gamingSessions.isPrivate, false)
      )
    )
    .orderBy(gamingSessions.scheduledAt)
    .limit(limit);

  const sessions = await sessionsQuery;

  // Enrich with host info and RSVP counts
  return Promise.all(
    sessions.map(async (session) => {
      const [host] = await db
        .select({
          id: users.id,
          name: users.name,
          discordUsername: users.discordUsername,
          discordAvatar: users.discordAvatar,
        })
        .from(users)
        .where(eq(users.id, session.hostId))
        .limit(1);

      const rsvps = await db
        .select({ status: sessionRsvps.status })
        .from(sessionRsvps)
        .where(eq(sessionRsvps.sessionId, session.id));

      const rsvpCounts = {
        going: rsvps.filter((r) => r.status === "going").length,
        maybe: rsvps.filter((r) => r.status === "maybe").length,
        not_going: rsvps.filter((r) => r.status === "not_going").length,
        pending: rsvps.filter((r) => r.status === "pending").length,
      };

      let userRsvp: RsvpStatus | undefined;
      if (userId) {
        const [myRsvp] = await db
          .select({ status: sessionRsvps.status })
          .from(sessionRsvps)
          .where(
            and(
              eq(sessionRsvps.sessionId, session.id),
              eq(sessionRsvps.userId, userId)
            )
          )
          .limit(1);
        userRsvp = myRsvp?.status as RsvpStatus;
      }

      return {
        ...session,
        host,
        rsvpCounts,
        userRsvp,
      };
    })
  );
}

/**
 * Get a single session by ID
 */
export async function getSession(
  sessionId: string,
  userId?: string
): Promise<SessionWithDetails | null> {
  const [session] = await db
    .select()
    .from(gamingSessions)
    .where(eq(gamingSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const [host] = await db
    .select({
      id: users.id,
      name: users.name,
      discordUsername: users.discordUsername,
      discordAvatar: users.discordAvatar,
    })
    .from(users)
    .where(eq(users.id, session.hostId))
    .limit(1);

  const rsvps = await db
    .select({ status: sessionRsvps.status })
    .from(sessionRsvps)
    .where(eq(sessionRsvps.sessionId, session.id));

  const rsvpCounts = {
    going: rsvps.filter((r) => r.status === "going").length,
    maybe: rsvps.filter((r) => r.status === "maybe").length,
    not_going: rsvps.filter((r) => r.status === "not_going").length,
    pending: rsvps.filter((r) => r.status === "pending").length,
  };

  let userRsvp: RsvpStatus | undefined;
  if (userId) {
    const [myRsvp] = await db
      .select({ status: sessionRsvps.status })
      .from(sessionRsvps)
      .where(
        and(
          eq(sessionRsvps.sessionId, session.id),
          eq(sessionRsvps.userId, userId)
        )
      )
      .limit(1);
    userRsvp = myRsvp?.status as RsvpStatus;
  }

  return {
    ...session,
    host,
    rsvpCounts,
    userRsvp,
  };
}

/**
 * Get session by invite code
 */
export async function getSessionByInviteCode(
  inviteCode: string
): Promise<SessionWithDetails | null> {
  const [session] = await db
    .select()
    .from(gamingSessions)
    .where(eq(gamingSessions.inviteCode, inviteCode))
    .limit(1);

  if (!session) return null;

  return getSession(session.id);
}

/**
 * Update RSVP status
 */
export async function updateRsvp(
  sessionId: string,
  userId: string,
  status: RsvpStatus,
  note?: string
) {
  // Check if session exists and is scheduled
  const [session] = await db
    .select()
    .from(gamingSessions)
    .where(eq(gamingSessions.id, sessionId))
    .limit(1);

  if (!session || session.status !== "scheduled") {
    throw new Error("Session not found or not accepting RSVPs");
  }

  // Check max participants
  if (session.maxParticipants && status === "going") {
    const [goingCount] = await db
      .select({ count: count() })
      .from(sessionRsvps)
      .where(
        and(
          eq(sessionRsvps.sessionId, sessionId),
          eq(sessionRsvps.status, "going")
        )
      );

    if (goingCount && goingCount.count >= session.maxParticipants) {
      throw new Error("Session is full");
    }
  }

  // Upsert RSVP
  const [existing] = await db
    .select()
    .from(sessionRsvps)
    .where(
      and(eq(sessionRsvps.sessionId, sessionId), eq(sessionRsvps.userId, userId))
    )
    .limit(1);

  if (existing) {
    await db
      .update(sessionRsvps)
      .set({
        status,
        note,
        respondedAt: new Date(),
      })
      .where(eq(sessionRsvps.id, existing.id));
  } else {
    await db.insert(sessionRsvps).values({
      sessionId,
      userId,
      status,
      note,
      respondedAt: new Date(),
    });
  }

  return { success: true };
}

/**
 * Cancel a session (host only)
 */
export async function cancelSession(sessionId: string, userId: string) {
  const [session] = await db
    .select()
    .from(gamingSessions)
    .where(eq(gamingSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.hostId !== userId) {
    throw new Error("Only the host can cancel the session");
  }

  await db
    .update(gamingSessions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(gamingSessions.id, sessionId));

  return { success: true };
}

/**
 * Get user's sessions (hosting and attending)
 */
export async function getUserSessions(userId: string) {
  const now = new Date();

  // Sessions user is hosting
  const hosting = await db
    .select()
    .from(gamingSessions)
    .where(
      and(
        eq(gamingSessions.hostId, userId),
        gte(gamingSessions.scheduledAt, now),
        eq(gamingSessions.status, "scheduled")
      )
    )
    .orderBy(gamingSessions.scheduledAt);

  // Sessions user has RSVP'd to
  const rsvpedSessionIds = await db
    .select({ sessionId: sessionRsvps.sessionId })
    .from(sessionRsvps)
    .where(
      and(
        eq(sessionRsvps.userId, userId),
        or(eq(sessionRsvps.status, "going"), eq(sessionRsvps.status, "maybe"))
      )
    );

  // If no RSVPs, return empty attending array
  if (rsvpedSessionIds.length === 0) {
    return {
      hosting,
      attending: [],
    };
  }

  const attending = await db
    .select()
    .from(gamingSessions)
    .where(
      and(
        gte(gamingSessions.scheduledAt, now),
        eq(gamingSessions.status, "scheduled"),
        or(
          ...rsvpedSessionIds.map((r) => eq(gamingSessions.id, r.sessionId))
        )
      )
    )
    .orderBy(gamingSessions.scheduledAt);

  return {
    hosting,
    attending: attending.filter((s) => s.hostId !== userId), // Exclude sessions user is hosting
  };
}

/**
 * Send an invite to a user
 */
export async function sendInvite(
  sessionId: string,
  invitedBy: string,
  target: { userId?: string; discordId?: string; email?: string }
) {
  if (!target.userId && !target.discordId && !target.email) {
    throw new Error("Must provide userId, discordId, or email");
  }

  await db.insert(sessionInvites).values({
    sessionId,
    invitedUserId: target.userId,
    invitedDiscordId: target.discordId,
    invitedEmail: target.email,
    invitedBy,
  });

  return { success: true };
}

/**
 * Get RSVPs for a session with user details
 */
export async function getSessionRsvps(sessionId: string) {
  const rsvps = await db
    .select({
      id: sessionRsvps.id,
      status: sessionRsvps.status,
      note: sessionRsvps.note,
      respondedAt: sessionRsvps.respondedAt,
      user: {
        id: users.id,
        name: users.name,
        discordUsername: users.discordUsername,
        discordAvatar: users.discordAvatar,
      },
    })
    .from(sessionRsvps)
    .innerJoin(users, eq(sessionRsvps.userId, users.id))
    .where(eq(sessionRsvps.sessionId, sessionId))
    .orderBy(sessionRsvps.respondedAt);

  return rsvps;
}
