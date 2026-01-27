"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { HoverEffect } from "@/components/ui/card-hover-effect";

const features = [
  {
    title: "1v1 Tracker",
    description:
      "Track your 1v1 matches against friends. Create lobbies, record wins/losses, and view detailed statistics.",
    link: "/dashboard/gamehub/r6/1v1",
    icon: <Icons.Users className="h-6 w-6" />,
  },
  {
    title: "Tournaments",
    description:
      "Create bracket-style tournaments with full tracking. Single elimination, customizable formats, and detailed stats.",
    link: "/dashboard/gamehub/r6/tournaments",
    icon: <Icons.Swords className="h-6 w-6" />,
  },
  {
    title: "Operator Randomizer",
    description:
      "Randomize your operator and loadout for fun challenges. Perfect for custom games and variety.",
    link: "/dashboard/gamehub/r6/randomizer",
    icon: <Icons.Zap className="h-6 w-6" />,
  },
  {
    title: "Strat Roulette",
    description:
      "Spin the wheel for random strategies and challenges. Spice up your matches with fun and challenging rules.",
    link: "/dashboard/gamehub/r6/strat-roulette",
    icon: <Icons.Shuffle className="h-6 w-6" />,
  },
  {
    title: "Callout Maps",
    description:
      "Interactive maps with all the callouts you need. Search, filter, and learn callouts for every map.",
    link: "/dashboard/gamehub/r6/callouts",
    icon: <Icons.Globe className="h-6 w-6" />,
  },
];

export function R6Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature) => (
        <Link key={feature.title} href={feature.link}>
          <div className="relative group block p-2 h-full w-full">
            <div className="rounded-2xl h-full w-full p-6 overflow-hidden bg-card border border-border relative z-20 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h4 className="text-foreground font-bold tracking-wide">
                  {feature.title}
                </h4>
              </div>
              <p className="text-muted-foreground tracking-wide leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
