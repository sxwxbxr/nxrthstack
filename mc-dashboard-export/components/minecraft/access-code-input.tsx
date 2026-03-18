"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface AccessCodeInputProps {
  onSuccess: () => void;
}

export function AccessCodeInput({ onSuccess }: AccessCodeInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "/api/gamehub/minecraft/server/access/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to redeem code");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icons.Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Have an access code?
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter it below to unlock a server
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="NXRTH-MC-XXXX"
            className={cn(
              "flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-mono tracking-wider",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              error && "border-red-500/50",
              success && "border-green-500/50"
            )}
            disabled={loading || success}
            maxLength={20}
          />
          <button
            type="submit"
            disabled={!code.trim() || loading || success}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              success
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <Icons.Check className="h-4 w-4" />
            ) : (
              "Unlock"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-xs text-green-500">
            Access granted! Redirecting...
          </p>
        )}
      </div>
    </form>
  );
}
