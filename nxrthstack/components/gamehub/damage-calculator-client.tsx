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

interface PokemonState {
  pokemon: Pokemon | null;
  level: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  hp: number;
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

const NATURES: Record<string, { plus?: string; minus?: string }> = {
  Hardy: {},
  Lonely: { plus: "attack", minus: "defense" },
  Brave: { plus: "attack", minus: "speed" },
  Adamant: { plus: "attack", minus: "spAtk" },
  Naughty: { plus: "attack", minus: "spDef" },
  Bold: { plus: "defense", minus: "attack" },
  Docile: {},
  Relaxed: { plus: "defense", minus: "speed" },
  Impish: { plus: "defense", minus: "spAtk" },
  Lax: { plus: "defense", minus: "spDef" },
  Timid: { plus: "speed", minus: "attack" },
  Hasty: { plus: "speed", minus: "defense" },
  Serious: {},
  Jolly: { plus: "speed", minus: "spAtk" },
  Naive: { plus: "speed", minus: "spDef" },
  Modest: { plus: "spAtk", minus: "attack" },
  Mild: { plus: "spAtk", minus: "defense" },
  Quiet: { plus: "spAtk", minus: "speed" },
  Bashful: {},
  Rash: { plus: "spAtk", minus: "spDef" },
  Calm: { plus: "spDef", minus: "attack" },
  Gentle: { plus: "spDef", minus: "defense" },
  Sassy: { plus: "spDef", minus: "speed" },
  Careful: { plus: "spDef", minus: "spAtk" },
  Quirky: {},
};

export function DamageCalculatorClient() {
  const [attacker, setAttacker] = useState<PokemonState>({
    pokemon: null,
    level: 50,
    attack: 100,
    defense: 100,
    spAtk: 100,
    spDef: 100,
    hp: 200,
  });
  const [defender, setDefender] = useState<PokemonState>({
    pokemon: null,
    level: 50,
    attack: 100,
    defense: 100,
    spAtk: 100,
    spDef: 100,
    hp: 200,
  });

  const [moveType, setMoveType] = useState("normal");
  const [movePower, setMovePower] = useState(80);
  const [moveCategory, setMoveCategory] = useState<"physical" | "special">("physical");
  const [isStab, setIsStab] = useState(false);
  const [isCrit, setIsCrit] = useState(false);
  const [weather, setWeather] = useState<"none" | "sun" | "rain" | "sand" | "hail">("none");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"attacker" | "defender" | null>(null);

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
      if (searchTarget) {
        searchPokemon(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTarget, searchPokemon]);

  const selectPokemon = (pokemon: Pokemon) => {
    const calculateStat = (base: number, isHp: boolean = false) => {
      const level = 50;
      const iv = 31;
      const ev = 0;
      if (isHp) {
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
      }
      return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5));
    };

    const newState: PokemonState = {
      pokemon,
      level: 50,
      attack: calculateStat(pokemon.attackBase),
      defense: calculateStat(pokemon.defenseBase),
      spAtk: calculateStat(pokemon.spAtkBase),
      spDef: calculateStat(pokemon.spDefBase),
      hp: calculateStat(pokemon.hpBase, true),
    };

    if (searchTarget === "attacker") {
      setAttacker(newState);
      // Auto-detect STAB
      setIsStab(pokemon.types.map(t => t.toLowerCase()).includes(moveType));
    } else {
      setDefender(newState);
    }

