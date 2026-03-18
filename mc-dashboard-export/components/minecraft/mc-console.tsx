"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMcContext } from "@/components/minecraft/mc-context";
import {
  useMcConsoleStream,
  type ConsoleLogEntry,
} from "@/hooks/use-mc-console-stream";
import { CommandInput } from "@/components/minecraft/command-input";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";

type LevelFilter = "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";

const LEVEL_COLORS: Record<string, string> = {
  INFO: "text-foreground",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
  FATAL: "text-red-500 font-bold",
  DEBUG: "text-muted-foreground",
};

const CATEGORY_COLORS: Record<string, string> = {
  chat: "text-blue-400",
  join: "text-green-400",
  leave: "text-orange-400",
  death: "text-red-300",
};

const CONNECTION_LABELS: Record<string, { label: string; color: string }> = {
  connected: { label: "Connected", color: "bg-green-500" },
  connecting: { label: "Connecting...", color: "bg-yellow-500 animate-pulse" },
  disconnected: { label: "Disconnected", color: "bg-red-500" },
  error: { label: "Error", color: "bg-red-500" },
};

function LogLine({ entry }: { entry: ConsoleLogEntry }) {
  const categoryColor = CATEGORY_COLORS[entry.category];
  const levelColor = categoryColor || LEVEL_COLORS[entry.level] || "text-foreground";
  const time = entry.timestamp.slice(11, 19);

  return (
    <div className="flex gap-2 text-xs font-mono leading-5 hover:bg-accent/30">
      <span className="text-muted-foreground/60 select-none shrink-0">
        {time}
      </span>
      <span
        className={cn("text-muted-foreground/60 w-12 text-right select-none shrink-0", {
          "text-yellow-400": entry.level === "WARN",
          "text-red-400": entry.level === "ERROR" || entry.level === "FATAL",
        })}
      >
        {entry.level}
      </span>
      <span className={cn("break-all", levelColor)}>{entry.message}</span>
    </div>
  );
}

export function McConsole() {
  const { serverId, userRole } = useMcContext();
  const { lines, connectionState, clearLines, reconnect } =
    useMcConsoleStream({ serverId });

  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch] = useState("");
  const [hiddenLevels, setHiddenLevels] = useState<Set<LevelFilter>>(
    new Set()
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const isCanSend = hasMinRole(userRole, "operator");

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  // Filter lines
  const filteredLines = lines.filter((line) => {
    if (hiddenLevels.has(line.level as LevelFilter)) return false;
    if (search && !line.message.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleLevel = (level: LevelFilter) => {
    setHiddenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const handleSendCommand = async (command: string) => {
    try {
      await fetch("/api/gamehub/minecraft/server/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, command }),
      });
    } catch {
      // Error will show up in console stream
    }
  };

  const conn = CONNECTION_LABELS[connectionState];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", conn.color)} />
            <span className="text-xs text-muted-foreground">{conn.label}</span>
          </div>

          {/* Level filters */}
          <div className="flex items-center gap-1">
            {(["INFO", "WARN", "ERROR", "DEBUG"] as LevelFilter[]).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                    hiddenLevels.has(level)
                      ? "bg-muted text-muted-foreground/40 line-through"
                      : level === "ERROR"
                        ? "bg-red-500/10 text-red-400"
                        : level === "WARN"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-accent text-foreground"
                  )}
                >
                  {level}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Icons.Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              className="rounded-lg border border-border bg-background pl-7 pr-3 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => {
              setAutoScroll(!autoScroll);
              if (!autoScroll && scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }}
            className={cn(
              "rounded p-1.5 transition-colors",
              autoScroll
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
            title={autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
          >
            <Icons.ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={clearLines}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent transition-colors"
            title="Clear console"
          >
            <Icons.Trash className="h-3.5 w-3.5" />
          </button>

          {/* Reconnect */}
          {connectionState !== "connected" && (
            <button
              onClick={reconnect}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              title="Reconnect"
            >
              <Icons.RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-background rounded-lg border border-border mt-3 p-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {filteredLines.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {connectionState === "connected"
              ? "Waiting for log output..."
              : "Connecting to server..."}
          </div>
        ) : (
          filteredLines.map((line, i) => <LogLine key={i} entry={line} />)
        )}
      </div>

      {/* Command input */}
      {isCanSend && (
        <div className="mt-3">
          <CommandInput
            onSend={handleSendCommand}
            disabled={connectionState !== "connected"}
          />
        </div>
      )}
    </div>
  );
}
