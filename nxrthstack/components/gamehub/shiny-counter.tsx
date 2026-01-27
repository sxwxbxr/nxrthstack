"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface ShinyHunt {
  id: string;
  pokemon: string;
  method: string;
  encounters: number;
  odds: number;
  startedAt: string;
  foundAt?: string;
  isActive: boolean;
}

const HUNTING_METHODS = [
  { name: "Random Encounter", odds: 8192, gen: "1-5" },
  { name: "Random Encounter (Gen 6+)", odds: 4096, gen: "6+" },
  { name: "Masuda Method", odds: 683, gen: "5+" },
  { name: "Masuda Method (Gen 4)", odds: 1638, gen: "4" },
  { name: "Chain Fishing", odds: 100, gen: "6" },
  { name: "Poke Radar (40 chain)", odds: 200, gen: "4/6" },
  { name: "Friend Safari", odds: 819, gen: "6" },
  { name: "DexNav (100+ chain)", odds: 512, gen: "ORAS" },
  { name: "SOS Chain (31+)", odds: 315, gen: "7" },
  { name: "Shiny Charm + Random", odds: 2731, gen: "5+" },
  { name: "Shiny Charm + Masuda", odds: 512, gen: "5+" },
  { name: "Dynamax Adventures", odds: 100, gen: "SwSh" },
  { name: "Mass Outbreak", odds: 158, gen: "PLA" },
  { name: "Sandwich + Sparkling Power 3", odds: 512, gen: "SV" },
  { name: "Custom", odds: 4096, gen: "Any" },
];

const STORAGE_KEY = "pokemon-shiny-hunts";

