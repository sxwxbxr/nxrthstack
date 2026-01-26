"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import {
  GAME_TEMPLATES,
  STARTER_OPTIONS,
  createNewSave,
  getSaveFileExtension,
  type GameTemplate,
} from "@/lib/pokemon/save-detector";

interface NewSaveCreatorProps {
  onSaveCreated: (saveData: Uint8Array, gameId: string) => void;
  onCancel: () => void;
}

export function NewSaveCreator({ onSaveCreated, onCancel }: NewSaveCreatorProps) {
  const [step, setStep] = useState<"game" | "details" | "starter">("game");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [trainerGender, setTrainerGender] = useState<0 | 1>(0);
  const [selectedStarter, setSelectedStarter] = useState<number | null>(null);
  const [money, setMoney] = useState(3000);
  const [isCreating, setIsCreating] = useState(false);

  const selectedTemplate = selectedGame
    ? GAME_TEMPLATES.find((t) => t.id === selectedGame)
    : null;

  const starterOptions = selectedGame ? STARTER_OPTIONS[selectedGame] || [] : [];

  const handleCreateSave = () => {
    if (!selectedGame || !trainerName.trim()) return;

    setIsCreating(true);

    const saveData = createNewSave({
      gameId: selectedGame,
      trainerName: trainerName.trim().substring(0, 7),
      trainerGender,
      money,
      starterPokemon: selectedStarter || undefined,
    });

    if (saveData) {
      onSaveCreated(saveData, selectedGame);
    }

    setIsCreating(false);
  };

  const handleDownloadOnly = () => {
    if (!selectedGame || !trainerName.trim()) return;

    setIsCreating(true);

    const saveData = createNewSave({
      gameId: selectedGame,
      trainerName: trainerName.trim().substring(0, 7),
      trainerGender,
      money,
      starterPokemon: selectedStarter || undefined,
    });

    if (saveData) {
      // Download the file - create new ArrayBuffer from Uint8Array
      const buffer = new ArrayBuffer(saveData.length);
      new Uint8Array(buffer).set(saveData);
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const ext = getSaveFileExtension(selectedGame);
      const filename = `${trainerName.trim()}_${selectedGame}${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setIsCreating(false);
  };

  // Group games by generation
  const gen1Games = GAME_TEMPLATES.filter((t) => t.generation === 1);
  const gen2Games = GAME_TEMPLATES.filter((t) => t.generation === 2);
  const gen3Games = GAME_TEMPLATES.filter((t) => t.generation === 3);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Icons.Plus className="h-5 w-5 text-primary" />
          Create New Save File
        </h2>
        <button
          onClick={onCancel}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Icons.Close className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        {["game", "details", "starter"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < ["game", "details", "starter"].indexOf(step)
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < ["game", "details", "starter"].indexOf(step) ? (
                <Icons.Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`h-0.5 w-8 ${
                  i < ["game", "details", "starter"].indexOf(step)
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === "game" && "Select Game"}
          {step === "details" && "Trainer Details"}
          {step === "starter" && "Starter Pokemon"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Game */}
        {step === "game" && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Gen 3 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                  3
                </span>
                Generation 3 (GBA)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {gen3Games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedGame === game.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Icons.Gamepad className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.platform} - {(game.fileSize / 1024).toFixed(0)}KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gen 2 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold">
                  2
                </span>
                Generation 2 (GBC)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {gen2Games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedGame === game.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                      <Icons.Gamepad className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.platform} - {(game.fileSize / 1024).toFixed(0)}KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gen 1 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                  1
                </span>
                Generation 1 (GB/GBC)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {gen1Games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedGame === game.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                      <Icons.Gamepad className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.platform} - {(game.fileSize / 1024).toFixed(0)}KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep("details")}
                disabled={!selectedGame}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Next
                <Icons.ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Trainer Details */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-foreground">
                Creating save for:{" "}
                <span className="font-semibold">{selectedTemplate?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Trainer Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trainer Name (max 7 characters)
                </label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value.substring(0, 7))}
                  placeholder="RED"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {trainerName.length}/7 characters
                </p>
              </div>

              {/* Gender (for games that support it) */}
              {selectedTemplate?.generation === 3 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trainer Gender
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTrainerGender(0)}
                      className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                        trainerGender === 0
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border bg-card hover:border-blue-500/50"
                      }`}
                    >
                      <Icons.User className={`mx-auto h-6 w-6 mb-1 ${trainerGender === 0 ? "text-blue-500" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${trainerGender === 0 ? "text-blue-500" : "text-foreground"}`}>Male</span>
                    </button>
                    <button
                      onClick={() => setTrainerGender(1)}
                      className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                        trainerGender === 1
                          ? "border-pink-500 bg-pink-500/10"
                          : "border-border bg-card hover:border-pink-500/50"
                      }`}
                    >
                      <Icons.User className={`mx-auto h-6 w-6 mb-1 ${trainerGender === 1 ? "text-pink-500" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${trainerGender === 1 ? "text-pink-500" : "text-foreground"}`}>Female</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Starting Money */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Starting Money
                </label>
                <input
                  type="number"
                  value={money}
                  onChange={(e) =>
                    setMoney(Math.max(0, Math.min(999999, parseInt(e.target.value) || 0)))
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Max: 999,999
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("game")}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Icons.ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <button
                onClick={() => setStep("starter")}
                disabled={!trainerName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Next
                <Icons.ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Starter Pokemon */}
        {step === "starter" && (
          <motion.div
            key="starter"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-foreground">
                Trainer: <span className="font-semibold">{trainerName}</span> |{" "}
                {selectedTemplate?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Starter Pokemon (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Start your adventure with a Pokemon, or leave empty for a blank save.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* No Starter Option */}
                <button
                  onClick={() => setSelectedStarter(null)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    selectedStarter === null
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Icons.Close className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">No Starter</span>
                  <span className="text-xs text-muted-foreground">Empty party</span>
                </button>

                {/* Starter Options */}
                {starterOptions.map((starter) => (
                  <button
                    key={starter.species}
                    onClick={() => setSelectedStarter(starter.species)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                      selectedStarter === starter.species
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl font-bold text-primary">
                        {starter.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{starter.name}</span>
                    <span className="text-xs text-muted-foreground">
                      #{starter.species.toString().padStart(3, "0")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-muted-foreground">
                <Icons.Info className="inline h-4 w-4 mr-1 text-yellow-500" />
                {selectedTemplate?.generation === 3
                  ? "Gen 3 saves work with most GBA emulators (mGBA, VBA-M, etc.)"
                  : "Gen 1/2 saves work with most GB/GBC emulators (BGB, SameBoy, etc.)"}
              </p>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep("details")}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Icons.ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadOnly}
                  disabled={isCreating || !trainerName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Icons.Download className="h-4 w-4" />
                  Download Only
                </button>
                <button
                  onClick={handleCreateSave}
                  disabled={isCreating || !trainerName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Check className="h-4 w-4" />
                  )}
                  Create & Edit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
