"use client";

import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import Link from "next/link";

interface DiscordStepProps {
  hasDiscord: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function DiscordStep({ hasDiscord, onNext, onSkip }: DiscordStepProps) {
  if (hasDiscord) {
    // User already has Discord connected
    return (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
        >
          <Icons.Check className="h-10 w-10 text-green-500" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Discord Connected!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your Discord account is already linked. You&apos;ll be able to see your friends and get notifications.
          </p>
        </div>

        <ShimmerButton onClick={onNext} className="w-full max-w-xs mx-auto">
          Continue
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </ShimmerButton>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#5865F2]/10"
      >
        <Icons.Link className="h-10 w-10 text-[#5865F2]" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Connect Discord
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Link your Discord account to find friends, get notifications about gaming sessions, and more.
        </p>
      </div>

      <div className="space-y-3 py-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 text-left">
          <Icons.Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Find Friends</p>
            <p className="text-xs text-muted-foreground">Connect with other GameHub users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 text-left">
          <Icons.Bell className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Get Notified</p>
            <p className="text-xs text-muted-foreground">Session invites and achievements</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/dashboard/settings" className="w-full max-w-xs mx-auto">
          <ShimmerButton className="w-full" onClick={onNext}>
            <Icons.Link className="mr-2 h-4 w-4" />
            Connect Discord
          </ShimmerButton>
        </Link>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
