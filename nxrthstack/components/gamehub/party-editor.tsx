"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import {
  type SaveData,
  type Pokemon,
  POKEMON_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  setGen3PokemonIVs,
  setGen3PokemonEVs,
  setGen3PokemonLevel,
  setPerfectPokemon,
  healGen3Pokemon,
  recalculateGen3Stats,
  setGen1PokemonIVs,
  setGen1PokemonEVs,
  setGen1PokemonLevel,
  setPerfectGen1Pokemon,
  healGen1Pokemon,
  setGen2PokemonIVs,
  setGen2PokemonEVs,
  setGen2PokemonLevel,
  setPerfectGen2Pokemon,
  healGen2Pokemon,
  setGen1PokemonNickname,
  setGen2PokemonNickname,
  setGen3PokemonNickname,
  setGen1PokemonSpecies,
  setGen2PokemonSpecies,
  setGen3PokemonSpecies,
  EV_PRESETS,
  type EVPresetName,
} from "@/lib/pokemon/save-detector";

interface PartyEditorProps {
  saveData: Uint8Array;
  parsedSave: SaveData;
  onDataChange: (newData: Uint8Array) => void;
}

export function PartyEditor({
  saveData,
  parsedSave,
  onDataChange,
}: PartyEditorProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);

  const party = parsedSave.party;

  if (party.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Icons.Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">
          No Party Pokemon
        </h3>
        <p className="mt-2 text-muted-foreground">
          This save file doesn&apos;t have any Pokemon in the party or couldn&apos;t be parsed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Party Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {party.map((pokemon, index) => (
          <motion.button
            key={index}
            onClick={() => setSelectedPokemon(selectedPokemon === index ? null : index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-xl border p-4 text-left transition-colors ${
              selectedPokemon === index
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {/* Shiny indicator */}
            {pokemon.isShiny && (
              <div className="absolute top-2 right-2">
                <Icons.Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Pokemon icon placeholder */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-2xl font-bold text-primary">
                  {pokemon.speciesName.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {pokemon.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pokemon.speciesName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lv. {pokemon.level}
                </p>
              </div>
            </div>

            {/* HP Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>HP</span>
                <span>
                  {pokemon.currentHp}/{pokemon.maxHp}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pokemon.currentHp / pokemon.maxHp > 0.5
                      ? "bg-green-500"
                      : pokemon.currentHp / pokemon.maxHp > 0.2
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(pokemon.currentHp / pokemon.maxHp) * 100}%`,
                  }}
                />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected Pokemon Details */}
      <AnimatePresence>
        {selectedPokemon !== null && party[selectedPokemon] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <PokemonDetails
              pokemon={party[selectedPokemon]}
              generation={parsedSave.info.generation}
              partyIndex={selectedPokemon}
              saveData={saveData}
              onDataChange={onDataChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <Icons.Info className="inline h-4 w-4 mr-1" />
          Click on a Pokemon to view detailed information. Pokemon editing features coming soon.
        </p>
      </div>
    </div>
  );
}

function PokemonDetails({
  pokemon,
  generation,
  partyIndex,
  saveData,
  onDataChange,
}: {
  pokemon: Pokemon;
  generation: number;
  partyIndex: number;
  saveData: Uint8Array;
  onDataChange: (newData: Uint8Array) => void;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState(pokemon.nickname);
  const [isEditingSpecies, setIsEditingSpecies] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");

  const maxPokemon = generation === 1 ? 151 : generation === 2 ? 251 : 386;

  const handleSaveNickname = useCallback(() => {
    if (!editNickname.trim()) return;

    const newData = new Uint8Array(saveData);
    let success = false;

    if (generation === 1) {
      success = setGen1PokemonNickname(newData, partyIndex, editNickname.trim());
    } else if (generation === 2) {
      success = setGen2PokemonNickname(newData, partyIndex, editNickname.trim());
    } else {
      success = setGen3PokemonNickname(newData, partyIndex, editNickname.trim());
    }

    if (success) {
      onDataChange(newData);
      setIsEditingNickname(false);
    }
  }, [saveData, generation, partyIndex, editNickname, onDataChange]);

  const handleChangeSpecies = useCallback((newSpecies: number) => {
    const newData = new Uint8Array(saveData);
    let success = false;

    if (generation === 1) {
      success = setGen1PokemonSpecies(newData, partyIndex, newSpecies);
    } else if (generation === 2) {
      success = setGen2PokemonSpecies(newData, partyIndex, newSpecies);
    } else {
      success = setGen3PokemonSpecies(newData, partyIndex, newSpecies);
    }

    if (success) {
      onDataChange(newData);
      setIsEditingSpecies(false);
      setSpeciesSearch("");
    }
  }, [saveData, generation, partyIndex, onDataChange]);

  // Filter Pokemon for species search
  const filteredSpecies = speciesSearch
    ? Object.entries(POKEMON_NAMES)
        .filter(([id, name]) => {
          const pokemonId = parseInt(id);
          return pokemonId <= maxPokemon && (
            name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
            id.includes(speciesSearch)
          );
        })
        .slice(0, 10)
    : [];

  const applyPreset = async (presetType: string, evPreset?: EVPresetName) => {
    setIsApplying(true);
    const newData = new Uint8Array(saveData);

    let success = false;

    if (generation === 1) {
      // Gen 1 presets
      switch (presetType) {
        case "maxIVs":
          success = setGen1PokemonIVs(newData, partyIndex, {
            attack: 15, defense: 15, speed: 15, special: 15,
          });
          break;
        case "maxEVs":
          success = setGen1PokemonEVs(newData, partyIndex, {
            hp: 65535, attack: 65535, defense: 65535, speed: 65535, special: 65535,
          });
          break;
        case "level100":
          success = setGen1PokemonLevel(newData, partyIndex, 100);
          break;
        case "heal":
          success = healGen1Pokemon(newData, partyIndex);
          break;
        case "perfect":
          success = setPerfectGen1Pokemon(newData, partyIndex);
          break;
      }
    } else if (generation === 2) {
      // Gen 2 presets
      switch (presetType) {
        case "maxIVs":
          success = setGen2PokemonIVs(newData, partyIndex, {
            attack: 15, defense: 15, speed: 15, special: 15,
          });
          break;
        case "maxEVs":
          success = setGen2PokemonEVs(newData, partyIndex, {
            hp: 65535, attack: 65535, defense: 65535, speed: 65535, special: 65535,
          });
          break;
        case "level100":
          success = setGen2PokemonLevel(newData, partyIndex, 100);
          break;
        case "heal":
          success = healGen2Pokemon(newData, partyIndex);
          break;
        case "perfect":
          success = setPerfectGen2Pokemon(newData, partyIndex);
          break;
      }
    } else {
      // Gen 3 presets
      switch (presetType) {
        case "maxIVs":
          success = setGen3PokemonIVs(newData, partyIndex, {
            hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31,
          });
          if (success) recalculateGen3Stats(newData, partyIndex);
          break;
        case "evPreset":
          if (evPreset) {
            success = setGen3PokemonEVs(newData, partyIndex, EV_PRESETS[evPreset]);
            if (success) recalculateGen3Stats(newData, partyIndex);
          }
          break;
        case "level100":
          success = setGen3PokemonLevel(newData, partyIndex, 100);
          break;
        case "heal":
          success = healGen3Pokemon(newData, partyIndex);
          break;
        case "perfectPhysical":
          success = setPerfectPokemon(newData, partyIndex, EV_PRESETS.physicalSweeper);
          break;
        case "perfectSpecial":
          success = setPerfectPokemon(newData, partyIndex, EV_PRESETS.specialSweeper);
          break;
        case "perfectTank":
          success = setPerfectPokemon(newData, partyIndex, EV_PRESETS.physicalTank);
          break;
      }
    }

    if (success) {
      onDataChange(newData);
    }
    setIsApplying(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Edit Options */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditingSpecies(!isEditingSpecies)}
            className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
            title="Click to change species"
          >
            <span className="text-4xl font-bold text-primary">
              #{pokemon.species.toString().padStart(3, "0")}
            </span>
          </button>
          <div>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value.slice(0, 10))}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-lg font-bold text-foreground focus:border-primary focus:outline-none"
                  maxLength={10}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNickname();
                    if (e.key === "Escape") setIsEditingNickname(false);
                  }}
                />
                <button
                  onClick={handleSaveNickname}
                  className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
                >
                  <Icons.Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingNickname(false);
                    setEditNickname(pokemon.nickname);
                  }}
                  className="rounded-lg bg-muted p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <Icons.Close className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <h3
                className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => setIsEditingNickname(true)}
                title="Click to edit nickname"
              >
                {pokemon.nickname}
                <Icons.Pencil className="h-4 w-4 opacity-50" />
                {pokemon.isShiny && (
                  <Icons.Sparkles className="h-5 w-5 text-yellow-500" />
                )}
              </h3>
            )}
            <p className="text-muted-foreground">{pokemon.speciesName}</p>
            {generation === 3 && pokemon.nature !== undefined && (
              <p className="text-sm text-muted-foreground">
                {NATURE_NAMES[pokemon.nature]} Nature
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Species Changer */}
      {isEditingSpecies && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icons.Shuffle className="h-4 w-4 text-primary" />
            Change Species
          </h4>
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={speciesSearch}
              onChange={(e) => setSpeciesSearch(e.target.value)}
              placeholder="Search Pokemon by name or number..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>
          {filteredSpecies.length > 0 && (
            <div className="mt-2 grid gap-1">
              {filteredSpecies.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => handleChangeSpecies(parseInt(id))}
                  className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {id.padStart(3, "0")}
                  </span>
                  <span className="font-medium text-foreground">{name}</span>
                </button>
              ))}
            </div>
          )}
          {speciesSearch && filteredSpecies.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No Pokemon found</p>
          )}
          <button
            onClick={() => {
              setIsEditingSpecies(false);
              setSpeciesSearch("");
            }}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Stat Presets */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icons.Zap className="h-4 w-4 text-primary" />
          Stat Presets (Gen {generation})
        </h4>

        {/* Gen 1/2 Presets (simpler since they have single Special stat) */}
        {(generation === 1 || generation === 2) && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => applyPreset("maxIVs")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Icons.TrendingUp className="h-4 w-4" />
                Max IVs (15)
              </button>
              <button
                onClick={() => applyPreset("maxEVs")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.TrendingUp className="h-4 w-4" />
                Max EVs
              </button>
              <button
                onClick={() => applyPreset("level100")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Icons.Star className="h-4 w-4" />
                Level 100
              </button>
              <button
                onClick={() => applyPreset("heal")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.Heart className="h-4 w-4" />
                Full Heal
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Perfect Pokemon (Max IVs + Max EVs + Level 100 + Full Heal)</p>
              <button
                onClick={() => applyPreset("perfect")}
                disabled={isApplying}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Icons.Sparkles className="h-4 w-4" />
                Make Perfect
              </button>
            </div>
          </>
        )}

        {/* Gen 3 Presets (more complex with separate SpAtk/SpDef) */}
        {generation === 3 && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => applyPreset("maxIVs")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Icons.TrendingUp className="h-4 w-4" />
                Max IVs (31)
              </button>
              <button
                onClick={() => applyPreset("level100")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Icons.Star className="h-4 w-4" />
                Level 100
              </button>
              <button
                onClick={() => applyPreset("heal")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.Heart className="h-4 w-4" />
                Full Heal
              </button>
              <button
                onClick={() => applyPreset("evPreset", "physicalSweeper")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.Swords className="h-4 w-4" />
                Atk/Spd EVs
              </button>
              <button
                onClick={() => applyPreset("evPreset", "specialSweeper")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.Wand className="h-4 w-4" />
                SpA/Spd EVs
              </button>
              <button
                onClick={() => applyPreset("evPreset", "physicalTank")}
                disabled={isApplying}
                className="flex items-center gap-2 rounded-lg bg-gray-500/10 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-500/20 transition-colors disabled:opacity-50"
              >
                <Icons.Shield className="h-4 w-4" />
                HP/Def EVs
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Perfect Pokemon (Max IVs + EVs + Level 100)</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  onClick={() => applyPreset("perfectPhysical")}
                  disabled={isApplying}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Icons.Swords className="h-4 w-4" />
                  Physical Sweeper
                </button>
                <button
                  onClick={() => applyPreset("perfectSpecial")}
                  disabled={isApplying}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Icons.Wand className="h-4 w-4" />
                  Special Sweeper
                </button>
                <button
                  onClick={() => applyPreset("perfectTank")}
                  disabled={isApplying}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-500 to-slate-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Icons.Shield className="h-4 w-4" />
                  Tank
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Stats</h4>
        <div className="grid gap-2">
          <StatBar label="HP" value={pokemon.maxHp} max={500} color="bg-red-500" />
          <StatBar label="Attack" value={pokemon.attack} max={400} color="bg-orange-500" />
          <StatBar label="Defense" value={pokemon.defense} max={400} color="bg-yellow-500" />
          {generation >= 3 ? (
            <>
              <StatBar label="Sp. Atk" value={pokemon.spAttack || 0} max={400} color="bg-blue-500" />
              <StatBar label="Sp. Def" value={pokemon.spDefense || 0} max={400} color="bg-green-500" />
            </>
          ) : (
            <StatBar label="Special" value={pokemon.special || 0} max={400} color="bg-purple-500" />
          )}
          <StatBar label="Speed" value={pokemon.speed} max={400} color="bg-pink-500" />
        </div>
      </div>

      {/* Moves */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Moves</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {pokemon.moves.map((moveId, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2"
            >
              <span className="font-medium text-foreground">
                {MOVE_NAMES[moveId] || `Move ${moveId}`}
              </span>
              <span className="text-sm text-muted-foreground">
                PP: {pokemon.movePP[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* IVs and EVs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* IVs */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            IVs {generation >= 3 ? "(0-31)" : "(0-15)"}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">HP</span>
              <span className="font-medium text-foreground">{pokemon.ivs.hp}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">ATK</span>
              <span className="font-medium text-foreground">{pokemon.ivs.attack}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">DEF</span>
              <span className="font-medium text-foreground">{pokemon.ivs.defense}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">SPD</span>
              <span className="font-medium text-foreground">{pokemon.ivs.speed}</span>
            </div>
            {generation >= 3 ? (
              <>
                <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                  <span className="text-muted-foreground">SPA</span>
                  <span className="font-medium text-foreground">{pokemon.ivs.spAttack}</span>
                </div>
                <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                  <span className="text-muted-foreground">SPD</span>
                  <span className="font-medium text-foreground">{pokemon.ivs.spDefense}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                <span className="text-muted-foreground">SPC</span>
                <span className="font-medium text-foreground">{pokemon.ivs.special}</span>
              </div>
            )}
          </div>
        </div>

        {/* EVs */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            EVs {generation >= 3 ? "(0-255)" : "(0-65535)"}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">HP</span>
              <span className="font-medium text-foreground">{pokemon.evs.hp}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">ATK</span>
              <span className="font-medium text-foreground">{pokemon.evs.attack}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">DEF</span>
              <span className="font-medium text-foreground">{pokemon.evs.defense}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
              <span className="text-muted-foreground">SPD</span>
              <span className="font-medium text-foreground">{pokemon.evs.speed}</span>
            </div>
            {generation >= 3 ? (
              <>
                <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                  <span className="text-muted-foreground">SPA</span>
                  <span className="font-medium text-foreground">{pokemon.evs.spAttack}</span>
                </div>
                <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                  <span className="text-muted-foreground">SPD</span>
                  <span className="font-medium text-foreground">{pokemon.evs.spDefense}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between rounded bg-muted/50 px-3 py-1.5">
                <span className="text-muted-foreground">SPC</span>
                <span className="font-medium text-foreground">{pokemon.evs.special}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OT Info */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Original Trainer</h4>
        <div className="flex gap-4 text-sm">
          <div className="rounded bg-muted/50 px-4 py-2">
            <span className="text-muted-foreground">Name: </span>
            <span className="font-medium text-foreground">{pokemon.otName}</span>
          </div>
          <div className="rounded bg-muted/50 px-4 py-2">
            <span className="text-muted-foreground">ID: </span>
            <span className="font-medium text-foreground">
              {pokemon.otId.toString().padStart(5, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}
