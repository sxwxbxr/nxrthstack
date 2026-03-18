"use client";

import { McBackups } from "@/components/minecraft/mc-backups";
import { FadeIn } from "@/components/ui/fade-in";

export default function McBackupsPage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Backups</h1>
      <McBackups />
    </FadeIn>
  );
}
