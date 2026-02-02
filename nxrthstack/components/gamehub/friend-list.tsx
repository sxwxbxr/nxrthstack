"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import type { FriendWithUser, FriendRequest } from "@/lib/gamehub/friends";

interface FriendListProps {
  initialFriends: FriendWithUser[];
  initialPending: FriendRequest[];
  initialSent: FriendRequest[];
}

type Tab = "friends" | "pending" | "sent";

export function FriendList({
  initialFriends,
  initialPending,
  initialSent,
}: FriendListProps) {
  const [friends, setFriends] = useState(initialFriends);
  const [pending, setPending] = useState(initialPending);
  const [sent, setSent] = useState(initialSent);
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      const res = await fetch(`/api/gamehub/friends/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        const request = pending.find((p) => p.id === requestId);
        if (request) {
          setPending((prev) => prev.filter((p) => p.id !== requestId));
          // Refresh the page to get updated friends list
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      const res = await fetch(`/api/gamehub/friends/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });

      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== requestId));
      }
    } catch (error) {
      console.error("Error declining request:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    setLoadingId(friendId);
    try {
      const res = await fetch(`/api/gamehub/friends/${friendId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.friendId !== friendId));
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "pending", label: "Requests", count: pending.length },
    { id: "sent", label: "Sent", count: sent.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No friends yet</p>
              <p className="text-sm">Add friends to see their activity!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {friend.discordAvatar ? (
                    <img
                      src={friend.discordAvatar}
                      alt={friend.name || "Friend"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {(friend.name || friend.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {friend.discordUsername || friend.name || friend.email}
                    </p>
                    {friend.discordUsername && friend.name && (
                      <p className="text-xs text-muted-foreground">{friend.name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(friend.friendId)}
                  disabled={loadingId === friend.friendId}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Remove friend"
                >
                  {loadingId === friend.friendId ? (
                    <Icons.Spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.UserMinus className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === "pending" && (
        <div className="space-y-2">
          {pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            pending.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  {request.discordAvatar ? (
                    <img
                      src={request.discordAvatar}
                      alt={request.name || "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {(request.name || request.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {request.discordUsername || request.name || request.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={loadingId === request.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {loadingId === request.id ? (
                      <Icons.Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.Check className="h-4 w-4" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={loadingId === request.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Icons.X className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === "sent" && (
        <div className="space-y-2">
          {sent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sent requests</p>
            </div>
          ) : (
            sent.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  {request.discordAvatar ? (
                    <img
                      src={request.discordAvatar}
                      alt={request.name || "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {(request.name || request.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {request.discordUsername || request.name || request.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                  Pending
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
