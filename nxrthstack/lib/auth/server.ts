import { createAuthServer, neonAuth } from "@neondatabase/auth/next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Create Neon Auth server instance
export const authServer = createAuthServer();

// Extended user type with custom fields
export interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isFriend: boolean;
  stripeCustomerId: string | null;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  gamehubOnboardingComplete: boolean;
}

// Get extended user data from local users table by Neon Auth user ID
export async function getExtendedUser(
  neonAuthUserId: string
): Promise<ExtendedUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.neonAuthUserId, neonAuthUserId),
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isFriend: user.isFriend,
    stripeCustomerId: user.stripeCustomerId,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordAvatar: user.discordAvatar,
    gamehubOnboardingComplete: user.gamehubOnboardingComplete,
  };
}

// Get extended user by email (for migration flow)
export async function getExtendedUserByEmail(
  email: string
): Promise<(ExtendedUser & { legacyPasswordHash: string | null; neonAuthUserId: string | null }) | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isFriend: user.isFriend,
    stripeCustomerId: user.stripeCustomerId,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordAvatar: user.discordAvatar,
    gamehubOnboardingComplete: user.gamehubOnboardingComplete,
    legacyPasswordHash: user.legacyPasswordHash,
    neonAuthUserId: user.neonAuthUserId,
  };
}

// Verify legacy password for migration
export async function verifyLegacyPassword(
  email: string,
  password: string
): Promise<{ valid: boolean; user: ExtendedUser | null }> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user?.legacyPasswordHash) {
    return { valid: false, user: null };
  }

  const isValid = await bcrypt.compare(password, user.legacyPasswordHash);

  if (!isValid) {
    return { valid: false, user: null };
  }

  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isFriend: user.isFriend,
      stripeCustomerId: user.stripeCustomerId,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
      gamehubOnboardingComplete: user.gamehubOnboardingComplete,
    },
  };
}

// Link Neon Auth user ID to local user record
export async function linkNeonAuthUser(
  localUserId: string,
  neonAuthUserId: string
): Promise<void> {
  await db
    .update(users)
    .set({
      neonAuthUserId,
      passwordMigratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, localUserId));
}

// Create local user record for new Neon Auth user
export async function createLocalUser(data: {
  neonAuthUserId: string;
  email: string;
  name: string;
}): Promise<string> {
  const [newUser] = await db
    .insert(users)
    .values({
      neonAuthUserId: data.neonAuthUserId,
      email: data.email.toLowerCase(),
      name: data.name,
      role: "customer",
      isFriend: false,
      gamehubOnboardingComplete: false,
    })
    .returning({ id: users.id });

  return newUser.id;
}

// Get session with extended user data (for server components)
export async function getSessionWithUser() {
  const { session, user: neonUser } = await neonAuth();

  if (!session || !neonUser?.id) {
    return { session: null, user: null };
  }

  const extendedUser = await getExtendedUser(neonUser.id);

  return {
    session,
    user: extendedUser,
  };
}
