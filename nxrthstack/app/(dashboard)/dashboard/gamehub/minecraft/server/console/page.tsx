"use client";

import { McConsole } from "@/components/minecraft/mc-console";
import { FadeIn } from "@/components/ui/fade-in";

export default function McConsolePage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Console</h1>
      <McConsole />
    </FadeIn>
  );
}
