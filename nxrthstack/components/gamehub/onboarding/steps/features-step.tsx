"use client";

import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface FeaturesStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Icons.Gamepad,
    title: "Rainbow Six Siege",
    description: "1v1 tracker, operator randomizer, and callouts maps",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Icons.Sparkles,
    title: "Pokemon",
    description: "ROM editor, save editor, and randomizer tools",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Icons.Package,
    title: "Minecraft",
    description: "Server tools and enchantment planners",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Icons.Trophy,
    title: "Achievements",
    description: "Unlock achievements and earn points across all games",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Icons.Calendar,
    title: "Session Scheduler",
    description: "Plan gaming sessions with friends",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Icons.Tv,
    title: "Stream Overlays",
    description: "Customizable overlays for OBS and streaming",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
];

export function FeaturesStep({ onNext }: FeaturesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Explore GameHub Features
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s what you can do with GameHub
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-border bg-card/50 p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bgColor}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <ShimmerButton onClick={onNext} className="w-full max-w-xs">
          Continue
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </ShimmerButton>
      </div>
    </div>
  );
}
