"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import useSWR from "swr";
import { McProvider } from "@/components/minecraft/mc-context";
import { McSidebar } from "@/components/minecraft/mc-sidebar";
import { Icons } from "@/components/icons";
import type { McRole } from "@/lib/gamehub/minecraft-roles";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ServerGrant {
  serverId: string;
  serverName: string;
  role: McRole;
}

function McServerShellInner({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const serverId = searchParams.get("id");

  const { data, isLoading } = useSWR<{ servers: ServerGrant[] }>(
    "/api/gamehub/minecraft/server/access/grant",
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const grants = data?.servers ?? [];
  const grant = serverId
    ? grants.find((g) => g.serverId === serverId)
    : grants[0];

  if (!grant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Icons.Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          No access to this server
        </h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this server or it doesn&apos;t exist.
        </p>
        <a
          href="/dashboard/gamehub/minecraft"
          className="text-sm text-primary hover:underline"
        >
          Back to servers
        </a>
      </div>
    );
  }

  return (
    <McProvider
      serverId={grant.serverId}
      serverName={grant.serverName}
      userRole={grant.role}
    >
      <div className="flex min-h-screen">
        <McSidebar />
        <main className="flex-1 pl-56">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </McProvider>
  );
}

export function McServerShell({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <McServerShellInner userId={userId}>{children}</McServerShellInner>
    </Suspense>
  );
}
