"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons";

interface Pokemon {
  id: string;
  pokedexId: number;
  name: string;
  types: string[];
  hpBase: number;
  attackBase: number;
  defenseBase: number;
  spAtkBase: number;
  spDefBase: number;
  speedBase: number;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-amber-700",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-600",
  dark: "bg-gray-700",
  steel: "bg-gray-400",
  fairy: "bg-pink-300",
};

const NATURES: Record<string, { plus?: string; minus?: string; display: string }> = {
  hardy: { display: "Hardy" },
  lonely: { plus: "attack", minus: "defense", display: "Lonely (+Atk, -Def)" },
  brave: { plus: "attack", minus: "speed", display: "Brave (+Atk, -Spe)" },
  adamant: { plus: "attack", minus: "spAtk", display: "Adamant (+Atk, -SpA)" },
  naughty: { plus: "attack", minus: "spDef", display: "Naughty (+Atk, -SpD)" },
  bold: { plus: "defense", minus: "attack", display: "Bold (+Def, -Atk)" },
  docile: { display: "Docile" },
  relaxed: { plus: "defense", minus: "speed", display: "Relaxed (+Def, -Spe)" },
  impish: { plus: "defense", minus: "spAtk", display: "Impish (+Def, -SpA)" },
  lax: { plus: "defense", minus: "spDef", display: "Lax (+Def, -SpD)" },
  timid: { plus: "speed", minus: "attack", display: "Timid (+Spe, -Atk)" },
  hasty: { plus: "speed", minus: "defense", display: "Hasty (+Spe, -Def)" },
  serious: { display: "Serious" },
  jolly: { plus: "speed", minus: "spAtk", display: "Jolly (+Spe, -SpA)" },
  naive: { plus: "speed", minus: "spDef", display: "Naive (+Spe, -SpD)" },
  modest: { plus: "spAtk", minus: "attack", display: "Modest (+SpA, -Atk)" },
  mild: { plus: "spAtk", minus: "defense", display: "Mild (+SpA, -Def)" },
  quiet: { plus: "spAtk", minus: "speed", display: "Quiet (+SpA, -Spe)" },
  bashful: { display: "Bashful" },
  rash: { plus: "spAtk", minus: "spDef", display: "Rash (+SpA, -SpD)" },
  calm: { plus: "spDef", minus: "attack", display: "Calm (+SpD, -Atk)" },
  gentle: { plus: "spDef", minus: "defense", display: "Gentle (+SpD, -Def)" },
  sassy: { plus: "spDef", minus: "speed", display: "Sassy (+SpD, -Spe)" },
  careful: { plus: "spDef", minus: "spAtk", display: "Careful (+SpD, -SpA)" },
  quirky: { display: "Quirky" },
};

interface StatInput {
  value: number;
  ev: number;
}

