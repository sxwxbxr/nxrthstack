"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";

interface FriendToggleProps {
  userId: string;
  initialValue: boolean;
}

export function FriendToggle({ userId, initialValue }: FriendToggleProps) {
  const router = useRouter();
  const [isFriend, setIsFriend] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFriend: !isFriend }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      setIsFriend(!isFriend);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle friend status:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        isFriend ? "bg-primary" : "bg-muted"
      }`}
      role="switch"
      aria-checked={isFriend}
      title={isFriend ? "Remove Friend Status" : "Grant Friend Status"}
    >
      <span className="sr-only">Toggle friend status</span>
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isFriend ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {isLoading && (
          <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </span>
    </button>
  );
}
