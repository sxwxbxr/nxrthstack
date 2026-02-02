"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

const GAME_OPTIONS = [
  { value: "r6", label: "Rainbow Six Siege" },
  { value: "valorant", label: "Valorant" },
  { value: "csgo", label: "CS2" },
  { value: "apex", label: "Apex Legends" },
  { value: "fortnite", label: "Fortnite" },
  { value: "minecraft", label: "Minecraft" },
  { value: "chess", label: "Chess" },
  { value: "other", label: "Other" },
];

interface RecordMatchFormProps {
  rivalryId: string;
  userId: string;
  opponentId: string;
  opponentName: string;
}

export function RecordMatchForm({
  rivalryId,
  userId,
  opponentId,
  opponentName,
}: RecordMatchFormProps) {
  const [game, setGame] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !result || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/gamehub/rivalries/${rivalryId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          winnerId: result === "win" ? userId : result === "loss" ? opponentId : undefined,
          loserId: result === "loss" ? userId : result === "win" ? opponentId : undefined,
          isDraw: result === "draw",
        }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to record match");
      }
    } catch (error) {
      console.error("Error recording match:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Game Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Game
        </label>
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">Select a game...</option>
          {GAME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Result Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Result
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setResult("win")}
            className={`flex flex-col items-center gap-1 p-4 rounded-lg border transition-colors ${
              result === "win"
                ? "border-green-500 bg-green-500/10 text-green-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Icons.Trophy className="h-6 w-6" />
            <span className="text-sm font-medium">I Won</span>
          </button>
          <button
            type="button"
            onClick={() => setResult("loss")}
            className={`flex flex-col items-center gap-1 p-4 rounded-lg border transition-colors ${
              result === "loss"
                ? "border-red-500 bg-red-500/10 text-red-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Icons.X className="h-6 w-6" />
            <span className="text-sm font-medium">I Lost</span>
          </button>
          <button
            type="button"
            onClick={() => setResult("draw")}
            className={`flex flex-col items-center gap-1 p-4 rounded-lg border transition-colors ${
              result === "draw"
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <Icons.Minus className="h-6 w-6" />
            <span className="text-sm font-medium">Draw</span>
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!game || !result || isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500 text-white hover:bg-purple-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Icons.Spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.Check className="h-4 w-4" />
        )}
        Record Match
      </button>
    </form>
  );
}