export function ShinyCounter() {
  const [hunts, setHunts] = useState<ShinyHunt[]>([]);
  const [activeHunt, setActiveHunt] = useState<ShinyHunt | null>(null);
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [newPokemon, setNewPokemon] = useState("");
  const [newMethod, setNewMethod] = useState(HUNTING_METHODS[0].name);
  const [customOdds, setCustomOdds] = useState("4096");
  const [showHistory, setShowHistory] = useState(false);

  // Load hunts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ShinyHunt[];
        setHunts(parsed);
        const active = parsed.find((h) => h.isActive);
        if (active) setActiveHunt(active);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save hunts to localStorage
  const saveHunts = useCallback((newHunts: ShinyHunt[]) => {
    setHunts(newHunts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHunts));
  }, []);

  // Start a new hunt
  const startHunt = () => {
    if (!newPokemon.trim()) return;

    const method = HUNTING_METHODS.find((m) => m.name === newMethod);
    const odds =
      newMethod === "Custom"
        ? parseInt(customOdds) || 4096
        : method?.odds || 4096;

    const newHunt: ShinyHunt = {
      id: Date.now().toString(),
      pokemon: newPokemon.trim(),
      method: newMethod,
      encounters: 0,
      odds,
      startedAt: new Date().toISOString(),
      isActive: true,
    };

    // Deactivate current active hunt if any
    const updatedHunts = hunts.map((h) =>
      h.isActive ? { ...h, isActive: false } : h
    );

    saveHunts([newHunt, ...updatedHunts]);
    setActiveHunt(newHunt);
    setShowNewHunt(false);
    setNewPokemon("");
  };

  // Increment counter
  const incrementCounter = (amount: number = 1) => {
    if (!activeHunt) return;

    const updated = {
      ...activeHunt,
      encounters: Math.max(0, activeHunt.encounters + amount),
    };
    setActiveHunt(updated);
    saveHunts(hunts.map((h) => (h.id === activeHunt.id ? updated : h)));
  };

  // Mark shiny found
  const markFound = () => {
    if (!activeHunt) return;

    const updated = {
      ...activeHunt,
      isActive: false,
      foundAt: new Date().toISOString(),
    };
    setActiveHunt(null);
    saveHunts(hunts.map((h) => (h.id === activeHunt.id ? updated : h)));
  };

  // Resume a hunt
  const resumeHunt = (hunt: ShinyHunt) => {
    // Deactivate current active hunt
    const updatedHunts = hunts.map((h) => {
      if (h.id === hunt.id) return { ...h, isActive: true };
      if (h.isActive) return { ...h, isActive: false };
      return h;
    });
    saveHunts(updatedHunts);
    setActiveHunt({ ...hunt, isActive: true });
    setShowHistory(false);
  };

  // Delete a hunt
  const deleteHunt = (huntId: string) => {
    const filtered = hunts.filter((h) => h.id !== huntId);
    saveHunts(filtered);
    if (activeHunt?.id === huntId) setActiveHunt(null);
  };

  // Reset counter
  const resetCounter = () => {
    if (!activeHunt) return;
    const updated = { ...activeHunt, encounters: 0 };
    setActiveHunt(updated);
    saveHunts(hunts.map((h) => (h.id === activeHunt.id ? updated : h)));
  };

  // Calculate probability
  const calculateProbability = (encounters: number, odds: number): number => {
    return (1 - Math.pow(1 - 1 / odds, encounters)) * 100;
  };

  const selectedMethod = HUNTING_METHODS.find((m) => m.name === newMethod);
  const completedHunts = hunts.filter((h) => h.foundAt);
  const abandonedHunts = hunts.filter((h) => !h.foundAt && !h.isActive);

  return (
    <div className="space-y-6">
      {/* Active Hunt Display */}
      {activeHunt ? (
        <div className="rounded-xl border border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Icons.Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {activeHunt.pokemon}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeHunt.method} (1/{activeHunt.odds})
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewHunt(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Switch Hunt
            </button>
          </div>

          {/* Counter Display */}
          <div className="text-center py-8">
            <div className="text-7xl font-bold text-foreground tabular-nums">
              {activeHunt.encounters.toLocaleString()}
            </div>
            <p className="mt-2 text-muted-foreground">Encounters</p>
          </div>

          {/* Probability Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Probability</span>
              <span className="font-medium text-foreground">
                {calculateProbability(
                  activeHunt.encounters,
                  activeHunt.odds
                ).toFixed(2)}
                %
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    calculateProbability(activeHunt.encounters, activeHunt.odds)
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeHunt.encounters >= activeHunt.odds
                ? `Over odds by ${(activeHunt.encounters - activeHunt.odds).toLocaleString()} encounters`
                : `${(activeHunt.odds - activeHunt.encounters).toLocaleString()} encounters until odds`}
            </p>
          </div>

          {/* Counter Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <button
              onClick={() => incrementCounter(-1)}
              className="rounded-lg border border-border bg-background p-4 text-xl font-bold text-foreground hover:bg-accent transition-colors"
            >
              -1
            </button>
            <button
              onClick={() => incrementCounter(1)}
              className="rounded-lg border border-primary bg-primary/10 p-4 text-xl font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => incrementCounter(5)}
              className="rounded-lg border border-border bg-background p-4 text-xl font-bold text-foreground hover:bg-accent transition-colors"
            >
              +5
            </button>
            <button
              onClick={() => incrementCounter(10)}
              className="rounded-lg border border-border bg-background p-4 text-xl font-bold text-foreground hover:bg-accent transition-colors"
            >
              +10
            </button>
            <button
              onClick={() => incrementCounter(30)}
              className="rounded-lg border border-border bg-background p-4 text-xl font-bold text-foreground hover:bg-accent transition-colors"
            >
              +30
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <ShimmerButton onClick={markFound} className="flex-1">
              <Icons.Sparkles className="h-4 w-4 mr-2" />
              Found Shiny!
            </ShimmerButton>
            <button
              onClick={resetCounter}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground hover:bg-accent transition-colors"
            >
              <Icons.RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Hunt Stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium text-foreground">
                {new Date(activeHunt.startedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Odds</p>
              <p className="font-medium text-foreground">1/{activeHunt.odds}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Icons.Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Active Hunt
          </h3>
          <p className="text-muted-foreground mb-4">
            Start a new shiny hunt to begin tracking your encounters
          </p>
          <ShimmerButton onClick={() => setShowNewHunt(true)}>
            <Icons.Plus className="h-4 w-4 mr-2" />
            Start New Hunt
          </ShimmerButton>
        </div>
      )}

      {/* New Hunt Form */}
      {showNewHunt && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              New Shiny Hunt
            </h3>
            <button
              onClick={() => setShowNewHunt(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.Close className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Pokemon Name
              </label>
              <input
                type="text"
                value={newPokemon}
                onChange={(e) => setNewPokemon(e.target.value)}
                placeholder="e.g., Charizard"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hunting Method
              </label>
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              >
                {HUNTING_METHODS.map((method) => (
                  <option key={method.name} value={method.name}>
                    {method.name} (1/{method.odds}) - {method.gen}
                  </option>
                ))}
              </select>
            </div>

            {newMethod === "Custom" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Custom Odds (1/X)
                </label>
                <input
                  type="number"
                  value={customOdds}
                  onChange={(e) => setCustomOdds(e.target.value)}
                  min="1"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {selectedMethod && newMethod !== "Custom" && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {selectedMethod.name}
                  </span>{" "}
                  has base odds of 1/{selectedMethod.odds} in{" "}
                  {selectedMethod.gen} games.
                </p>
              </div>
            )}

            <ShimmerButton
              onClick={startHunt}
              disabled={!newPokemon.trim()}
              className="w-full"
            >
              <Icons.Sparkles className="h-4 w-4 mr-2" />
              Start Hunt
            </ShimmerButton>
          </div>
        </div>
      )}

      {/* Hunt History Toggle */}
      {hunts.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Icons.ChevronDown
            className={`h-4 w-4 transition-transform ${showHistory ? "rotate-180" : ""}`}
          />
          {showHistory ? "Hide" : "Show"} Hunt History ({hunts.length})
        </button>
      )}

      {/* Hunt History */}
      {showHistory && hunts.length > 0 && (
        <div className="space-y-4">
          {/* Completed Hunts */}
          {completedHunts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Icons.Sparkles className="h-4 w-4 text-yellow-500" />
                Shinies Found ({completedHunts.length})
              </h4>
              <div className="space-y-2">
                {completedHunts.map((hunt) => (
                  <div
                    key={hunt.id}
                    className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {hunt.pokemon}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hunt.encounters.toLocaleString()} encounters •{" "}
                        {hunt.method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-500">
                        {hunt.foundAt &&
                          new Date(hunt.foundAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteHunt(hunt.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abandoned/Paused Hunts */}
          {abandonedHunts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Paused Hunts ({abandonedHunts.length})
              </h4>
              <div className="space-y-2">
                {abandonedHunts.map((hunt) => (
                  <div
                    key={hunt.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {hunt.pokemon}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hunt.encounters.toLocaleString()} encounters •{" "}
                        {hunt.method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resumeHunt(hunt)}
                        className="rounded px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => deleteHunt(hunt.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {completedHunts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Shiny Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {completedHunts.length}
              </p>
              <p className="text-sm text-muted-foreground">Shinies Found</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {completedHunts
                  .reduce((sum, h) => sum + h.encounters, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Encounters</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {Math.round(
                  completedHunts.reduce((sum, h) => sum + h.encounters, 0) /
                    completedHunts.length
                ).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Encounters</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {Math.min(...completedHunts.map((h) => h.encounters))}
              </p>
              <p className="text-sm text-muted-foreground">Luckiest Hunt</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
