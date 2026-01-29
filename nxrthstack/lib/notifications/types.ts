export type NotificationCategory = "gamehub" | "product" | "system";

export type NotificationType =
  // GameHub - Achievement
  | "achievement_unlocked"
  // GameHub - R6 Lobbies
  | "lobby_invite"
  | "lobby_joined"
  | "lobby_opponent_left"
  // GameHub - R6 Matches
  | "match_completed"
  | "match_recorded"
  // GameHub - Tournaments
  | "tournament_registration_open"
  | "tournament_match_scheduled"
  | "tournament_match_ready"
  | "tournament_eliminated"
  | "tournament_won"
  // GameHub - Announcements
  | "gamehub_announcement"
  // Product Updates
  | "product_update_available"
  | "product_news"
  // System
  | "system_announcement"
  | "welcome";

export interface NotificationMetadata {
  // Achievement notifications
  achievementKey?: string;
  achievementName?: string;
  achievementPoints?: number;

  // Lobby notifications
  lobbyId?: string;
  lobbyName?: string;
  inviterName?: string;

  // Match notifications
  matchId?: string;
  opponentName?: string;
  result?: "win" | "loss" | "draw";

  // Tournament notifications
  tournamentId?: string;
  tournamentName?: string;
  matchNumber?: number;
  round?: number;
  scheduledAt?: string;

  // Product notifications
  productId?: string;
  productName?: string;
  productSlug?: string;
  version?: string;
  changelog?: string;

  // Announcement
  announcementId?: string;
}

export interface NotificationConfig {
  category: NotificationCategory;
  icon: string;
  defaultTitle: string;
  emailEligible: boolean;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  achievement_unlocked: {
    category: "gamehub",
    icon: "Award",
    defaultTitle: "Achievement Unlocked!",
    emailEligible: false,
  },
  lobby_invite: {
    category: "gamehub",
    icon: "Users",
    defaultTitle: "Lobby Invitation",
    emailEligible: false,
  },
  lobby_joined: {
    category: "gamehub",
    icon: "UserPlus",
    defaultTitle: "Player Joined Your Lobby",
    emailEligible: false,
  },
  lobby_opponent_left: {
    category: "gamehub",
    icon: "UserMinus",
    defaultTitle: "Player Left Lobby",
    emailEligible: false,
  },
  match_completed: {
    category: "gamehub",
    icon: "Trophy",
    defaultTitle: "Match Completed",
    emailEligible: false,
  },
  match_recorded: {
    category: "gamehub",
    icon: "CheckCircle",
    defaultTitle: "Match Recorded",
    emailEligible: false,
  },
  tournament_registration_open: {
    category: "gamehub",
    icon: "Calendar",
    defaultTitle: "Tournament Registration Open",
    emailEligible: false,
  },
  tournament_match_scheduled: {
    category: "gamehub",
    icon: "Clock",
    defaultTitle: "Tournament Match Scheduled",
    emailEligible: false,
  },
  tournament_match_ready: {
    category: "gamehub",
    icon: "Zap",
    defaultTitle: "Your Match is Ready!",
    emailEligible: false,
  },
  tournament_eliminated: {
    category: "gamehub",
    icon: "XCircle",
    defaultTitle: "Tournament Elimination",
    emailEligible: false,
  },
  tournament_won: {
    category: "gamehub",
    icon: "Crown",
    defaultTitle: "Tournament Victory!",
    emailEligible: false,
  },
  gamehub_announcement: {
    category: "gamehub",
    icon: "MessageSquare",
    defaultTitle: "GameHub Announcement",
    emailEligible: false,
  },
  product_update_available: {
    category: "product",
    icon: "Download",
    defaultTitle: "Software Update Available",
    emailEligible: true,
  },
  product_news: {
    category: "product",
    icon: "FileText",
    defaultTitle: "Product News",
    emailEligible: true,
  },
  system_announcement: {
    category: "system",
    icon: "Info",
    defaultTitle: "System Announcement",
    emailEligible: true,
  },
  welcome: {
    category: "system",
    icon: "Star",
    defaultTitle: "Welcome to NxrthStack!",
    emailEligible: true,
  },
};
