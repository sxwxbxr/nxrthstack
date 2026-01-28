"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons";
import { motion, AnimatePresence } from "motion/react";

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
  isLegendary: boolean;
}

interface TeamSlot {
  pokemon: Pokemon | null;
  nickname?: string;
}

interface SavedTeam {
  id: string;
  name: string;
  slots: TeamSlot[];
  createdAt: string;
}

const STORAGE_KEY = "pokemon-teams";
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

const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = Object.keys(TYPE_COLORS);

export function TeamBuilderClient() {
  const [team, setTeam] = useState<TeamSlot[]>(
    Array(6).fill(null).map(() => ({ pokemon: null }))
  );
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [teamName, setTeamName] = useState("My Team");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showSavedTeams, setShowSavedTeams] = useState(false);

  // Load saved teams from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedTeams(JSON.parse(stored));
      } catch {
        console.error("Failed to parse saved teams");
      }
    }
  }, []);

  // Search Pokemon
  const searchPokemon = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/gamehub/pokemon/species?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setSearchResults(data.species || []);
    } catch (error) {
      console.error("Failed to search Pokemon:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSlot !== null) {
        searchPokemon(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeSlot, searchPokemon]);

  const addPokemonToSlot = (pokemon: Pokemon, slotIndex: number) => {
    const newTeam = [...team];
    newTeam[slotIndex] = { pokemon };
    setTeam(newTeam);
    setActiveSlot(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removePokemonFromSlot = (slotIndex: number) => {
    const newTeam = [...team];
    newTeam[slotIndex] = { pokemon: null };
    setTeam(newTeam);
  };

  const saveTeam = () => {
    const newTeam: SavedTeam = {
      id: Date.now().toString(),
      name: teamName,
      slots: team,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedTeams, newTeam];
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadTeam = (savedTeam: SavedTeam) => {
    setTeam(savedTeam.slots);
    setTeamName(savedTeam.name);
    setShowSavedTeams(false);
  };

  const deleteTeam = (teamId: string) => {
    const updated = savedTeams.filter((t) => t.id !== teamId);
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearTeam = () => {
    setTeam(Array(6).fill(null).map(() => ({ pokemon: null })));
    setTeamName("My Team");
  };

  // Calculate type coverage
  const calculateTypeCoverage = () => {
    const coverage: Record<string, { weak: number; resist: number; immune: number }> = {};

    ALL_TYPES.forEach((type) => {
      coverage[type] = { weak: 0, resist: 0, immune: 0 };
    });

    team.forEach((slot) => {
      if (!slot.pokemon) return;

      slot.pokemon.types.forEach((defenderType) => {
        ALL_TYPES.forEach((attackerType) => {
          const effectiveness = TYPE_EFFECTIVENESS[attackerType]?.[defenderType.toLowerCase()] ?? 1;
          if (effectiveness === 0) coverage[attackerType].immune++;
          else if (effectiveness < 1) coverage[attackerType].resist++;
          else if (effectiveness > 1) coverage[attackerType].weak++;
        });
      });
    });

    return coverage;
  };

  const coverage = calculateTypeCoverage();
  const teamPokemon = team.filter((s) => s.pokemon).length;

  const exportTeam = () => {
    const teamText = team
      .filter((s) => s.pokemon)
      .map((s) => `${s.pokemon!.name} (${s.pokemon!.types.join("/")})`)
      .join("\n");
    navigator.clipboard.writeText(`${teamName}\n${"=".repeat(teamName.length)}\n${teamText}`);
  };

  return (
    <div className="space-y-6">
      {/* Team Name & Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="text-xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1"
        />
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowSavedTeams(!showSavedTeams)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Icons.FolderOpen className="h-4 w-4" />
            Saved Teams ({savedTeams.length})
          </button>
          <button
            onClick={saveTeam}
            disabled={teamPokemon === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Icons.Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={exportTeam}
            disabled={teamPokemon === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <Icons.Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            onClick={clearTeam}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Icons.Trash className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Saved Teams Panel */}
      <AnimatePresence>
        {showSavedTeams && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-3">Saved Teams</h3>
              {savedTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved teams yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedTeams.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{saved.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {saved.slots.filter((s) => s.pokemon).length} Pokemon
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadTeam(saved)}
                          className="p-1.5 rounded hover:bg-primary/20 text-primary"
                        >
                          <Icons.Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTeam(saved.id)}
                          className="p-1.5 rounded hover:bg-destructive/20 text-destructive"
                        >
                          <Icons.Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Slots */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {team.map((slot, index) => (
          <div
            key={index}
            className={`relative rounded-xl border-2 transition-all ${
              activeSlot === index
                ? "border-primary bg-primary/5"
                : slot.pokemon
                ? "border-border bg-card"
                : "border-dashed border-muted-foreground/30 bg-muted/20"
            }`}
          >
            {slot.pokemon ? (
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted-foreground">#{slot.pokemon.pokedexId}</span>
                  <button
                    onClick={() => removePokemonFromSlot(index)}
                    className="p-1 rounded hover:bg-destructive/20 text-destructive"
                  >
                    <Icons.Close className="h-3 w-3" />
                  </button>
                </div>
                <h4 className="font-semibold text-center capitalize mb-2">
                  {slot.pokemon.name}
                </h4>
                <div className="flex justify-center gap-1 mb-3">
                  {slot.pokemon.types.map((type) => (
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
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HP</span>
                    <span>{slot.pokemon.hpBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atk</span>
                    <span>{slot.pokemon.attackBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Def</span>
                    <span>{slot.pokemon.defenseBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SpA</span>
                    <span>{slot.pokemon.spAtkBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SpD</span>
                    <span>{slot.pokemon.spDefBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spe</span>
                    <span>{slot.pokemon.speedBase}</span>
                  </div>
                </div>
                {slot.pokemon.isLegendary && (
                  <div className="mt-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                      Legendary
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveSlot(activeSlot === index ? null : index)}
                className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.Plus className="h-8 w-8" />
                <span className="text-sm">Add Pokemon</span>
              </button>
            )}

            {/* Search Dropdown */}
            {activeSlot === index && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50">
                <div className="rounded-xl border border-border bg-card shadow-lg p-3">
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
                      searchResults.map((pokemon) => (
                        <button
                          key={pokemon.id}
                          onClick={() => addPokemonToSlot(pokemon, index)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <span className="text-xs text-muted-foreground w-8">
                            #{pokemon.pokedexId}
                          </span>
                          <span className="font-medium capitalize flex-1">
                            {pokemon.name}
                          </span>
                          <div className="flex gap-1">
                            {pokemon.types.map((type) => (
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
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No Pokemon found
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Type to search...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Type Coverage Analysis */}
      {teamPokemon > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icons.Shield className="h-5 w-5 text-primary" />
            Type Coverage Analysis
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {ALL_TYPES.map((type) => {
              const cov = coverage[type];
              const netScore = cov.resist + cov.immune * 2 - cov.weak;
              return (
                <div
                  key={type}
                  className={`p-2 rounded-lg text-center ${
                    netScore > 0
                      ? "bg-green-500/10 border border-green-500/30"
                      : netScore < 0
                      ? "bg-red-500/10 border border-red-500/30"
                      : "bg-muted/50 border border-transparent"
                  }`}
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs text-white capitalize mb-1 ${
                      TYPE_COLORS[type]
                    }`}
                  >
                    {type}
                  </span>
                  <div className="text-xs space-y-0.5">
                    {cov.weak > 0 && (
                      <p className="text-red-400">Weak: {cov.weak}</p>
                    )}
                    {cov.resist > 0 && (
                      <p className="text-green-400">Resist: {cov.resist}</p>
                    )}
                    {cov.immune > 0 && (
                      <p className="text-blue-400">Immune: {cov.immune}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Green = team resists well, Red = team is weak to this type
          </p>
        </div>
      )}

      {/* Team Stats Summary */}
      {teamPokemon > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icons.BarChart className="h-5 w-5 text-primary" />
            Team Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"].map((stat, i) => {
              const statKey = ["hpBase", "attackBase", "defenseBase", "spAtkBase", "spDefBase", "speedBase"][i];
              const total = team.reduce((sum, slot) => {
                if (!slot.pokemon) return sum;
                return sum + (slot.pokemon as any)[statKey];
              }, 0);
              const avg = teamPokemon > 0 ? Math.round(total / teamPokemon) : 0;
              return (
                <div key={stat} className="text-center">
                  <p className="text-sm text-muted-foreground">{stat}</p>
                  <p className="text-2xl font-bold">{avg}</p>
                  <p className="text-xs text-muted-foreground">avg</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
