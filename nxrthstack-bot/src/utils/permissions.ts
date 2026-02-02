import { GuildMember, PermissionFlagsBits } from "discord.js";
import { db, users } from "../db.js";
import { eq } from "drizzle-orm";

/**
 * Check if a member has admin permissions in the guild
 */
export function isGuildAdmin(member: GuildMember | null): boolean {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Get NxrthStack user by Discord ID
 */
export async function getNxrthUser(discordId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  return user || null;
}

/**
 * Check if user is linked to NxrthStack
 */
export async function isLinked(discordId: string): Promise<boolean> {
  const user = await getNxrthUser(discordId);
  return user !== null;
}

/**
 * Require user to be linked, returns user or throws
 */
export async function requireLinked(discordId: string) {
  const user = await getNxrthUser(discordId);
  if (!user) {
    throw new Error("You need to link your Discord account first. Use `/link` to get started.");
  }
  return user;
}
