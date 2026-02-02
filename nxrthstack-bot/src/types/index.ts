import type { ChatInputCommandInteraction } from "discord.js";

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  userId?: string; // NxrthStack user ID if linked
  discordId: string;
}

export interface GameColor {
  name: string;
  color: number;
}

export const GAME_COLORS: Record<string, GameColor> = {
  r6: { name: "Rainbow Six Siege", color: 0xff5500 },
  minecraft: { name: "Minecraft", color: 0x44aa00 },
  pokemon: { name: "Pokemon", color: 0xffd700 },
  valorant: { name: "Valorant", color: 0xff4655 },
  cs2: { name: "Counter-Strike 2", color: 0x4b69ff },
  apex: { name: "Apex Legends", color: 0xff0000 },
  other: { name: "Other", color: 0x9b59b6 },
};

export const GAME_CHOICES = [
  { name: "Rainbow Six Siege", value: "r6" },
  { name: "Minecraft", value: "minecraft" },
  { name: "Pokemon", value: "pokemon" },
  { name: "Valorant", value: "valorant" },
  { name: "Counter-Strike 2", value: "cs2" },
  { name: "Apex Legends", value: "apex" },
  { name: "Other", value: "other" },
];

export const LEADERBOARD_CATEGORIES = [
  { name: "Achievement Points", value: "achievement_points" },
  { name: "R6 1v1 Wins", value: "r6_wins" },
  { name: "Sessions Hosted", value: "sessions_hosted" },
  { name: "Rivalry Wins", value: "rivalry_wins" },
];
