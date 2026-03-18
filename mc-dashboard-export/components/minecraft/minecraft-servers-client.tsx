"use client";

import { useMcAccess } from "@/hooks/use-mc-access";
import { ServerCard } from "@/components/minecraft/server-card";
import { AccessCodeInput } from "@/components/minecraft/access-code-input";
import { Icons } from "@/components/icons";
import { StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

export function MinecraftServersClient() {
  const { servers, isLoading, mutate } = useMcAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasAnyAccess = servers.some((s) => s.hasAccess);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Server grid */}
      {servers.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => (
            <StaggerItem key={server.id}>
              <ServerCard server={server} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Icons.Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No servers available
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter an access code below to unlock a server.
          </p>
        </div>
      )}

      {/* Access code input */}
      <AccessCodeInput onSuccess={() => mutate()} />
    </div>
  );
}
