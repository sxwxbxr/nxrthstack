import { createNotification, createBulkNotifications } from "./service";
import { db } from "@/lib/db";
import { users, r6TournamentParticipants } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function notifyAchievementUnlocked(
  userId: string,
  achievementKey: string,
  achievementName: string,
  points: number
) {
  return createNotification({
    userId,
    type: "achievement_unlocked",
    message: `You unlocked "${achievementName}" (+${points} points)`,
    actionUrl: "/dashboard/gamehub/achievements",
    actionLabel: "View Achievements",
    metadata: {
      achievementKey,
      achievementName,
      achievementPoints: points,
    },
  });
}

export async function notifyLobbyInvite(
  inviteeId: string,
  lobbyId: string,
  lobbyName: string,
  inviterName: string
) {
  return createNotification({
    userId: inviteeId,
    type: "lobby_invite",
    message: `${inviterName} invited you to join "${lobbyName}"`,
    actionUrl: `/dashboard/gamehub/r6/lobbies/${lobbyId}`,
    actionLabel: "View Lobby",
    metadata: {
      lobbyId,
      lobbyName,
      inviterName,
    },
  });
}

export async function notifyLobbyJoined(
  hostId: string,
  lobbyId: string,
  lobbyName: string,
  joinerName: string
) {
  return createNotification({
    userId: hostId,
    type: "lobby_joined",
    message: `${joinerName} joined your lobby "${lobbyName}"`,
    actionUrl: `/dashboard/gamehub/r6/lobbies/${lobbyId}`,
    actionLabel: "View Lobby",
    metadata: {
      lobbyId,
      lobbyName,
    },
  });
}

export async function notifyLobbyOpponentLeft(
  hostId: string,
  lobbyId: string,
  lobbyName: string,
  leaverName: string
) {
  return createNotification({
    userId: hostId,
    type: "lobby_opponent_left",
    message: `${leaverName} left your lobby "${lobbyName}"`,
    actionUrl: `/dashboard/gamehub/r6/lobbies/${lobbyId}`,
    actionLabel: "View Lobby",
    metadata: {
      lobbyId,
      lobbyName,
    },
  });
}

export async function notifyMatchCompleted(
  userId: string,
  lobbyId: string,
  opponentName: string,
  result: "win" | "loss" | "draw"
) {
  const resultText =
    result === "win"
      ? "won against"
      : result === "loss"
        ? "lost to"
        : "drew with";

  return createNotification({
    userId,
    type: "match_completed",
    message: `You ${resultText} ${opponentName}`,
    actionUrl: `/dashboard/gamehub/r6/lobbies/${lobbyId}`,
    actionLabel: "View Match History",
    metadata: {
      lobbyId,
      opponentName,
      result,
    },
  });
}

export async function notifyMatchRecorded(
  userId: string,
  lobbyId: string,
  recorderName: string
) {
  return createNotification({
    userId,
    type: "match_recorded",
    message: `${recorderName} recorded a match result`,
    actionUrl: `/dashboard/gamehub/r6/lobbies/${lobbyId}`,
    actionLabel: "View Match",
    metadata: {
      lobbyId,
    },
  });
}

export async function notifyTournamentMatchReady(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  matchNumber: number,
  round: number,
  opponentName: string
) {
  return createNotification({
    userId,
    type: "tournament_match_ready",
    title: "Your Tournament Match is Ready!",
    message: `Round ${round} match vs ${opponentName} in "${tournamentName}"`,
    actionUrl: `/dashboard/gamehub/r6/tournaments/${tournamentId}`,
    actionLabel: "Go to Tournament",
    metadata: {
      tournamentId,
      tournamentName,
      matchNumber,
      round,
      opponentName,
    },
  });
}

export async function notifyTournamentEliminated(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  placement: number
) {
  return createNotification({
    userId,
    type: "tournament_eliminated",
    message: `You finished in ${getOrdinal(placement)} place in "${tournamentName}"`,
    actionUrl: `/dashboard/gamehub/r6/tournaments/${tournamentId}`,
    actionLabel: "View Results",
    metadata: {
      tournamentId,
      tournamentName,
    },
  });
}

export async function notifyTournamentWon(
  userId: string,
  tournamentId: string,
  tournamentName: string
) {
  return createNotification({
    userId,
    type: "tournament_won",
    title: "Tournament Victory!",
    message: `Congratulations! You won "${tournamentName}"!`,
    actionUrl: `/dashboard/gamehub/r6/tournaments/${tournamentId}`,
    actionLabel: "View Results",
    metadata: {
      tournamentId,
      tournamentName,
    },
  });
}

export async function notifyTournamentParticipants(
  tournamentId: string,
  tournamentName: string,
  type:
    | "tournament_registration_open"
    | "tournament_match_scheduled",
  message: string,
  excludeUserId?: string
) {
  // Get all participants
  const participants = await db
    .select({ userId: r6TournamentParticipants.userId })
    .from(r6TournamentParticipants)
    .where(
      excludeUserId
        ? and(
            eq(r6TournamentParticipants.tournamentId, tournamentId),
            ne(r6TournamentParticipants.userId, excludeUserId)
          )
        : eq(r6TournamentParticipants.tournamentId, tournamentId)
    );

  const userIds = participants.map((p) => p.userId);

  return createBulkNotifications(userIds, {
    type,
    message,
    actionUrl: `/dashboard/gamehub/r6/tournaments/${tournamentId}`,
    actionLabel: "View Tournament",
    metadata: {
      tournamentId,
      tournamentName,
    },
  });
}

export async function notifyGameHubAnnouncement(
  announcementId: string,
  title: string,
  content: string
) {
  // Get all users with isFriend access
  const friendUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isFriend, true));

  const userIds = friendUsers.map((u) => u.id);

  return createBulkNotifications(userIds, {
    type: "gamehub_announcement",
    title,
    message:
      content.substring(0, 200) + (content.length > 200 ? "..." : ""),
    actionUrl: "/dashboard/gamehub",
    actionLabel: "View Announcement",
    metadata: {
      announcementId,
    },
  });
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
