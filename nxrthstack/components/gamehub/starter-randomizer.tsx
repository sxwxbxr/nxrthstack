"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import type { ROMInfo } from "@/lib/pokemon/rom-detector";
import type { PokemonSpecies } from "@/lib/db";
import { setStarters, getRandomStarters } from "@/lib/pokemon/randomizer";

interface StarterRandomizerProps {
  romData: Uint8Array;
  romInfo: ROMInfo;
  pokemonSpecies: PokemonSpecies[];
  onStartersChanged: (modifiedData: Uint8Array, starterIds: number[]) => void;
}

export function StarterRandomizer({
  romData,
  romInfo,
  pokemonSpecies,
  onStartersChanged,
}: StarterRandomizerProps) {
  const [selectedStarters, setSelectedStarters] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter pokemon by generation
  const availablePokemon = useMemo(() => {
    return pokemonSpecies
      .filter((p) => p.generation <= romInfo.generation)
      .sort((a, b) => a.pokedexId - b.pokedexId);
  }, [pokemonSpecies, romInfo.generation]);

  // Get Pokemon by ID
  const getPokemonById = useCallback(
    (id: number | null) => {
      if (id === null) return null;
      return availablePokemon.find((p) => p.pokedexId === id) || null;
    },
    [availablePokemon]
  );

  // Calculate BST for a Pokemon
  const calculateBST = useCallback((pokemon: PokemonSpecies) => {
    return (
      pokemon.hpBase +
      pokemon.attackBase +
      pokemon.defenseBase +
      pokemon.spAtkBase +
      pokemon.spDefBase +
      pokemon.speedBase
    );
  }, []);

  const handleStarterSelect = useCallback(
    (index: number, pokemonId: number | null) => {
      setSelectedStarters((prev) => {
        const newStarters = [...prev];
        newStarters[index] = pokemonId;
        return newStarters;
      });
      setSuccess(false);
    },
    []
  );

  const handleRandomize = useCallback(() => {
    const randomIds = getRandomStarters(availablePokemon, {
      excludeLegendaries: true,
      balancedBST: true,
    });
    setSelectedStarters(randomIds);
    setSuccess(false);
  }, [availablePokemon]);

  const handleApply = useCallback(async () => {
    // Validate all starters are selected
    if (selectedStarters.some((s) => s === null)) {
      setError("Please select all three starters");
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccess(false);

    try {
      // Create a copy of the ROM data
      const modifiedRom = new Uint8Array(romData);

      // Apply starters
      setStarters(
        modifiedRom,
        romInfo,
        selectedStarters.filter((s): s is number => s !== null)
      );

      onStartersChanged(
        modifiedRom,
        selectedStarters.filter((s): s is number => s !== null)
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply starters");
    } finally {
      setIsApplying(false);
    }
  }, [romData, romInfo, selectedStarters, onStartersChanged]);

  const starterLabels = romInfo.generation === 1 && romInfo.gameName.includes("Yellow")
    ? ["Your Starter"]
    : ["Starter 1", "Starter 2", "Starter 3"];

  const starterCount = starterLabels.length;

  return (
    <div className="space-y-6">
      {/* Starter Selection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Select Starters
          </h3>
          <button
            onClick={handleRandomize}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Icons.Shuffle className="h-4 w-4" />
            Randomize All
          </button>
        </div>

        <div className={`grid gap-4 ${starterCount === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          {starterLabels.map((label, index) => {
            const selectedPokemon = getPokemonById(selectedStarters[index]);

            return (
              <div
                key={label}
                className="rounded-lg border border-border bg-muted/50 p-4"
              >
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {label}
                </label>
                <select
                  value={selectedStarters[index] || ""}
                  onChange={(e) =>
                    handleStarterSelect(
                      index,
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Pokemon...</option>
                  {availablePokemon.map((pokemon) => (
                    <option key={pokemon.pokedexId} value={pokemon.pokedexId}>
                      #{pokemon.pokedexId.toString().padStart(3, "0")}{" "}
                      {pokemon.name}
                    </option>
                  ))}
                </select>

                {/* Selected Pokemon Preview */}
                {selectedPokemon && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg bg-card p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icons.User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {selectedPokemon.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{selectedPokemon.pokedexId.toString().padStart(3, "0")}
                        </p>
                      </div>
                    </div>

                    {/* Types */}
                    <div className="flex gap-1 mb-3">
                      {(selectedPokemon.types as string[]).map((type) => (
                        <span
                          key={type}
                          className="rounded px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HP</span>
                        <span className="text-foreground">{selectedPokemon.hpBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attack</span>
                        <span className="text-foreground">{selectedPokemon.attackBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Defense</span>
                        <span className="text-foreground">{selectedPokemon.defenseBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sp. Atk</span>
                        <span className="text-foreground">{selectedPokemon.spAtkBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sp. Def</span>
                        <span className="text-foreground">{selectedPokemon.spDefBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed</span>
                        <span className="text-foreground">{selectedPokemon.speedBase}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border mt-2">
                        <span className="text-muted-foreground font-medium">BST</span>
                        <span className="text-foreground font-medium">
                          {calculateBST(selectedPokemon)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex justify-center">
        <ShimmerButton
          onClick={handleApply}
          disabled={isApplying || selectedStarters.slice(0, starterCount).some((s) => s === null)}
          className="px-8 py-3"
        >
          {isApplying ? (
            <>
              <Icons.Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Icons.Check className="h-5 w-5 mr-2" />
              Apply Starters
            </>
          )}
        </ShimmerButton>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-500/30 bg-green-500/5 p-6"
        >
          <div className="flex items-center gap-3">
            <Icons.CheckCircle className="h-5 w-5 text-green-500" />
            <p className="font-medium text-foreground">
              Starters updated successfully! Download your modified ROM to play.
            </p>
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

      {/* Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          About Starters
        </h3>
        <p className="text-sm text-muted-foreground">
          Changing starter Pokemon modifies the initial choice you&apos;re given at
          the start of the game. The rival&apos;s starter will also be adjusted to
          maintain type advantage relationships where applicable.
        </p>
      </div>
    </div>
  );
}
