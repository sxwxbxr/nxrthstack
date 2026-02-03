"use client";

import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import Link from "next/link";

interface CompleteStepProps {
  onComplete: () => void;
}

const quickLinks = [
  {
    title: "Rainbow Six",
    description: "Start tracking your 1v1s",
    href: "/dashboard/gamehub/r6",
    icon: Icons.Gamepad,
    color: "text-blue-500",
  },
  {
    title: "Pokemon Tools",
    description: "Edit ROMs and saves",
    href: "/dashboard/gamehub/pokemon",
    icon: Icons.Sparkles,
    color: "text-yellow-500",
  },
  {
    title: "Achievements",
    description: "View your progress",
    href: "/dashboard/gamehub/achievements",
    icon: Icons.Trophy,
    color: "text-amber-500",
  },
];

export function CompleteStep({ onComplete }: CompleteStepProps) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10"
      >
        <Icons.Check className="h-12 w-12 text-green-500" />
      </motion.div>

      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground"
        >
          You&apos;re All Set!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          GameHub is ready for you. Start exploring your favorite games and connecting with friends.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 pt-2"
      >
        <p className="text-sm font-medium text-foreground">Quick Links</p>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link, index) => (
            <Link key={link.href} href={link.href} onClick={onComplete}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="rounded-lg border border-border bg-card/50 p-3 hover:border-primary/50 hover:bg-card transition-all group"
              >
                <link.icon className={`h-6 w-6 mx-auto mb-2 ${link.color} group-hover:scale-110 transition-transform`} />
                <p className="text-xs font-medium text-foreground">{link.title}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="pt-4"
      >
        <ShimmerButton onClick={onComplete} className="w-full max-w-xs mx-auto">
          Start Exploring
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </ShimmerButton>
      </motion.div>
    </div>
  );
}
