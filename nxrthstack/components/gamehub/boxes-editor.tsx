"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import {
  type SaveData,
  type Pokemon,
  POKEMON_NAMES,
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
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);

  const boxes = parsedSave.boxes;
  const generation = parsedSave.info.generation;

  // Calculate box limits based on generation
  const maxBoxes = generation === 1 ? 12 : generation === 2 ? 14 : 14;
  const pokemonPerBox = generation === 3 ? 30 : 20;

  if (boxes.length === 0) {
    return (
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
    );
  }

  const currentBox = boxes[selectedBox] || [];

  return (
    <div className="space-y-6">
      {/* Box Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              PC Boxes
            </h3>
            <p className="text-sm text-muted-foreground">
              Gen {generation} - {pokemonPerBox} Pokemon per box
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {boxes.reduce((total, box) => total + box.length, 0)} Pokemon stored
            </span>
          </div>
        </div>
      </div>

      {/* Box Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {boxes.map((box, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedBox(index);
              setSelectedPokemon(null);
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
        ))}
      </div>

      {/* Pokemon Grid */}
      {currentBox.length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {currentBox.map((pokemon, index) => (
            <button
              key={index}
              onClick={() => setSelectedPokemon(selectedPokemon === index ? null : index)}
              className={`relative rounded-xl border p-3 text-left transition-colors ${
                selectedPokemon === index
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
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
            </button>
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
          </p>
        </div>
      )}

      {/* Selected Pokemon Details */}
      {selectedPokemon !== null && currentBox[selectedPokemon] && (
        <div className="rounded-xl border border-border bg-card p-6">
          <BoxPokemonDetails
            pokemon={currentBox[selectedPokemon]}
            generation={generation}
          />
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <Icons.Info className="inline h-4 w-4 mr-1" />
          {generation < 3
            ? "Gen 1-2 only shows the currently active box. Box editing features coming soon."
            : "PC Box viewing is available. Full editing features coming soon."}
        </p>
      </div>
    </div>
  );
}

function BoxPokemonDetails({ pokemon, generation }: { pokemon: Pokemon; generation: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-2xl font-bold text-primary">
            #{pokemon.species.toString().padStart(3, "0")}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {pokemon.nickname}
          </h3>
          <p className="text-muted-foreground">{pokemon.speciesName}</p>
          <p className="text-sm text-muted-foreground">Level {pokemon.level}</p>
        </div>
      </div>

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