    setSearchTarget(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Calculate type effectiveness
  const getTypeEffectiveness = () => {
    if (!defender.pokemon) return 1;

    let multiplier = 1;
    defender.pokemon.types.forEach((defType) => {
      const eff = TYPE_EFFECTIVENESS[moveType]?.[defType.toLowerCase()] ?? 1;
      multiplier *= eff;
    });
    return multiplier;
  };

  // Calculate damage
  const calculateDamage = () => {
    const level = attacker.level;
    const power = movePower;
    const attack = moveCategory === "physical" ? attacker.attack : attacker.spAtk;
    const defense = moveCategory === "physical" ? defender.defense : defender.spDef;

    // Base damage formula
    const baseDamage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2;

    // Modifiers
    let modifier = 1;

    // STAB
    if (isStab) modifier *= 1.5;

    // Type effectiveness
    const effectiveness = getTypeEffectiveness();
    modifier *= effectiveness;

    // Weather
    if (weather === "sun" && moveType === "fire") modifier *= 1.5;
    if (weather === "sun" && moveType === "water") modifier *= 0.5;
    if (weather === "rain" && moveType === "water") modifier *= 1.5;
    if (weather === "rain" && moveType === "fire") modifier *= 0.5;

    // Critical hit
    if (isCrit) modifier *= 1.5;

    const maxDamage = Math.floor(baseDamage * modifier);
    const minDamage = Math.floor(baseDamage * modifier * 0.85);

    return { min: minDamage, max: maxDamage, effectiveness };
  };

  const damage = calculateDamage();
  const damagePercent = defender.hp > 0
    ? { min: ((damage.min / defender.hp) * 100).toFixed(1), max: ((damage.max / defender.hp) * 100).toFixed(1) }
    : { min: "0", max: "0" };

  const getOHKOChance = () => {
    if (damage.min >= defender.hp) return "Guaranteed OHKO";
    if (damage.max >= defender.hp) {
      const range = damage.max - damage.min;
      if (range === 0) return "0% chance to OHKO";
      const threshold = defender.hp - damage.min;
      const chance = ((range - threshold + 1) / 16 * 100).toFixed(1);
      return `${chance}% chance to OHKO`;
    }
    return "Cannot OHKO";
  };

  const getEffectivenessText = () => {
    if (damage.effectiveness === 0) return "No effect";
    if (damage.effectiveness === 0.25) return "Not very effective (0.25x)";
    if (damage.effectiveness === 0.5) return "Not very effective (0.5x)";
    if (damage.effectiveness === 1) return "Normal effectiveness";
    if (damage.effectiveness === 2) return "Super effective! (2x)";
    if (damage.effectiveness === 4) return "Super effective! (4x)";
    return `${damage.effectiveness}x`;
  };

  const PokemonSelector = ({
    label,
    state,
    target
  }: {
    label: string;
    state: PokemonState;
    target: "attacker" | "defender"
  }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold mb-3">{label}</h3>

      {/* Pokemon Selection */}
      <div className="relative mb-4">
        {state.pokemon ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/60">#{state.pokemon.pokedexId}</span>
              <span className="font-medium capitalize text-foreground">{state.pokemon.name}</span>
              <div className="flex gap-1">
                {state.pokemon.types.map((type) => (
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
            </div>
            <button
              onClick={() => setSearchTarget(target)}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchTarget(target)}
            className="w-full p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 text-foreground/60 hover:border-primary hover:text-primary transition-colors"
          >
            Select Pokemon
          </button>
        )}

        {/* Search dropdown */}
        {searchTarget === target && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-lg p-3">
            <div className="relative mb-2">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Pokemon..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Icons.Loader2 className="h-5 w-5 animate-spin text-foreground/60" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((pokemon) => (
                  <button
                    key={pokemon.id}
                    onClick={() => selectPokemon(pokemon)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-xs text-foreground/60 w-8">#{pokemon.pokedexId}</span>
                    <span className="font-medium capitalize flex-1 text-foreground">{pokemon.name}</span>
                  </button>
                ))
              ) : searchQuery ? (
                <p className="text-sm text-foreground/60 text-center py-4">No Pokemon found</p>
              ) : (
                <p className="text-sm text-foreground/60 text-center py-4">Type to search...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-foreground/60">Level</label>
          <input
            type="number"
            min={1}
            max={100}
            value={state.level}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, level: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-foreground/60">HP</label>
          <input
            type="number"
            min={1}
            value={state.hp}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, hp: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-foreground/60">Attack</label>
          <input
            type="number"
            min={1}
            value={state.attack}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, attack: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-foreground/60">Defense</label>
          <input
            type="number"
            min={1}
            value={state.defense}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, defense: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-foreground/60">Sp. Atk</label>
          <input
            type="number"
            min={1}
            value={state.spAtk}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, spAtk: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-foreground/60">Sp. Def</label>
          <input
            type="number"
            min={1}
            value={state.spDef}
            onChange={(e) => {
              const setter = target === "attacker" ? setAttacker : setDefender;
              setter({ ...state, spDef: parseInt(e.target.value) || 1 });
            }}
            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pokemon Selectors */}
      <div className="grid md:grid-cols-2 gap-6">
        <PokemonSelector label="Attacker" state={attacker} target="attacker" />
        <PokemonSelector label="Defender" state={defender} target="defender" />
      </div>

      {/* Move Settings */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Move Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-foreground/60">Move Type</label>
            <select
              value={moveType}
              onChange={(e) => {
                setMoveType(e.target.value);
                if (attacker.pokemon) {
                  setIsStab(attacker.pokemon.types.map(t => t.toLowerCase()).includes(e.target.value));
                }
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground"
            >
              {ALL_TYPES.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-foreground/60">Base Power</label>
            <input
              type="number"
              min={0}
              max={300}
              value={movePower}
              onChange={(e) => setMovePower(parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-foreground/60">Category</label>
            <select
              value={moveCategory}
              onChange={(e) => setMoveCategory(e.target.value as "physical" | "special")}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground"
            >
              <option value="physical">Physical</option>
              <option value="special">Special</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-foreground/60">Weather</label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground"
            >
              <option value="none">None</option>
              <option value="sun">Harsh Sunlight</option>
              <option value="rain">Rain</option>
              <option value="sand">Sandstorm</option>
              <option value="hail">Hail</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isStab}
              onChange={(e) => setIsStab(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">STAB (1.5x)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCrit}
              onChange={(e) => setIsCrit(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Critical Hit (1.5x)</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icons.Swords className="h-5 w-5 text-primary" />
          Damage Calculation
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-foreground/60 mb-1">Damage Range</p>
            <p className="text-3xl font-bold">
              {damage.min} - {damage.max}
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              ({damagePercent.min}% - {damagePercent.max}%)
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-foreground/60 mb-1">Type Effectiveness</p>
            <p className={`text-lg font-semibold ${
              damage.effectiveness > 1 ? "text-green-500" :
              damage.effectiveness < 1 ? "text-red-500" : ""
            }`}>
              {getEffectivenessText()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-foreground/60 mb-1">OHKO Analysis</p>
            <p className={`text-lg font-semibold ${
              damage.min >= defender.hp ? "text-green-500" :
              damage.max >= defender.hp ? "text-yellow-500" : "text-foreground/60"
            }`}>
              {getOHKOChance()}
            </p>
          </div>
        </div>

        {/* HP Bar Visualization */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground/60">Defender HP</span>
            <span>{defender.hp} HP</span>
          </div>
          <div className="h-6 bg-muted rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 bg-red-500/50 transition-all"
              style={{ width: `${Math.min(100, parseFloat(damagePercent.max))}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-red-500 transition-all"
              style={{ width: `${Math.min(100, parseFloat(damagePercent.min))}%` }}
            />
            <div
              className="absolute inset-y-0 bg-green-500 transition-all"
              style={{
                left: `${Math.min(100, parseFloat(damagePercent.max))}%`,
                right: 0
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-foreground/60">
            <span>Min: {damage.min} dmg</span>
            <span>Max: {damage.max} dmg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
