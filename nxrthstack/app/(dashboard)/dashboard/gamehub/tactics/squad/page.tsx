"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { SquadBuilder } from "@/components/gamehub/tactics/squad-builder";
import { Icons } from "@/components/icons";
import type { Squad } from "@/lib/gamehub/tactics/types";

interface SquadData {
  attackSquad: Squad | null;
  defenseSquad: Squad | null;
  unlockedUnitIds: string[];
}

export default function SquadManagementPage() {
  const [data, setData] = useState<SquadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Ensure player profile exists
        await fetch("/api/gamehub/tactics/player");

        const res = await fetch("/api/gamehub/tactics/squad");
        if (!res.ok) throw new Error("Failed to load squads");
        const json = await res.json();
        setData({
          attackSquad: json.attackSquad as Squad | null,
          defenseSquad: json.defenseSquad as Squad | null,
          unlockedUnitIds: json.unlockedUnitIds as string[],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(type: "attack" | "defense", squad: Squad) {
    const res = await fetch("/api/gamehub/tactics/squad", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, squad }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || "Failed to load data"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold">
          <GradientText>Squad Management</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Build your attack and defense squads. Configure unit positions and behavior rules.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <SquadBuilder
          attackSquad={data.attackSquad}
          defenseSquad={data.defenseSquad}
          unlockedUnitIds={data.unlockedUnitIds}
          onSave={handleSave}
        />
      </FadeIn>
    </div>
  );
}
