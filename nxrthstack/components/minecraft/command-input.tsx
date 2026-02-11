"use client";

import { useState, useRef, useCallback } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

const MAX_HISTORY = 50;

export function CommandInput({ onSend, disabled }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<string[]>(
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(
              localStorage.getItem("mc-cmd-history") ?? "[]"
            ) as string[];
          } catch {
            return [];
          }
        })()
      : []
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const pushHistory = useCallback((cmd: string) => {
    const history = historyRef.current;
    // Remove duplicate if already at top
    if (history[0] === cmd) return;
    history.unshift(cmd);
    if (history.length > MAX_HISTORY) history.pop();
    try {
      localStorage.setItem("mc-cmd-history", JSON.stringify(history));
    } catch {
      // localStorage full
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Strip leading / if present
    const command = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    if (!command) return;

    onSend(command);
    pushHistory(command);
    setValue("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const history = historyRef.current;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      if (nextIndex >= 0 && history[nextIndex]) {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex < 0) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
          /
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHistoryIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm font-mono",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Icons.Send className="h-4 w-4" />
      </button>
    </form>
  );
}
