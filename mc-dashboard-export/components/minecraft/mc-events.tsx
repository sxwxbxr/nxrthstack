"use client";

import { useState } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface McEvent {
  id: string;
  action: string;
  category: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const CATEGORIES = [
  "all",
  "access",
  "server",
  "console",
  "player",
  "file",
  "backup",
  "config",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  access: "bg-blue-500/10 text-blue-400",
  server: "bg-green-500/10 text-green-400",
  console: "bg-purple-500/10 text-purple-400",
  player: "bg-amber-500/10 text-amber-400",
  file: "bg-cyan-500/10 text-cyan-400",
  backup: "bg-orange-500/10 text-orange-400",
  config: "bg-pink-500/10 text-pink-400",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function McEvents() {
  const { serverId } = useMcContext();
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 30;

  const categoryParam = category === "all" ? "" : `&category=${category}`;
  const { data, isLoading } = useSWR<{ events: McEvent[]; total: number }>(
    `/api/gamehub/minecraft/server/events?serverId=${serverId}&limit=${limit}&offset=${page * limit}${categoryParam}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPage(0);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data?.events.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No events found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.events.map((event) => (
              <div key={event.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                          CATEGORY_COLORS[event.category] ||
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {event.category}
                      </span>
                      <span className="text-sm text-foreground">
                        {event.action}
                      </span>
                    </div>
                    {event.userName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {event.userName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
