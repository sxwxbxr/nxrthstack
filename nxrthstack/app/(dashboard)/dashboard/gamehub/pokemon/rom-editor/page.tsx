import { auth } from "@/lib/auth";
import { db, romConfigs, pokemonSpecies, storedRoms } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ROMEditorClient } from "@/components/gamehub/rom-editor-client";

export const metadata = {
  title: "ROM Editor | Pokemon - NxrthStack",
};

async function getROMConfigs() {
  return db.query.romConfigs.findMany({
    where: eq(romConfigs.isActive, true),
  });
}

async function getPokemonSpecies() {
  return db.query.pokemonSpecies.findMany({
    where: eq(pokemonSpecies.isActive, true),
  });
}

async function getStoredRoms() {
  return db.query.storedRoms.findMany({
    where: eq(storedRoms.isActive, true),
    orderBy: [desc(storedRoms.createdAt)],
  });
}

export default async function ROMEditorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [configs, pokemon, savedRoms] = await Promise.all([
    getROMConfigs(),
    getPokemonSpecies(),
    getStoredRoms(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/pokemon"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Pokemon
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            <GradientText>ROM Editor</GradientText>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload a ROM file to detect and edit your game
          </p>
        </div>
      </FadeIn>

      {/* ROM Editor */}
      <FadeIn delay={0.1}>
        <ROMEditorClient
          romConfigs={configs}
          pokemonSpecies={pokemon}
          storedRoms={savedRoms.map((rom) => {
            const config = configs.find((c) => c.gameCode === rom.gameCode);
            return {
              id: rom.id,
              displayName: rom.displayName,
              gameCode: rom.gameCode,
              gameName: config?.gameName || rom.gameCode,
              platform: config?.platform || "Unknown",
              generation: config?.generation || 0,
              fileSizeBytes: Number(rom.fileSizeBytes),
            };
          })}
        />
      </FadeIn>
    </div>
  );
}
