"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { GradientText } from "@/components/ui/gradient-text";
import { FlipWords } from "@/components/ui/flip-words";

interface Operator {
  id: string;
  name: string;
  role: string;
  iconUrl: string | null;
  primaryWeapons: string[];
  secondaryWeapons: string[];
  gadgets: string[];
}

interface Loadout {
  primary: string | null;
  secondary: string | null;
  gadget: string | null;
}

interface Attachments {
  sight: string | null;
  barrel: string | null;
  grip: string | null;
  underbarrel: string | null;
}

interface RandomResult {
  operator: Operator;
  loadout: Loadout;
  attachments: Attachments;
}

const rollingWords = [
  "Ash",
  "Sledge",
  "Thermite",
  "Jäger",
  "Bandit",
  "Doc",
  "Smoke",
  "Mute",
  "Thatcher",
  "Pulse",
];

export function OperatorRandomizer() {
  const [role, setRole] = useState<"attacker" | "defender" | null>(null);
  const [result, setResult] = useState<RandomResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noOperators, setNoOperators] = useState(false);

  async function handleRandomize() {
    setIsLoading(true);
    setIsRolling(true);
    setError(null);
    setResult(null);

    // Show rolling animation for a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const response = await fetch("/api/gamehub/r6/randomize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error.includes("No operators")) {
          setNoOperators(true);
          throw new Error(
            "No operators found in database. Please run the seed script first."
          );
        }
        throw new Error(data.error || "Failed to randomize");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to randomize");
    } finally {
      setIsLoading(false);
      setIsRolling(false);
    }
  }

  function handleReset() {
    setResult(null);
    setRole(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Select Side</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setRole(null)}
            className={`rounded-lg border p-4 text-center transition-all ${
              role === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:border-primary/50"
            }`}
          >
            <Icons.Zap className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Any</p>
          </button>
          <button
            onClick={() => setRole("attacker")}
            className={`rounded-lg border p-4 text-center transition-all ${
              role === "attacker"
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-border bg-background text-foreground hover:border-orange-500/50"
            }`}
          >
            <Icons.ArrowRight className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Attacker</p>
          </button>
          <button
            onClick={() => setRole("defender")}
            className={`rounded-lg border p-4 text-center transition-all ${
              role === "defender"
                ? "border-blue-500 bg-blue-500/10 text-blue-500"
                : "border-border bg-background text-foreground hover:border-blue-500/50"
            }`}
          >
            <Icons.Home className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Defender</p>
          </button>
        </div>
      </div>

      {/* Randomize Button */}
      <div className="flex justify-center">
        <ShimmerButton
          onClick={handleRandomize}
          disabled={isLoading}
          className="px-12 py-4 text-lg"
        >
          {isLoading ? (
            <>
              <Icons.Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Randomizing...
            </>
          ) : (
            <>
              <Icons.Zap className="h-5 w-5 mr-2" />
              Randomize!
            </>
          )}
        </ShimmerButton>
      </div>

      {/* Rolling Animation */}
      <AnimatePresence>
        {isRolling && !result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <div className="text-4xl font-bold">
              <FlipWords words={rollingWords} duration={200} />
            </div>
            <p className="mt-4 text-muted-foreground">
              Finding your operator...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 mb-4"
              >
                <Icons.User className="h-12 w-12 text-primary" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold"
              >
                <GradientText>{result.operator.name}</GradientText>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`mt-2 text-lg font-medium ${
                  result.operator.role === "attacker"
                    ? "text-orange-500"
                    : "text-blue-500"
                }`}
              >
                {result.operator.role === "attacker" ? "Attacker" : "Defender"}
              </motion.p>
            </div>

            {/* Loadout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-4"
            >
              {result.loadout.primary && (
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Primary
                  </p>
                  <p className="font-semibold text-foreground">
                    {result.loadout.primary}
                  </p>
                </div>
              )}
              {result.loadout.secondary && (
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Secondary
                  </p>
                  <p className="font-semibold text-foreground">
                    {result.loadout.secondary}
                  </p>
                </div>
              )}
              {result.loadout.gadget && (
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Gadget
                  </p>
                  <p className="font-semibold text-foreground">
                    {result.loadout.gadget}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Attachments */}
            {(result.attachments.sight || result.attachments.barrel || result.attachments.grip || result.attachments.underbarrel) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
                  Attachments
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.attachments.sight && (
                    <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Sight</p>
                      <p className="text-sm font-medium text-foreground">
                        {result.attachments.sight}
                      </p>
                    </div>
                  )}
                  {result.attachments.barrel && (
                    <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Barrel</p>
                      <p className="text-sm font-medium text-foreground">
                        {result.attachments.barrel}
                      </p>
                    </div>
                  )}
                  {result.attachments.grip && (
                    <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Grip</p>
                      <p className="text-sm font-medium text-foreground">
                        {result.attachments.grip}
                      </p>
                    </div>
                  )}
                  {result.attachments.underbarrel && (
                    <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Underbarrel</p>
                      <p className="text-sm font-medium text-foreground">
                        {result.attachments.underbarrel}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-4 mt-8"
            >
              <ShimmerButton onClick={handleRandomize} disabled={isLoading}>
                <Icons.Zap className="h-4 w-4 mr-2" />
                Randomize Again
              </ShimmerButton>
              <button
                onClick={handleReset}
                className="rounded-lg border border-border bg-card px-6 py-2 font-medium text-foreground hover:bg-accent transition-colors"
              >
                Reset
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <Icons.AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
          {noOperators && (
            <p className="mt-2 text-sm text-muted-foreground">
              Run{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                npx tsx scripts/seed-r6-operators.ts
              </code>{" "}
              to populate operators.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
