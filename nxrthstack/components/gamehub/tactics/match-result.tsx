"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { MatchData } from "@/lib/gamehub/tactics/types";
import Link from "next/link";

interface MatchResultProps {
  match: MatchData;
}

export function MatchResult({ match }: MatchResultProps) {
  const isWin = match.winner === "attacker";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      {/* Victory / Defeat Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "text-center mb-6 py-3 rounded-lg",
          isWin ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
        )}
      >
        <h2 className={cn("text-2xl font-bold", isWin ? "text-green-400" : "text-red-400")}>
          {isWin ? "Victory!" : "Defeat"}
        </h2>
      </motion.div>

      {/* Opponent Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Opponent</p>
          <p className="font-semibold text-foreground">{match.defenderName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Their Rating</p>
          <p className="font-semibold text-foreground">{match.defenderRatingBefore}</p>
        </div>
      </div>

      {/* Rating Change */}
      <div className="flex items-center justify-center gap-4 mb-4 py-3 rounded-lg bg-background">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Your Rating</p>
          <p className="text-lg font-bold text-foreground">{match.attackerRatingBefore}</p>
        </div>
        <div className={cn("text-lg font-bold", match.attackerRatingChange >= 0 ? "text-green-400" : "text-red-400")}>
          {match.attackerRatingChange >= 0 ? "+" : ""}{match.attackerRatingChange}
        </div>
        <Icons.ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">New Rating</p>
          <p className="text-lg font-bold text-foreground">
            {match.attackerRatingBefore + match.attackerRatingChange}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">Damage Dealt</p>
          <p className="font-bold text-orange-400">{match.stats.attackerDamageDealt}</p>
        </div>
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">Damage Taken</p>
          <p className="font-bold text-red-400">{match.stats.defenderDamageDealt}</p>
        </div>
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">Units Lost</p>
          <p className="font-bold text-foreground">{match.stats.attackerUnitsLost}</p>
        </div>
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-bold text-foreground">{match.durationSeconds}s</p>
        </div>
      </div>

      {/* Currency Earned */}
      <div className="flex items-center justify-center gap-2 mb-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <Icons.DollarSign className="h-4 w-4 text-yellow-400" />
        <span className="font-semibold text-yellow-400">+{match.currencyEarned} currency</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/gamehub/tactics/replay/${match.matchId}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Icons.Eye className="h-4 w-4" />
          Watch Replay
        </Link>
      </div>
    </motion.div>
  );
}
