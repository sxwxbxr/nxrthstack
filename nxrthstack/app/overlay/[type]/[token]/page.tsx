import { db } from "@/lib/db";
import { streamOverlays, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ShinyCounterOverlay } from "./shiny-counter-overlay";
import { R6StatsOverlay } from "./r6-stats-overlay";
import { PokemonTeamOverlay } from "./pokemon-team-overlay";

interface OverlayPageProps {
  params: Promise<{
    type: string;
    token: string;
  }>;
}

export default async function OverlayPage({ params }: OverlayPageProps) {
  const { type, token } = await params;

  // Fetch overlay data
  const [overlay] = await db
    .select({
      id: streamOverlays.id,
      type: streamOverlays.type,
      name: streamOverlays.name,
      config: streamOverlays.config,
      isActive: streamOverlays.isActive,
      userName: users.name,
    })
    .from(streamOverlays)
    .innerJoin(users, eq(streamOverlays.userId, users.id))
    .where(eq(streamOverlays.accessToken, token))
    .limit(1);

  if (!overlay || !overlay.isActive || overlay.type !== type) {
    notFound();
  }

  const config = overlay.config as Record<string, unknown>;

  // Render appropriate overlay based on type
  switch (type) {
    case "shiny_counter":
      return <ShinyCounterOverlay config={config} />;
    case "r6_stats":
      return <R6StatsOverlay config={config} />;
    case "pokemon_team":
      return <PokemonTeamOverlay config={config} />;
    default:
      notFound();
  }
}
