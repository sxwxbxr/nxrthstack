"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { MatchResult } from "@/components/gamehub/tactics/match-result";
import { Icons } from "@/components/icons";
import type { MatchData } from "@/lib/gamehub/tactics/types";

type BattleState = "idle" | "searching" | "result" | "error";

export default function BattlePage() {
  const [state, setState] = useState<BattleState>("idle");
  const [matchResult, setMatchResult] = useState<MatchData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function findMatch() {
    setState("searching");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/gamehub/tactics/match", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to find match");
        setState("error");
        return;
      }

      setMatchResult(json.match as MatchData);
      setState("result");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setMatchResult(null);
    setErrorMessage(null);
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold">
          <GradientText>Battle Arena</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find an opponent and battle with your attack squad against their defense.
        </p>
      </FadeIn>

      <div className="max-w-lg mx-auto">
        {/* Idle State */}
        {state === "idle" && (
          <FadeIn delay={0.1}>
            <div className="text-center space-y-6">
              <div className="rounded-xl border border-border bg-card p-8">
                <Icons.Swords className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Ready to Battle?</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your attack squad will fight against another player&apos;s defense squad.
                  The battle is simulated instantly and you can watch the replay.
                </p>
                <ShimmerButton onClick={findMatch}>
                  <Icons.Swords className="h-4 w-4 mr-2" />
                  Find Match
                </ShimmerButton>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Searching State */}
        {state === "searching" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4 py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Icons.Swords className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">Finding opponent...</p>
            <p className="text-sm text-muted-foreground">Simulating battle</p>
          </motion.div>
        )}

        {/* Result State */}
        {state === "result" && matchResult && (
          <div className="space-y-4">
            <MatchResult match={matchResult} />
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Icons.Swords className="inline h-4 w-4 mr-2" />
              Battle Again
            </button>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <FadeIn>
            <div className="text-center space-y-4">
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8">
                <Icons.AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">{errorMessage}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Make sure you have an attack squad set up with at least 3 units.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
