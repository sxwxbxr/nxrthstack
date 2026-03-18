import type { ConsoleLogEntry } from "../types/server.js";

/**
 * Parses a Minecraft server log line into a structured entry.
 *
 * Formats:
 *  [HH:MM:SS] [Thread/LEVEL]: Message
 *  [HH:MM:SS INFO]: Message  (some servers)
 */

const LOG_REGEX =
  /^\[(\d{2}:\d{2}:\d{2})\]\s+\[([^\]]+?)\/(\w+)\]:\s*(.*)$/;
const LOG_REGEX_ALT =
  /^\[(\d{2}:\d{2}:\d{2})\s+(\w+)\]:\s*(.*)$/;

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";
export type LogCategory =
  | "chat"
  | "join"
  | "leave"
  | "death"
  | "command"
  | "system";

const CHAT_REGEX = /^<([^>]+)>\s+(.+)$/;
const JOIN_REGEX = /^(\S+)\s+joined the game$/;
const LEAVE_REGEX = /^(\S+)\s+left the game$/;
const DEATH_KEYWORDS = [
  "was slain",
  "was shot",
  "drowned",
  "blew up",
  "hit the ground",
  "fell",
  "burned",
  "tried to swim",
  "was killed",
  "suffocated",
  "starved",
  "withered",
  "was pricked",
  "was impaled",
];

export function parseLogLine(raw: string): ConsoleLogEntry {
  const now = new Date().toISOString();

  let timestamp = now;
  let level: LogLevel = "INFO";
  let thread = "Server thread";
  let message = raw;

  const match = raw.match(LOG_REGEX);
  if (match) {
    const today = new Date().toISOString().slice(0, 10);
    timestamp = `${today}T${match[1]}`;
    thread = match[2];
    level = normalizeLevel(match[3]);
    message = match[4];
  } else {
    const altMatch = raw.match(LOG_REGEX_ALT);
    if (altMatch) {
      const today = new Date().toISOString().slice(0, 10);
      timestamp = `${today}T${altMatch[1]}`;
      level = normalizeLevel(altMatch[2]);
      message = altMatch[3];
    }
  }

  const category = categorize(message);

  return {
    timestamp,
    level,
    thread,
    message,
    category,
    raw,
  };
}

function normalizeLevel(s: string): LogLevel {
  const upper = s.toUpperCase();
  if (upper === "WARN" || upper === "WARNING") return "WARN";
  if (upper === "ERROR" || upper === "SEVERE") return "ERROR";
  if (upper === "FATAL") return "FATAL";
  if (upper === "DEBUG" || upper === "TRACE") return "DEBUG";
  return "INFO";
}

function categorize(message: string): LogCategory {
  if (CHAT_REGEX.test(message)) return "chat";
  if (JOIN_REGEX.test(message)) return "join";
  if (LEAVE_REGEX.test(message)) return "leave";
  if (DEATH_KEYWORDS.some((kw) => message.includes(kw))) return "death";
  return "system";
}
