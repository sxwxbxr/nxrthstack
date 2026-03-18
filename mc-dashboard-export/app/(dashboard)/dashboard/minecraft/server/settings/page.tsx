"use client";

import { McSettings } from "@/components/minecraft/mc-settings";
import { FadeIn } from "@/components/ui/fade-in";

export default function McSettingsPage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Settings</h1>
      <McSettings />
    </FadeIn>
  );
}
