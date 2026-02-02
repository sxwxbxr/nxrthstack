import { time, TimestampStyles } from "discord.js";

/**
 * Format a date for Discord timestamp display
 */
export function formatDiscordTime(date: Date, style: TimestampStyles = TimestampStyles.ShortDateTime): string {
  return time(date, style);
}

/**
 * Format a date as relative time (e.g., "in 2 hours")
 */
export function formatRelativeTime(date: Date): string {
  return time(date, TimestampStyles.RelativeTime);
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format a number with rank suffix (1st, 2nd, 3rd, etc.)
 */
export function formatRank(rank: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = rank % 100;
  return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
