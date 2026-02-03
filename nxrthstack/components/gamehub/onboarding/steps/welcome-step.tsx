"use client";

import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface WelcomeStepProps {
  userName: string | null;
  onNext: () => void;
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <Icons.Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome to GameHub{userName ? `, ${userName}` : ""}!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your personal gaming companion is ready. Let&apos;s take a quick tour to help you get the most out of GameHub.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 py-4">
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <Icons.Gamepad className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium">Game Tools</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <Icons.Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-sm font-medium">Achievements</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <Icons.Users className="h-8 w-8 mx-auto text-cyan-500 mb-2" />
          <p className="text-sm font-medium">Community</p>
        </div>
      </div>

      <ShimmerButton onClick={onNext} className="w-full max-w-xs mx-auto">
        Let&apos;s Get Started
        <Icons.ArrowRight className="ml-2 h-4 w-4" />
      </ShimmerButton>
    </div>
  );
}
