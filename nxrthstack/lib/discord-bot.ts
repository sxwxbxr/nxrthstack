/**
 * Discord Bot API Client
 *
 * Use this to send notifications to Discord from the website.
 * The bot must be running and accessible at the configured URL.
 */

const BOT_API_URL = process.env.DISCORD_BOT_API_URL || "http://localhost:3001";
const BOT_SECRET = process.env.DISCORD_CLIENT_SECRET;

interface BotApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

async function sendToBot(event: string, data: Record<string, unknown>): Promise<BotApiResponse> {
  try {
    const response = await fetch(`${BOT_API_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        data,
        secret: BOT_SECRET,
      }),
    });

    return await response.json() as BotApiResponse;
  } catch (error) {
    console.error(`[Discord Bot] Failed to send ${event}:`, error);
    return {
      success: false,
      message: "Failed to connect to Discord bot",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notify Discord when a user unlocks an achievement
 */
export async function notifyAchievementUnlocked(userId: string, achievementId: string) {
  return sendToBot("achievement.unlocked", { userId, achievementId });
}

/**
 * Notify Discord when a gaming session is created
 */
export async function notifySessionCreated(sessionId: string) {
  return sendToBot("session.created", { sessionId });
}

/**
 * Notify Discord when a rivalry challenge is sent
 */
export async function notifyRivalryChallenge(challengerName: string, opponentName: string) {
  return sendToBot("rivalry.challenge", { challengerName, opponentName });
}

/**
 * Notify Discord when a rivalry is accepted
 */
export async function notifyRivalryAccepted(challengerName: string, opponentName: string, season: number) {
  return sendToBot("rivalry.accepted", { challengerName, opponentName, season });
}

/**
 * Notify Discord when a rivalry match is recorded
 */
export async function notifyRivalryMatch(
  winnerName: string,
  loserName: string,
  game: string,
  season: number
) {
  return sendToBot("rivalry.match", { winnerName, loserName, game, season });
}

/**
 * Notify Discord when a new announcement is posted
 */
export async function notifyAnnouncement(announcementId: string) {
  return sendToBot("announcement.created", { announcementId });
}
