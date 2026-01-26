"use client";

import { useState, useCallback, useMemo } from "react";
import { Icons } from "@/components/icons";
import {
  type SaveData,
  POKEMON_NAMES,
  setGen1PokedexCaught,
  setGen2PokedexCaught,
  setGen3PokedexCaught,
  setGen1PokedexSeen,
  setGen2PokedexSeen,
  setGen3PokedexSeen,
  completeGen1Pokedex,
  completeGen2Pokedex,
  completeGen3Pokedex,
} from "@/lib/pokemon/save-detector";

interface PokedexEditorProps {
  saveData: Uint8Array;
  parsedSave: SaveData;
  onDataChange: (newData: Uint8Array) => void;
}

type FilterMode = "all" | "seen" | "caught" | "missing";

export function PokedexEditor({
  saveData,
  parsedSave,
  onDataChange,
}: PokedexEditorProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const generation = parsedSave.info.generation;
  const pokedex = parsedSave.pokedex;

  // Total Pokemon per generation
  const maxPokemon = generation === 1 ? 151 : generation === 2 ? 251 : 386;

  // Create set for fast lookup
  const seenSet = useMemo(() => new Set(pokedex.seen), [pokedex.seen]);
  const caughtSet = useMemo(() => new Set(pokedex.caught), [pokedex.caught]);

  // Generate all Pokemon list
  const allPokemon = useMemo(() => {
    const list = [];
    for (let i = 1; i <= maxPokemon; i++) {
      list.push({
        id: i,
        name: POKEMON_NAMES[i] || `Pokemon ${i}`,
        seen: seenSet.has(i),
        caught: caughtSet.has(i),
      });
    }
    return list;
  }, [maxPokemon, seenSet, caughtSet]);

  // Filter Pokemon based on mode and search
  const filteredPokemon = useMemo(() => {
    let result = allPokemon;

    // Apply filter mode
    switch (filterMode) {
      case "seen":
        result = result.filter((p) => p.seen && !p.caught);
        break;
      case "caught":
        result = result.filter((p) => p.caught);
        break;
      case "missing":
        result = result.filter((p) => !p.seen);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.id.toString().includes(query)
      );
    }

    return result;
  }, [allPokemon, filterMode, searchQuery]);

  const handleToggleCaught = useCallback(
    (species: number, currentlyCaught: boolean) => {
      const newData = new Uint8Array(saveData);
      let success = false;

      if (generation === 1) {
        success = setGen1PokedexCaught(newData, species, !currentlyCaught);
      } else if (generation === 2) {
        success = setGen2PokedexCaught(newData, species, !currentlyCaught);
      } else {
        success = setGen3PokedexCaught(newData, species, !currentlyCaught);
      }

      if (success) {
        onDataChange(newData);
      }
    },
    [saveData, generation, onDataChange]
  );

  const handleToggleSeen = useCallback(
    (species: number, currentlySeen: boolean) => {
      const newData = new Uint8Array(saveData);
      let success = false;

      if (generation === 1) {
        success = setGen1PokedexSeen(newData, species, !currentlySeen);
      } else if (generation === 2) {
        success = setGen2PokedexSeen(newData, species, !currentlySeen);
      } else {
        success = setGen3PokedexSeen(newData, species, !currentlySeen);
      }

      if (success) {
        onDataChange(newData);
      }
    },
    [saveData, generation, onDataChange]
  );

  const handleCompletePokedex = useCallback(() => {
    const newData = new Uint8Array(saveData);
    let success = false;

    if (generation === 1) {
      success = completeGen1Pokedex(newData);
    } else if (generation === 2) {
      success = completeGen2Pokedex(newData);
    } else {
      success = completeGen3Pokedex(newData);
    }

    if (success) {
      onDataChange(newData);
    }
  }, [saveData, generation, onDataChange]);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{maxPokemon}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Seen</p>
          <p className="text-2xl font-bold text-blue-500">{pokedex.seen.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Caught</p>
          <p className="text-2xl font-bold text-green-500">{pokedex.caught.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completion</p>
          <p className="text-2xl font-bold text-primary">
            {((pokedex.caught.length / maxPokemon) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icons.Zap className="h-4 w-4 text-primary" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCompletePokedex}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Icons.CheckCircle className="h-4 w-4" />
            Complete Pokedex
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <Icons.Info className="inline h-3 w-3 mr-1" />
          Mark all {maxPokemon} Pokemon as seen and caught
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Filter Mode */}
        <div className="flex gap-2">
          {(["all", "caught", "seen", "missing"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filterMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
              {mode === "caught" && ` (${pokedex.caught.length})`}
              {mode === "seen" && ` (${pokedex.seen.length - pokedex.caught.length})`}
              {mode === "missing" && ` (${maxPokemon - pokedex.seen.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or number..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Pokemon Grid */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid gap-px bg-border grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPokemon.map((pokemon) => (
            <div
              key={pokemon.id}
              className="flex items-center justify-between bg-card p-3 first:rounded-tl-xl last:rounded-br-xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    pokemon.caught
                      ? "bg-green-500/10 text-green-500"
                      : pokemon.seen
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pokemon.id.toString().padStart(3, "0")}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {pokemon.name}
                  </p>
                  <div className="flex gap-2 text-xs">
                    {pokemon.caught && (
                      <span className="text-green-500">Caught</span>
                    )}
                    {pokemon.seen && !pokemon.caught && (
                      <span className="text-blue-500">Seen</span>
                    )}
                    {!pokemon.seen && (
                      <span className="text-muted-foreground">Not seen</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleSeen(pokemon.id, pokemon.seen)}
                  className={`rounded p-1.5 transition-colors ${
                    pokemon.seen
                      ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  title={pokemon.seen ? "Mark as not seen" : "Mark as seen"}
                >
                  <Icons.Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleCaught(pokemon.id, pokemon.caught)}
                  className={`rounded p-1.5 transition-colors ${
                    pokemon.caught
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  title={pokemon.caught ? "Mark as not caught" : "Mark as caught"}
                >
                  <Icons.Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredPokemon.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Icons.Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No Pokemon Found
          </h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filter.
          </p>
        </div>
      )}
    </div>
  );
}
