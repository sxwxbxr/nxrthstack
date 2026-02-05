import { getSessionWithUser } from "@/lib/auth/server";

/**
 * Compatibility wrapper around Neon Auth's getSessionWithUser().
 * Returns a session shape matching the old NextAuth auth() function
 * so all existing server-side code continues to work.
 */
export async function auth(): Promise<{
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isFriend: boolean;
  };
} | null> {
  const { user } = await getSessionWithUser();

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isFriend: user.isFriend,
    },
  };
}
