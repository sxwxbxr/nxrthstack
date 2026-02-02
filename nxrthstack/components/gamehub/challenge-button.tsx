"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import type { FriendWithUser } from "@/lib/gamehub/friends";

interface ChallengeButtonProps {
  friends: FriendWithUser[];
}

export function ChallengeButton({ friends }: ChallengeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const handleChallenge = async () => {
    if (!selectedFriend || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/gamehub/rivalries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId: selectedFriend }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send challenge");
      }
    } catch (error) {
      console.error("Error sending challenge:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 text-sm font-medium transition-colors"
      >
        <Icons.Swords className="h-4 w-4" />
        Challenge Friend
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Start a Rivalry
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <Icons.X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Select a friend to challenge to a head-to-head rivalry.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend.friendId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedFriend === friend.friendId
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {friend.discordAvatar ? (
                      <img
                        src={friend.discordAvatar}
                        alt={friend.name || "Friend"}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {(friend.name || friend.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">
                        {friend.discordUsername || friend.name || friend.email}
                      </p>
                      {friend.discordUsername && friend.name && (
                        <p className="text-xs text-muted-foreground">{friend.name}</p>
                      )}
                    </div>
                    {selectedFriend === friend.friendId && (
                      <Icons.Check className="h-5 w-5 text-purple-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChallenge}
                disabled={!selectedFriend || isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Icons.Spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Swords className="h-4 w-4" />
                )}
                Send Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
