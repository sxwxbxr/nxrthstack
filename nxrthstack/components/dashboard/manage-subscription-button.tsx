"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleManage = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
    >
      {isLoading ? (
        <Icons.Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icons.Settings className="h-4 w-4" />
      )}
      Manage Subscription
    </button>
  );
}
