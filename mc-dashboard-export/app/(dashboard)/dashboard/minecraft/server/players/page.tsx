"use client";

import { McPlayers } from "@/components/minecraft/mc-players";
import { FadeIn } from "@/components/ui/fade-in";

export default function McPlayersPage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Players</h1>
      <McPlayers />
    </FadeIn>
  );
}
