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
  GEN3_LEARNSETS,
  addGen3Pokemon,
  removeGen3Pokemon,
  setGen3BoxPokemonIVs,
  setGen3BoxPokemonEVs,
  setGen3BoxPokemonLevel,
  setGen3BoxPokemonNickname,
  setGen3BoxPokemonSpecies,
  setGen3BoxPokemonMoves,
  toggleGen3BoxShiny,
  EV_PRESETS,
  type EVPresetName,
} from "@/lib/pokemon/save-detector";

interface BoxesEditorProps {
  saveData: Uint8Array;
  parsedSave: SaveData;
  onDataChange: (newData: Uint8Array) => void;
}

export function BoxesEditor({
  saveData,
  parsedSave,
  onDataChange,
}: BoxesEditorProps) {
  const [selectedBox, setSelectedBox] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showAddPokemon, setShowAddPokemon] = useState(false);
  const [addSpeciesSearch, setAddSpeciesSearch] = useState("");
  const [addLevel, setAddLevel] = useState(5);
  const [addShiny, setAddShiny] = useState(false);

  const boxes = parsedSave.boxes;
  const generation = parsedSave.info.generation;

  // Calculate box limits based on generation
  const maxBoxes = generation === 1 ? 12 : generation === 2 ? 14 : 14;
  const pokemonPerBox = generation === 3 ? 30 : 20;
  const maxPokemon = generation === 1 ? 151 : generation === 2 ? 251 : 386;

  const handleAddPokemon = useCallback((species: number) => {
    if (generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const success = addGen3Pokemon(newData, species, addLevel, {
      shiny: addShiny,
      boxIndex: selectedBox,
    });

    if (success) {
      onDataChange(newData);
      setShowAddPokemon(false);
      setAddSpeciesSearch("");
      setAddLevel(5);
      setAddShiny(false);
    }
  }, [saveData, generation, addLevel, addShiny, selectedBox, onDataChange]);

  const handleRemovePokemon = useCallback((boxIndex: number, slotIndex: number) => {
    if (generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const success = removeGen3Pokemon(newData, boxIndex, slotIndex);

    if (success) {
      onDataChange(newData);
      setSelectedSlot(null);
    }
  }, [saveData, generation, onDataChange]);

  // Filter Pokemon for add search
  const filteredAddSpecies = addSpeciesSearch
    ? Object.entries(POKEMON_NAMES)
        .filter(([id, name]) => {
          const pokemonId = parseInt(id);
          return pokemonId <= maxPokemon && (
            name.toLowerCase().includes(addSpeciesSearch.toLowerCase()) ||
            id.includes(addSpeciesSearch)
          );
        })
        .slice(0, 10)
    : [];

  if (boxes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Icons.Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No PC Box Data
          </h3>
          <p className="mt-2 text-muted-foreground">
            PC Box data couldn&apos;t be parsed from this save file.
            {generation < 3 && " Gen 1-2 box parsing only reads the current active box."}
          </p>
        </div>

        {/* Add Pokemon Button for empty boxes (Gen 3 only) */}
        {generation === 3 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAddPokemon(!showAddPokemon)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Icons.Plus className="h-4 w-4" />
              Add Pokemon to PC
            </button>
          </div>
        )}

        {/* Add Pokemon Panel */}
        <AnimatePresence>
          {showAddPokemon && generation === 3 && (
            <AddPokemonPanel
              addSpeciesSearch={addSpeciesSearch}
              setAddSpeciesSearch={setAddSpeciesSearch}
              addLevel={addLevel}
              setAddLevel={setAddLevel}
              addShiny={addShiny}
              setAddShiny={setAddShiny}
              filteredAddSpecies={filteredAddSpecies}
              handleAddPokemon={handleAddPokemon}
              onCancel={() => {
                setShowAddPokemon(false);
                setAddSpeciesSearch("");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentBox = boxes[selectedBox] || [];
  const selectedPokemon = selectedSlot !== null ? currentBox[selectedSlot] : null;

  return (
    <div className="space-y-6">
      {/* Box Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              PC Boxes
            </h3>
            <p className="text-sm text-muted-foreground">
              Gen {generation} - {pokemonPerBox} Pokemon per box
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {boxes.reduce((total, box) => total + box.length, 0)} Pokemon stored
            </span>
            {/* Add Pokemon Button (Gen 3 only) */}
            {generation === 3 && (
              <button
                onClick={() => setShowAddPokemon(!showAddPokemon)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  showAddPokemon
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                <Icons.Plus className="h-4 w-4" />
                Add Pokemon
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Pokemon Panel */}
      <AnimatePresence>
        {showAddPokemon && generation === 3 && (
          <AddPokemonPanel
            addSpeciesSearch={addSpeciesSearch}
            setAddSpeciesSearch={setAddSpeciesSearch}
            addLevel={addLevel}
            setAddLevel={setAddLevel}
            addShiny={addShiny}
            setAddShiny={setAddShiny}
            filteredAddSpecies={filteredAddSpecies}
            handleAddPokemon={handleAddPokemon}
            onCancel={() => {
              setShowAddPokemon(false);
              setAddSpeciesSearch("");
            }}
            selectedBox={selectedBox}
          />
        )}
      </AnimatePresence>

      {/* Box Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: maxBoxes }, (_, index) => {
          const box = boxes[index] || [];
          return (
            <button
              key={index}
              onClick={() => {
                setSelectedBox(index);
                setSelectedSlot(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                selectedBox === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Box {index + 1}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  selectedBox === index
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {box.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pokemon Grid */}
      {currentBox.length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {currentBox.map((pokemon, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-xl border p-3 text-left transition-colors ${
                selectedSlot === index
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {/* Shiny indicator */}
              {pokemon.isShiny && (
                <div className="absolute top-1 right-1">
                  <Icons.Sparkles className="h-3 w-3 text-yellow-500" />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-2">
                  <span className="text-lg font-bold text-primary">
                    {pokemon.speciesName.charAt(0)}
                  </span>
                </div>
                <p className="font-medium text-foreground text-sm truncate w-full">
                  {pokemon.nickname}
                </p>
                <p className="text-xs text-muted-foreground truncate w-full">
                  {pokemon.speciesName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lv. {pokemon.level}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Icons.Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Empty Box
          </h3>
          <p className="mt-2 text-muted-foreground">
            This box doesn&apos;t have any Pokemon.
            {generation === 3 && " Click 'Add Pokemon' to add one."}
          </p>
        </div>
      )}

      {/* Selected Pokemon Details */}
      <AnimatePresence>
        {selectedSlot !== null && selectedPokemon && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <BoxPokemonDetails
              pokemon={selectedPokemon}
              generation={generation}
              boxIndex={selectedBox}
              slotIndex={selectedSlot}
              saveData={saveData}
              onDataChange={onDataChange}
              onRemove={() => handleRemovePokemon(selectedBox, selectedSlot)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <Icons.Info className="inline h-4 w-4 mr-1" />
          {generation < 3
            ? "Gen 1-2 only shows the currently active box. Full editing requires Gen 3 saves."
            : "Click on a Pokemon to edit its stats, moves, and more. Use 'Add Pokemon' to create new Pokemon."}
        </p>
      </div>
    </div>
  );
}

function AddPokemonPanel({
  addSpeciesSearch,
  setAddSpeciesSearch,
  addLevel,
  setAddLevel,
  addShiny,
  setAddShiny,
  filteredAddSpecies,
  handleAddPokemon,
  onCancel,
  selectedBox,
}: {
  addSpeciesSearch: string;
  setAddSpeciesSearch: (value: string) => void;
  addLevel: number;
  setAddLevel: (value: number) => void;
  addShiny: boolean;
  setAddShiny: (value: boolean) => void;
  filteredAddSpecies: [string, string][];
  handleAddPokemon: (species: number) => void;
  onCancel: () => void;
  selectedBox?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-primary/30 bg-primary/5 p-4 overflow-hidden"
    >
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icons.Plus className="h-4 w-4 text-primary" />
        Add Pokemon to Box {selectedBox !== undefined ? selectedBox + 1 : 1}
      </h4>

      <div className="space-y-4">
        {/* Species Search */}
        <div>
          <label className="text-xs text-muted-foreground">Pokemon</label>
          <div className="relative mt-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={addSpeciesSearch}
              onChange={(e) => setAddSpeciesSearch(e.target.value)}
              placeholder="Search Pokemon by name or number..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          {filteredAddSpecies.length > 0 && (
            <div className="mt-2 grid gap-1 max-h-48 overflow-y-auto">
              {filteredAddSpecies.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => handleAddPokemon(parseInt(id))}
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
        </div>

        {/* Level and Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Level</label>
            <input
              type="number"
              min={1}
              max={100}
              value={addLevel}
              onChange={(e) => setAddLevel(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="mt-1 w-20 rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block">Shiny</label>
            <button
              onClick={() => setAddShiny(!addShiny)}
              className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                addShiny
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icons.Sparkles className="h-4 w-4" />
              {addShiny ? "Yes" : "No"}
            </button>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

function BoxPokemonDetails({
  pokemon,
  generation,
  boxIndex,
  slotIndex,
  saveData,
  onDataChange,
  onRemove,
}: {
  pokemon: Pokemon;
  generation: number;
  boxIndex: number;
  slotIndex: number;
  saveData: Uint8Array;
  onDataChange: (newData: Uint8Array) => void;
  onRemove: () => void;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState(pokemon.nickname);
  const [isEditingSpecies, setIsEditingSpecies] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [isEditingMoves, setIsEditingMoves] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [editingMoveSlot, setEditingMoveSlot] = useState<number | null>(null);

  const maxPokemon = generation === 1 ? 151 : generation === 2 ? 251 : 386;

  const handleSaveNickname = useCallback(() => {
    if (!editNickname.trim() || generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const success = setGen3BoxPokemonNickname(newData, boxIndex, slotIndex, editNickname.trim());

    if (success) {
      onDataChange(newData);
      setIsEditingNickname(false);
    }
  }, [saveData, generation, boxIndex, slotIndex, editNickname, onDataChange]);

  const handleChangeSpecies = useCallback((newSpecies: number) => {
    if (generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const success = setGen3BoxPokemonSpecies(newData, boxIndex, slotIndex, newSpecies);

    if (success) {
      onDataChange(newData);
      setIsEditingSpecies(false);
      setSpeciesSearch("");
    }
  }, [saveData, generation, boxIndex, slotIndex, onDataChange]);

  const handleToggleShiny = useCallback(() => {
    if (generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const success = toggleGen3BoxShiny(newData, boxIndex, slotIndex);

    if (success) {
      onDataChange(newData);
    }
  }, [saveData, generation, boxIndex, slotIndex, onDataChange]);

  const handleSetMove = useCallback((slot: number, moveId: number) => {
    if (generation !== 3) return;

    const newData = new Uint8Array(saveData);
    const moves: [number, number, number, number] = [...pokemon.moves] as [number, number, number, number];
    while (moves.length < 4) moves.push(0);
    moves[slot] = moveId;

    const success = setGen3BoxPokemonMoves(newData, boxIndex, slotIndex, moves);

    if (success) {
      onDataChange(newData);
      setEditingMoveSlot(null);
      setMoveSearch("");
    }
  }, [saveData, generation, boxIndex, slotIndex, pokemon.moves, onDataChange]);

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

  // Get legal moves for this Pokemon (from learnset or fallback to common TMs)
  const legalMoveIds = GEN3_LEARNSETS[pokemon.species] || GEN3_LEARNSETS[0] || [];

  // Filter moves - only show legal moves for this Pokemon
  const filteredMoves = Object.entries(MOVE_NAMES)
    .filter(([id, name]) => {
      const moveId = parseInt(id);
      if (moveId === 0 || moveId > 354) return false;
      // Only show moves this Pokemon can learn
      if (!legalMoveIds.includes(moveId)) return false;
      if (!moveSearch) return true; // Show all legal moves when no search
      return name.toLowerCase().includes(moveSearch.toLowerCase()) ||
        id.includes(moveSearch);
    })
    .sort((a, b) => a[1].localeCompare(b[1])) // Sort alphabetically
    .slice(0, moveSearch ? 15 : 30); // Show more results when browsing

  const applyPreset = async (presetType: string, evPreset?: EVPresetName) => {
    if (generation !== 3) return;

    setIsApplying(true);
    const newData = new Uint8Array(saveData);
    let success = false;

    switch (presetType) {
      case "maxIVs":
        success = setGen3BoxPokemonIVs(newData, boxIndex, slotIndex, {
          hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31,
        });
        break;
      case "evPreset":
        if (evPreset) {
          success = setGen3BoxPokemonEVs(newData, boxIndex, slotIndex, EV_PRESETS[evPreset]);
        }
        break;
      case "level100":
        success = setGen3BoxPokemonLevel(newData, boxIndex, slotIndex, 100);
        break;
      case "perfectPhysical":
        success = setGen3BoxPokemonIVs(newData, boxIndex, slotIndex, {
          hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31,
        });
        if (success) {
          success = setGen3BoxPokemonEVs(newData, boxIndex, slotIndex, EV_PRESETS.physicalSweeper);
        }
        if (success) {
          success = setGen3BoxPokemonLevel(newData, boxIndex, slotIndex, 100);
        }
        break;
      case "perfectSpecial":
        success = setGen3BoxPokemonIVs(newData, boxIndex, slotIndex, {
          hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31,
        });
        if (success) {
          success = setGen3BoxPokemonEVs(newData, boxIndex, slotIndex, EV_PRESETS.specialSweeper);
        }
        if (success) {
          success = setGen3BoxPokemonLevel(newData, boxIndex, slotIndex, 100);
        }
        break;
      case "perfectTank":
        success = setGen3BoxPokemonIVs(newData, boxIndex, slotIndex, {
          hp: 31, attack: 31, defense: 31, speed: 31, spAttack: 31, spDefense: 31,
        });
        if (success) {
          success = setGen3BoxPokemonEVs(newData, boxIndex, slotIndex, EV_PRESETS.physicalTank);
        }
        if (success) {
          success = setGen3BoxPokemonLevel(newData, boxIndex, slotIndex, 100);
        }
        break;
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
            onClick={() => generation === 3 && setIsEditingSpecies(!isEditingSpecies)}
            className={`flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors ${
              generation === 3 ? "hover:bg-primary/20 cursor-pointer" : ""
            }`}
            title={generation === 3 ? "Click to change species" : "Species editing requires Gen 3"}
          >
            <span className="text-2xl font-bold text-primary">
              #{pokemon.species.toString().padStart(3, "0")}
            </span>
          </button>
          <div>
            {isEditingNickname && generation === 3 ? (
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
                className={`text-lg font-bold text-foreground flex items-center gap-2 ${
                  generation === 3 ? "cursor-pointer hover:text-primary transition-colors" : ""
                }`}
                onClick={() => generation === 3 && setIsEditingNickname(true)}
                title={generation === 3 ? "Click to edit nickname" : ""}
              >
                {pokemon.nickname}
                {generation === 3 && <Icons.Pencil className="h-4 w-4 opacity-50" />}
                {pokemon.isShiny && (
                  <Icons.Sparkles className="h-5 w-5 text-yellow-500" />
                )}
              </h3>
            )}
            <p className="text-muted-foreground">{pokemon.speciesName}</p>
            <p className="text-sm text-muted-foreground">Level {pokemon.level}</p>
            {generation === 3 && pokemon.nature !== undefined && (
              <p className="text-sm text-muted-foreground">
                {NATURE_NAMES[pokemon.nature]} Nature
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Shiny Toggle (Gen 3 only) */}
          {generation === 3 && (
            <button
              onClick={handleToggleShiny}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pokemon.isShiny
                  ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title={pokemon.isShiny ? "Remove shiny" : "Make shiny"}
            >
              <Icons.Sparkles className="h-4 w-4" />
              {pokemon.isShiny ? "Shiny" : "Make Shiny"}
            </button>
          )}

          {/* Remove Pokemon (Gen 3 only) */}
          {generation === 3 && (
            <button
              onClick={onRemove}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
              title="Remove from PC"
            >
              <Icons.Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Species Changer */}
      {isEditingSpecies && generation === 3 && (
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
            <div className="mt-2 grid gap-1 max-h-48 overflow-y-auto">
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

      {/* Stat Presets (Gen 3 only) */}
      {generation === 3 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icons.Zap className="h-4 w-4 text-primary" />
            Stat Presets
          </h4>

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
                Physical
              </button>
              <button
                onClick={() => applyPreset("perfectSpecial")}
                disabled={isApplying}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Icons.Wand className="h-4 w-4" />
                Special
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
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* IVs */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            IVs {generation >= 3 ? "(0-31)" : "(0-15)"}
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">HP</span>
              <span className="font-medium text-foreground">{pokemon.ivs.hp}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">ATK</span>
              <span className="font-medium text-foreground">{pokemon.ivs.attack}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">DEF</span>
              <span className="font-medium text-foreground">{pokemon.ivs.defense}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">SPD</span>
              <span className="font-medium text-foreground">{pokemon.ivs.speed}</span>
            </div>
            {generation >= 3 ? (
              <>
                <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                  <span className="text-muted-foreground">SPA</span>
                  <span className="font-medium text-foreground">{pokemon.ivs.spAttack}</span>
                </div>
                <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                  <span className="text-muted-foreground">SPD</span>
                  <span className="font-medium text-foreground">{pokemon.ivs.spDefense}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">SPC</span>
                <span className="font-medium text-foreground">{pokemon.ivs.special}</span>
              </div>
            )}
          </div>
        </div>

        {/* EVs */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            EVs {generation >= 3 ? "(0-255)" : "(0-65535)"}
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">HP</span>
              <span className="font-medium text-foreground">{pokemon.evs.hp}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">ATK</span>
              <span className="font-medium text-foreground">{pokemon.evs.attack}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">DEF</span>
              <span className="font-medium text-foreground">{pokemon.evs.defense}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
              <span className="text-muted-foreground">SPD</span>
              <span className="font-medium text-foreground">{pokemon.evs.speed}</span>
            </div>
            {generation >= 3 ? (
              <>
                <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                  <span className="text-muted-foreground">SPA</span>
                  <span className="font-medium text-foreground">{pokemon.evs.spAttack}</span>
                </div>
                <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                  <span className="text-muted-foreground">SPD</span>
                  <span className="font-medium text-foreground">{pokemon.evs.spDefense}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">SPC</span>
                <span className="font-medium text-foreground">{pokemon.evs.special}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moves (Gen 3 editable) */}
      {pokemon.moves && pokemon.moves.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Moves</h4>
            {generation === 3 && (
              <button
                onClick={() => setIsEditingMoves(!isEditingMoves)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Icons.Pencil className="h-3 w-3" />
                {isEditingMoves ? "Done" : "Edit Moves"}
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => {
              const moveId = pokemon.moves[index] || 0;
              return (
                <div key={index}>
                  {isEditingMoves && generation === 3 && editingMoveSlot === index ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-2">
                      <div className="relative">
                        <Icons.Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <input
                          type="text"
                          value={moveSearch}
                          onChange={(e) => setMoveSearch(e.target.value)}
                          placeholder="Search move..."
                          className="w-full rounded border border-border bg-background pl-7 pr-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          autoFocus
                        />
                      </div>
                      {filteredMoves.length > 0 ? (
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border bg-card">
                          {filteredMoves.map(([id, name]) => (
                            <button
                              key={id}
                              onClick={() => handleSetMove(index, parseInt(id))}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50 last:border-b-0"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {moveSearch ? "No matching moves found" : "No learnable moves available"}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setEditingMoveSlot(null);
                          setMoveSearch("");
                        }}
                        className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (isEditingMoves && generation === 3) {
                          setEditingMoveSlot(index);
                          setMoveSearch("");
                        }
                      }}
                      disabled={!isEditingMoves || generation !== 3}
                      className={`flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 transition-colors ${
                        isEditingMoves && generation === 3 ? "hover:bg-primary/10 cursor-pointer" : ""
                      }`}
                    >
                      <span className="font-medium text-foreground text-sm">
                        {moveId > 0 ? (MOVE_NAMES[moveId] || `Move ${moveId}`) : "(Empty)"}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OT Info */}
      {pokemon.otName && (
        <div className="flex gap-4 text-sm">
          <div className="rounded bg-muted/50 px-3 py-1.5">
            <span className="text-muted-foreground">OT: </span>
            <span className="font-medium text-foreground">{pokemon.otName}</span>
          </div>
          <div className="rounded bg-muted/50 px-3 py-1.5">
            <span className="text-muted-foreground">ID: </span>
            <span className="font-medium text-foreground">
              {pokemon.otId.toString().padStart(5, "0")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
