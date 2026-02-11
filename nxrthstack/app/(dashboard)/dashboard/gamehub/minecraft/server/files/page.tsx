"use client";

import { McFileBrowser } from "@/components/minecraft/mc-file-browser";
import { FadeIn } from "@/components/ui/fade-in";

export default function McFilesPage() {
  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">Files</h1>
      <McFileBrowser />
    </FadeIn>
  );
}