export function IVCalculatorClient() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [level, setLevel] = useState(50);
  const [nature, setNature] = useState("hardy");
  const [stats, setStats] = useState<Record<string, StatInput>>({
    hp: { value: 0, ev: 0 },
    attack: { value: 0, ev: 0 },
    defense: { value: 0, ev: 0 },
    spAtk: { value: 0, ev: 0 },
    spDef: { value: 0, ev: 0 },
    speed: { value: 0, ev: 0 },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search Pokemon
  const searchPokemon = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/gamehub/pokemon/species?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setSearchResults(data.species || []);
    } catch (error) {
      console.error("Failed to search Pokemon:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch) {
        searchPokemon(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, searchPokemon]);

  const selectPokemon = (selected: Pokemon) => {
    setPokemon(selected);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Calculate possible IVs for a stat
  const calculatePossibleIVs = (
    statName: string,
    statValue: number,
    baseStat: number,
    evs: number
  ): number[] => {
    const possibleIVs: number[] = [];
    const natureData = NATURES[nature];

    let natureModifier = 1;
    if (natureData.plus === statName) natureModifier = 1.1;
    if (natureData.minus === statName) natureModifier = 0.9;

    for (let iv = 0; iv <= 31; iv++) {
      let calculatedStat: number;

      if (statName === "hp") {
        calculatedStat = Math.floor(((2 * baseStat + iv + Math.floor(evs / 4)) * level) / 100) + level + 10;
      } else {
        calculatedStat = Math.floor((Math.floor(((2 * baseStat + iv + Math.floor(evs / 4)) * level) / 100) + 5) * natureModifier);
      }

      if (calculatedStat === statValue) {
        possibleIVs.push(iv);
      }
    }

    return possibleIVs;
  };

  const getBaseStats = (): Record<string, number> => {
    if (!pokemon) return { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
    return {
      hp: pokemon.hpBase,
      attack: pokemon.attackBase,
      defense: pokemon.defenseBase,
      spAtk: pokemon.spAtkBase,
      spDef: pokemon.spDefBase,
      speed: pokemon.speedBase,
    };
  };

  const baseStats = getBaseStats();

  const ivResults: Record<string, number[]> = {};
  if (pokemon) {
    Object.keys(stats).forEach((statName) => {
      const { value, ev } = stats[statName];
      if (value > 0) {
        ivResults[statName] = calculatePossibleIVs(statName, value, baseStats[statName], ev);
      }
    });
  }

  const getIVDisplay = (ivs: number[]): string => {
    if (!ivs || ivs.length === 0) return "Invalid";
    if (ivs.length === 1) return ivs[0].toString();
    if (ivs.length === 32) return "0 - 31";

    // Check for consecutive ranges
    const ranges: string[] = [];
    let rangeStart = ivs[0];
    let rangeEnd = ivs[0];

    for (let i = 1; i < ivs.length; i++) {
      if (ivs[i] === rangeEnd + 1) {
        rangeEnd = ivs[i];
      } else {
        ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
        rangeStart = ivs[i];
        rangeEnd = ivs[i];
      }
    }
    ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);

    return ranges.join(", ");
  };

  const getIVRating = (ivs: number[]): { color: string; label: string } => {
    if (!ivs || ivs.length === 0) return { color: "text-red-500", label: "Invalid" };

    const maxIV = Math.max(...ivs);
    const minIV = Math.min(...ivs);

    if (minIV >= 31) return { color: "text-green-500", label: "Perfect!" };
    if (minIV >= 26) return { color: "text-green-400", label: "Fantastic" };
    if (minIV >= 16) return { color: "text-yellow-500", label: "Good" };
    if (minIV >= 1) return { color: "text-orange-500", label: "Decent" };
    return { color: "text-red-500", label: "No Good" };
  };

  const statLabels: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    spAtk: "Sp. Atk",
    spDef: "Sp. Def",
    speed: "Speed",
  };

  return (
    <div className="space-y-6">
      {/* Pokemon Selection */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">Select Pokemon</h3>

        <div className="relative">
          {pokemon ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-muted-foreground">#{pokemon.pokedexId}</span>
                <span className="text-xl font-semibold capitalize">{pokemon.name}</span>
                <div className="flex gap-1">
                  {pokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`px-2 py-0.5 rounded text-xs text-white capitalize ${
                        TYPE_COLORS[type.toLowerCase()] || "bg-gray-500"
                      }`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowSearch(true)}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Icons.Search className="h-6 w-6 mx-auto mb-2" />
              <span>Search for a Pokemon</span>
            </button>
          )}

          {/* Search dropdown */}
          {showSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-lg p-3">
              <div className="relative mb-2">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pokemon..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPokemon(p)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-xs text-muted-foreground w-8">#{p.pokedexId}</span>
                      <span className="font-medium capitalize flex-1">{p.name}</span>
                      <div className="flex gap-1">
                        {p.types.map((type) => (
                          <span
                            key={type}
                            className={`px-1.5 py-0.5 rounded text-[10px] text-white capitalize ${
                              TYPE_COLORS[type.toLowerCase()] || "bg-gray-500"
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))
                ) : searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No Pokemon found</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Type to search...</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Level & Nature */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm text-muted-foreground">Level</label>
          <input
            type="number"
            min={1}
            max={100}
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
            className="w-full mt-2 px-4 py-3 rounded-lg bg-muted border-0 text-lg font-semibold"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm text-muted-foreground">Nature</label>
          <select
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="w-full mt-2 px-4 py-3 rounded-lg bg-muted border-0 text-lg"
          >
            {Object.entries(NATURES).map(([key, { display }]) => (
              <option key={key} value={key}>
                {display}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Input */}
      {pokemon && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">Enter Observed Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(statLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-xs text-muted-foreground">
                    Base: {baseStats[key]}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={stats[key].value || ""}
                  onChange={(e) =>
                    setStats({
                      ...stats,
                      [key]: { ...stats[key], value: parseInt(e.target.value) || 0 },
                    })
                  }
                  placeholder="Stat value"
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">EVs:</span>
                  <input
                    type="number"
                    min={0}
                    max={252}
                    value={stats[key].ev || ""}
                    onChange={(e) =>
                      setStats({
                        ...stats,
                        [key]: { ...stats[key], ev: parseInt(e.target.value) || 0 },
                      })
                    }
                    placeholder="0"
                    className="flex-1 px-2 py-1 rounded bg-muted/50 border-0 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {pokemon && Object.values(stats).some((s) => s.value > 0) && (
        <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icons.Target className="h-5 w-5 text-primary" />
            Calculated IVs
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(statLabels).map(([key, label]) => {
              const ivs = ivResults[key];
              const hasValue = stats[key].value > 0;
              const rating = hasValue ? getIVRating(ivs) : null;

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg ${
                    hasValue ? "bg-card border border-border" : "bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    {rating && (
                      <span className={`text-xs font-medium ${rating.color}`}>
                        {rating.label}
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${!hasValue ? "text-muted-foreground" : ""}`}>
                    {hasValue ? getIVDisplay(ivs) : "—"}
                  </p>
                  {hasValue && ivs && ivs.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ivs.length} possible value{ivs.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <Icons.Info className="inline h-4 w-4 mr-1" />
              Enter stats at multiple levels to narrow down IV ranges. EVs affect calculations - set them to 0 if unknown.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!pokemon && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Icons.HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">How to Use</h3>
          <ol className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
            <li>1. Search and select your Pokemon</li>
            <li>2. Enter your Pokemon's current level</li>
            <li>3. Select its nature (check summary screen in game)</li>
            <li>4. Enter the observed stats from the summary screen</li>
            <li>5. Add EVs if you know them (default 0)</li>
          </ol>
        </div>
      )}
    </div>
  );
}
