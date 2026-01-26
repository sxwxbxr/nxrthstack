import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Icons } from "@/components/icons";
import { GradientText } from "@/components/ui/gradient-text";
import Link from "next/link";

export default async function PokemonGuidePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/gamehub/pokemon"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
            Back to Pokemon Hub
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Pokemon <GradientText>Save & ROM</GradientText> Editing Guide
          </h1>
          <p className="text-muted-foreground">
            Everything you need to know about editing Pokemon save files and ROMs
          </p>
        </div>

        {/* Table of Contents */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.FileText className="h-5 w-5 text-primary" />
            Table of Contents
          </h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-muted-foreground hover:text-foreground transition-colors">
              1. Introduction
            </a>
            <a href="#save-files" className="block text-muted-foreground hover:text-foreground transition-colors">
              2. Understanding Save Files
            </a>
            <a href="#supported-games" className="block text-muted-foreground hover:text-foreground transition-colors">
              3. Supported Games
            </a>
            <a href="#save-editor" className="block text-muted-foreground hover:text-foreground transition-colors">
              4. Using the Save Editor
            </a>
            <a href="#rom-editor" className="block text-muted-foreground hover:text-foreground transition-colors">
              5. Using the ROM Editor
            </a>
            <a href="#technical" className="block text-muted-foreground hover:text-foreground transition-colors">
              6. Technical Details
            </a>
            <a href="#faq" className="block text-muted-foreground hover:text-foreground transition-colors">
              7. FAQ
            </a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Introduction */}
          <section id="introduction" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Info className="h-5 w-5 text-primary" />
              1. Introduction
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <p>
                Our Pokemon editing tools allow you to modify save files and ROMs for Generation 1-3 games.
                This includes the original Game Boy games (Red, Blue, Yellow), Game Boy Color games
                (Gold, Silver, Crystal), and Game Boy Advance games (Ruby, Sapphire, Emerald, FireRed, LeafGreen).
              </p>
              <p className="mt-4">
                <strong className="text-foreground">Important Notes:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All editing happens locally in your browser - no data is uploaded to our servers</li>
                <li>Always backup your original files before making edits</li>
                <li>Modified saves work with most emulators (mGBA, VBA, etc.)</li>
                <li>We do not provide ROM files - you must supply your own legally obtained copies</li>
              </ul>
            </div>
          </section>

          {/* Understanding Save Files */}
          <section id="save-files" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.FileText className="h-5 w-5 text-primary" />
              2. Understanding Save Files
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-foreground mt-4 text-lg">Save File Formats</h3>
              <div className="grid gap-4 mt-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium text-foreground mb-2">Gen 1 (GB)</h4>
                  <ul className="text-sm space-y-1">
                    <li>File size: 32 KB</li>
                    <li>Extension: .sav</li>
                    <li>Single save slot</li>
                    <li>8-bit checksum</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium text-foreground mb-2">Gen 2 (GBC)</h4>
                  <ul className="text-sm space-y-1">
                    <li>File size: 32 KB</li>
                    <li>Extension: .sav</li>
                    <li>Dual region (Johto/Kanto)</li>
                    <li>16-bit checksums</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium text-foreground mb-2">Gen 3 (GBA)</h4>
                  <ul className="text-sm space-y-1">
                    <li>File size: 128 KB</li>
                    <li>Extension: .sav</li>
                    <li>Dual save slots</li>
                    <li>14-section structure</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-foreground mt-6 text-lg">Data Structure</h3>
              <p className="mt-2">
                Pokemon save files contain various data blocks including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong className="text-foreground">Trainer Data:</strong> Name, ID, money, badges, play time</li>
                <li><strong className="text-foreground">Party Pokemon:</strong> Your active team of up to 6 Pokemon</li>
                <li><strong className="text-foreground">PC Boxes:</strong> Stored Pokemon in the PC system</li>
                <li><strong className="text-foreground">Inventory:</strong> Items, key items, Poke Balls, TMs/HMs</li>
                <li><strong className="text-foreground">Pokedex:</strong> Seen and caught Pokemon records</li>
              </ul>
            </div>
          </section>

          {/* Supported Games */}
          <section id="supported-games" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Gamepad2 className="h-5 w-5 text-primary" />
              3. Supported Games
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">Gen 1</span>
                  Game Boy
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Red
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Blue
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Yellow
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">Gen 2</span>
                  Game Boy Color
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Gold
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Silver
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Crystal
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Gen 3</span>
                  Game Boy Advance
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Ruby
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Sapphire
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon Emerald
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon FireRed
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="h-3 w-3 text-green-500" />
                    Pokemon LeafGreen
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Using the Save Editor */}
          <section id="save-editor" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.FileEdit className="h-5 w-5 text-primary" />
              4. Using the Save Editor
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-foreground mt-4 text-lg">Getting Started</h3>
              <ol className="list-decimal list-inside mt-2 space-y-2">
                <li>Navigate to the Save Editor from the Pokemon Hub</li>
                <li>Upload your .sav file or create a new save</li>
                <li>The editor will automatically detect your game version</li>
                <li>Make your desired changes using the tabs</li>
                <li>Download your modified save file</li>
              </ol>

              <h3 className="text-foreground mt-6 text-lg">Available Editing Features</h3>

              <h4 className="text-foreground mt-4">Trainer Tab</h4>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Change trainer name (max 7 characters)</li>
                <li>Modify money amount (max 999,999)</li>
                <li>Toggle individual badges on/off</li>
                <li>Adjust play time (hours, minutes, seconds)</li>
              </ul>

              <h4 className="text-foreground mt-4">Party Tab (Gen 3)</h4>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>View Pokemon details and stats</li>
                <li>Set IVs to perfect values (31 all)</li>
                <li>Apply EV presets (Physical Sweeper, Tank, etc.)</li>
                <li>Set Pokemon to level 100</li>
                <li>Heal Pokemon to full HP</li>
              </ul>

              <h4 className="text-foreground mt-4">Inventory Tab</h4>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>View all items in your inventory</li>
                <li>Edit item quantities</li>
                <li>Remove unwanted items</li>
                <li>Quick-add popular items (Rare Candy, Master Ball, etc.)</li>
              </ul>

              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400 flex items-start gap-2">
                  <Icons.AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> Always save your modified file with a new name to keep your original save intact.
                    Use naming like "Pokemon_Ruby_Modified.sav" to easily identify edited saves.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Using the ROM Editor */}
          <section id="rom-editor" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Cpu className="h-5 w-5 text-primary" />
              5. Using the ROM Editor
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-foreground mt-4 text-lg">What is ROM Editing?</h3>
              <p className="mt-2">
                ROM editing modifies the game itself rather than your save file. This allows you to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Randomize wild Pokemon encounters</li>
                <li>Change starter Pokemon options</li>
                <li>Modify game difficulty</li>
              </ul>

              <h3 className="text-foreground mt-6 text-lg">Randomizer Features</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong className="text-foreground">Wild Pokemon:</strong> Randomize encounters in grass, caves, and water</li>
                <li><strong className="text-foreground">Starters:</strong> Choose or randomize your starting Pokemon</li>
                <li><strong className="text-foreground">BST Matching:</strong> Option to match Pokemon by similar base stat totals</li>
                <li><strong className="text-foreground">Legendary Control:</strong> Include or exclude legendary Pokemon</li>
              </ul>

              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400 flex items-start gap-2">
                  <Icons.Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Note:</strong> You must provide your own ROM file. We do not distribute ROM files.
                    Supported formats: .gb, .gbc, .gba
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Technical Details */}
          <section id="technical" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Code className="h-5 w-5 text-primary" />
              6. Technical Details
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-foreground mt-4 text-lg">Gen 3 Pokemon Data Structure</h3>
              <p className="mt-2">
                Gen 3 Pokemon data is stored in a 100-byte structure with encryption:
              </p>
              <div className="mt-4 rounded-lg bg-muted/50 p-4 font-mono text-sm">
                <pre>{`Offset  Size  Description
0x00    4     Personality Value (PID)
0x04    4     Original Trainer ID
0x08    10    Nickname
0x14    2     Language
0x16    7     OT Name
0x1D    1     Markings
0x1E    2     Checksum
0x20    48    Encrypted Substructure Data
0x50    4     Status Condition
0x54    1     Level
0x55    1     Pokerus
0x56    2     Current HP
0x58    2     Max HP
0x5A    2     Attack
0x5C    2     Defense
0x5E    2     Speed
0x60    2     Sp. Attack
0x62    2     Sp. Defense`}</pre>
              </div>

              <h3 className="text-foreground mt-6 text-lg">Encryption</h3>
              <p className="mt-2">
                Gen 3 uses XOR encryption on the 48-byte substructure. The key is calculated as:
              </p>
              <div className="mt-2 rounded-lg bg-muted/50 p-4 font-mono text-sm">
                <code>key = personality_value XOR original_trainer_id</code>
              </div>
              <p className="mt-2">
                The substructure order is determined by <code>personality_value % 24</code>, giving
                24 possible arrangements of the Growth, Attacks, EVs, and Misc data blocks.
              </p>

              <h3 className="text-foreground mt-6 text-lg">Checksums</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong className="text-foreground">Gen 1:</strong> 8-bit complement checksum of bytes 0x2598-0x3522</li>
                <li><strong className="text-foreground">Gen 2:</strong> 16-bit sum checksum with separate main and box data regions</li>
                <li><strong className="text-foreground">Gen 3:</strong> 16-bit folded checksum per section (14 sections total)</li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.HelpCircle className="h-5 w-5 text-primary" />
              7. Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground">Is this safe to use?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes! All editing happens in your browser. Your files are never uploaded to our servers.
                  However, we always recommend keeping backups of your original files.
                </p>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground">Will my edited save work on real hardware?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Edited saves should work on flash carts and emulators. For real cartridges,
                  you would need specialized hardware to transfer saves.
                </p>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground">Can I edit Pokemon nicknames or species?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Currently, we support stat editing (IVs, EVs, level) for Gen 3 Pokemon.
                  Species and nickname editing is planned for a future update.
                </p>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground">My save file isn&apos;t being detected. What should I do?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure you&apos;re using a standard .sav file (32KB for Gen 1/2, 128KB for Gen 3).
                  Some emulator-specific save formats may not be compatible.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Can I undo my changes?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you download the modified file, the changes are permanent in that file.
                  This is why we recommend keeping your original save file as a backup.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/gamehub/pokemon/save-editor"
              className="flex-1 min-w-[200px] rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              <Icons.FileEdit className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Save Editor</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start editing your save files
              </p>
            </Link>
            <Link
              href="/dashboard/gamehub/pokemon/rom-editor"
              className="flex-1 min-w-[200px] rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              <Icons.Cpu className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground">ROM Editor</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Randomize your games
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
