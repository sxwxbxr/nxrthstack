"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import type { ROMInfo } from "@/lib/pokemon/rom-detector";
import type { PokemonSpecies } from "@/lib/db";
import { randomizeWildEncounters } from "@/lib/pokemon/randomizer";

interface WildRandomizerProps {
  romData: Uint8Array;
  romInfo: ROMInfo;
  pokemonSpecies: PokemonSpecies[];
  onRandomized: (modifiedData: Uint8Array, encounterCount: number) => void;
}

interface RandomizeOptions {
  matchBST: boolean;
  bstVariance: number;
  includeLegendaries: boolean;
  sameType: boolean;
}

export function WildRandomizer({
  romData,
  romInfo,
  pokemonSpecies,
  onRandomized,
}: WildRandomizerProps) {
  const [options, setOptions] = useState<RandomizeOptions>({
    matchBST: true,
    bstVariance: 50,
    includeLegendaries: false,
    sameType: false,
  });
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [preview, setPreview] = useState<{ original: string; replacement: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter pokemon by generation
  const availablePokemon = useMemo(() => {
    return pokemonSpecies.filter((p) => p.generation <= romInfo.generation);
  }, [pokemonSpecies, romInfo.generation]);

  const handleRandomize = useCallback(async () => {
    setIsRandomizing(true);
    setError(null);
    setPreview(null);

    try {
      // Create a copy of the ROM data
      const modifiedRom = new Uint8Array(romData);

      // Perform randomization
      const result = randomizeWildEncounters(
        modifiedRom,
        romInfo,
        availablePokemon,
        options
      );

      // Generate preview
      const previewItems = result.changes.slice(0, 10).map((change) => ({
        original: change.originalName,
        replacement: change.newName,
      }));

      setPreview(previewItems);
      onRandomized(modifiedRom, result.totalChanges);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to randomize encounters"
      );
    } finally {
      setIsRandomizing(false);
    }
  }, [romData, romInfo, availablePokemon, options, onRandomized]);

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Randomization Options
        </h3>
        <div className="space-y-4">
          {/* Match BST */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.matchBST}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, matchBST: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Match Base Stat Total</p>
              <p className="text-sm text-muted-foreground">
                Replace Pokemon with others of similar strength
              </p>
            </div>
          </label>

          {/* BST Variance Slider */}
          {options.matchBST && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-foreground mb-2">
                BST Variance: ±{options.bstVariance}
              </label>
              <input
                type="range"
                min="10"
                max="150"
                step="10"
                value={options.bstVariance}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    bstVariance: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Strict (±10)</span>
                <span>Loose (±150)</span>
              </div>
            </div>
          )}

          {/* Include Legendaries */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeLegendaries}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  includeLegendaries: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Include Legendaries</p>
              <p className="text-sm text-muted-foreground">
                Allow legendary Pokemon to appear in wild encounters
              </p>
            </div>
          </label>

          {/* Same Type */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.sameType}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, sameType: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Keep Same Type</p>
              <p className="text-sm text-muted-foreground">
                Replace Pokemon with others of the same type (area-themed)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {availablePokemon.length}
          </p>
          <p className="text-sm text-muted-foreground">Available Pokemon</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {availablePokemon.filter((p) => !p.isLegendary).length}
          </p>
          <p className="text-sm text-muted-foreground">Non-Legendary</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {romInfo.generation}
          </p>
          <p className="text-sm text-muted-foreground">Max Generation</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {romInfo.pokemonCount}
          </p>
          <p className="text-sm text-muted-foreground">ROM Pokemon Count</p>
        </div>
      </div>

      {/* Randomize Button */}
      <div className="flex justify-center">
        <ShimmerButton
          onClick={handleRandomize}
          disabled={isRandomizing}
          className="px-8 py-3"
        >
          {isRandomizing ? (
            <>
              <Icons.Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Randomizing...
            </>
          ) : (
            <>
              <Icons.Shuffle className="h-5 w-5 mr-2" />
              Randomize Wild Encounters
            </>
          )}
        </ShimmerButton>
      </div>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-500/30 bg-green-500/5 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Icons.CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-foreground">
              Randomization Complete
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Preview of changes (showing first 10):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {preview.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm rounded-lg bg-card p-2"
              >
                <span className="text-muted-foreground">{item.original}</span>
                <Icons.ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">
                  {item.replacement}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <Icons.AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
