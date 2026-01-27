import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

export const metadata = {
  title: "Pokemon | GameHub - NxrthStack",
};

const pokemonFeatures = [
  {
    title: "ROM Editor",
    description: "Upload and edit Gen 1-3 Pokemon ROMs directly in your browser",
    href: "/dashboard/gamehub/pokemon/rom-editor",
    icon: Icons.HardDrive,
    features: ["GB/GBC/GBA Support", "Auto Detection", "Safe Editing"],
  },
  {
    title: "Save Editor",
    description: "Edit your save files - trainer data, party, inventory, and more",
    href: "/dashboard/gamehub/pokemon/save-editor",
    icon: Icons.FileText,
    features: ["Trainer Editor", "Party Viewer", "Inventory"],
  },
  {
    title: "Shiny Counter",
    description: "Track your shiny hunts with probability calculations and history",
    href: "/dashboard/gamehub/pokemon/shiny-counter",
    icon: Icons.Star,
    features: ["Hunt Tracker", "Odds Calculator", "Statistics"],
  },
  {
    title: "Wild Randomizer",
    description: "Randomize wild Pokemon encounters with customizable options",
    href: "/dashboard/gamehub/pokemon/rom-editor",
    icon: Icons.Shuffle,
    features: ["BST Matching", "Area Themed", "Legendary Toggle"],
  },
  {
    title: "Starter Picker",
    description: "Choose or randomize your starter Pokemon",
    href: "/dashboard/gamehub/pokemon/rom-editor",
    icon: Icons.Sparkles,
    features: ["Custom Selection", "Random Option", "Stats Preview"],
  },
];

const supportedGames = [
  { name: "Pokemon Red", platform: "GB", generation: 1 },
  { name: "Pokemon Blue", platform: "GB", generation: 1 },
  { name: "Pokemon Yellow", platform: "GBC", generation: 1 },
  { name: "Pokemon Gold", platform: "GBC", generation: 2 },
  { name: "Pokemon Silver", platform: "GBC", generation: 2 },
  { name: "Pokemon Crystal", platform: "GBC", generation: 2 },
  { name: "Pokemon Ruby", platform: "GBA", generation: 3 },
  { name: "Pokemon Sapphire", platform: "GBA", generation: 3 },
  { name: "Pokemon Emerald", platform: "GBA", generation: 3 },
  { name: "Pokemon FireRed", platform: "GBA", generation: 3 },
  { name: "Pokemon LeafGreen", platform: "GBA", generation: 3 },
];

export default async function PokemonPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Pokemon ROM Editor</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Edit and randomize your Gen 1-3 Pokemon ROMs directly in your browser.
            All processing happens locally - your ROM data never leaves your device.
          </p>
        </div>
      </FadeIn>

      {/* Quick Start */}
      <FadeIn delay={0.1}>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/dashboard/gamehub/pokemon/rom-editor"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Icons.HardDrive className="h-5 w-5" />
            ROM Editor
          </Link>
          <Link
            href="/dashboard/gamehub/pokemon/save-editor"
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Icons.FileText className="h-5 w-5" />
            Save Editor
          </Link>
          <Link
            href="/dashboard/gamehub/pokemon/shiny-counter"
            className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-8 py-4 text-lg font-semibold text-yellow-500 hover:bg-yellow-500/20 transition-colors"
          >
            <Icons.Star className="h-5 w-5" />
            Shiny Counter
          </Link>
          <Link
            href="/dashboard/gamehub/pokemon/guide"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-8 py-4 text-lg font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Icons.HelpCircle className="h-5 w-5" />
            Guide & Wiki
          </Link>
        </div>
      </FadeIn>

      {/* Features */}
      <FadeIn delay={0.2}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Features</h2>
        <BentoGrid>
          {pokemonFeatures.map((feature) => (
            <BentoGridItem key={feature.title}>
              <Link href={feature.href} className="block h-full">
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {feature.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </FadeIn>

      {/* Supported Games */}
      <FadeIn delay={0.3}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Supported Games</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gen 1 */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-sm font-bold">
                  1
                </span>
                Generation 1
              </h3>
              <ul className="space-y-2">
                {supportedGames
                  .filter((g) => g.generation === 1)
                  .map((game) => (
                    <li
                      key={game.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{game.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {game.platform}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Gen 2 */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-bold">
                  2
                </span>
                Generation 2
              </h3>
              <ul className="space-y-2">
                {supportedGames
                  .filter((g) => g.generation === 2)
                  .map((game) => (
                    <li
                      key={game.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{game.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {game.platform}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Gen 3 */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold">
                  3
                </span>
                Generation 3
              </h3>
              <ul className="space-y-2">
                {supportedGames
                  .filter((g) => g.generation === 3)
                  .map((game) => (
                    <li
                      key={game.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{game.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {game.platform}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Privacy Notice */}
      <FadeIn delay={0.4}>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Icons.CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Privacy First</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All ROM processing happens entirely in your browser. Your ROM files are never
                uploaded to our servers. The editor works offline once loaded.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
