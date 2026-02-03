"use client";

import { authClient } from "./client";
import useSWR from "swr";
import type { ExtendedUser } from "./server";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ExtendedSession {
  user: ExtendedUser | null;
  isPending: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

/**
 * Hook to get the current session with extended user data (role, isFriend, etc.)
 * Use this instead of authClient.useSession() when you need custom user fields.
 */
export function useExtendedSession(): ExtendedSession {
  const neonSession = authClient.useSession();
  const isAuthenticated = !!neonSession.data?.session;

  // Fetch extended user data from our API when authenticated
  const { data: extendedUser, isLoading: isLoadingExtended } = useSWR<ExtendedUser>(
    isAuthenticated ? "/api/user/extended" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const isPending = neonSession.isPending || (isAuthenticated && isLoadingExtended);

  return {
    user: extendedUser || null,
    isPending,
    isAuthenticated,
    signOut: async () => {
      await authClient.signOut();
    },
  };
}

/**
 * Hook to check if the current user has admin role
 */
export function useIsAdmin(): { isAdmin: boolean; isPending: boolean } {
  const { user, isPending } = useExtendedSession();
  return {
    isAdmin: user?.role === "admin",
    isPending,
  };
}

/**
 * Hook to check if the current user has GameHub access (isFriend or admin)
 */
export function useHasGameHubAccess(): { hasAccess: boolean; isPending: boolean } {
  const { user, isPending } = useExtendedSession();
  return {
    hasAccess: user?.isFriend === true || user?.role === "admin",
    isPending,
  };
}
