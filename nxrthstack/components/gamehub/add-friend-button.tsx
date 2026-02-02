"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons";

interface SearchResult {
  id: string;
  name: string | null;
  email: string;
  discordUsername: string | null;
}

export function AddFriendButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/gamehub/friends?search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchUsers]);

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    try {
      const res = await fetch("/api/gamehub/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId }),
      });

      if (res.ok) {
        setSentIds((prev) => new Set([...prev, userId]));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
      >
        <Icons.UserPlus className="h-4 w-4" />
        Add Friend
      </button>

      {/* Modal Overlay */}
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
                Add Friend
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <Icons.X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email, or Discord..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {isSearching && (
                  <Icons.Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto px-4 pb-4">
              {query.length < 2 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Type at least 2 characters to search
                </p>
              ) : results.length === 0 && !isSearching ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No users found
                </p>
              ) : (
                <div className="space-y-2">
                  {results.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.discordUsername || user.name || user.email}
                          </p>
                          {user.discordUsername && user.name && (
                            <p className="text-xs text-muted-foreground">
                              {user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {sentIds.has(user.id) ? (
                        <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-500">
                          Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={sendingTo === user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {sendingTo === user.id ? (
                            <Icons.Spinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icons.UserPlus className="h-4 w-4" />
                          )}
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
