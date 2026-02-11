"use client";

import { useState } from "react";
import { McPropertiesEditor } from "@/components/minecraft/mc-properties-editor";
import { McJvmEditor } from "@/components/minecraft/mc-jvm-editor";
import { FadeIn } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

type Tab = "properties" | "jvm";

export default function McConfigPage() {
  const [tab, setTab] = useState<Tab>("properties");

  return (
    <FadeIn>
      <h1 className="text-xl font-bold text-foreground mb-4">
        Server Config
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab("properties")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "properties"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          server.properties
        </button>
        <button
          onClick={() => setTab("jvm")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "jvm"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          JVM Settings
        </button>
      </div>

      {tab === "properties" ? <McPropertiesEditor /> : <McJvmEditor />}
    </FadeIn>
  );
}
