"use client";

import { McEvents } from "@/components/minecraft/mc-events";
import { FadeIn } from "@/components/ui/fade-in";

export default function McEventsPage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Event Log</h1>
      <McEvents />
    </FadeIn>
  );
}
