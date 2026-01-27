"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function JoinTournamentForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gamehub/r6/tournaments/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join tournament");
      }

      router.push(`/dashboard/gamehub/r6/tournaments/${data.tournament.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join tournament");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Enter invite code"
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none uppercase tracking-widest font-mono"
          maxLength={20}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
      <ShimmerButton type="submit" disabled={isLoading || !inviteCode.trim()}>
        {isLoading ? (
          <Icons.Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Icons.ArrowRight className="h-4 w-4 mr-2" />
            Join
          </>
        )}
      </ShimmerButton>
    </form>
  );
}
