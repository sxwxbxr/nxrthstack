"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  Strategy,
  strategies,
  getRandomStrategy,
  getStrategiesBySide,
} from "@/lib/r6/strat-roulette-data";

type Side = "attack" | "defense" | "both";
type Difficulty = Strategy["difficulty"] | "all";
type Category = Strategy["category"] | "all";

const difficultyColors: Record<Strategy["difficulty"], string> = {
  easy: "bg-green-500/20 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  hard: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  extreme: "bg-red-500/20 text-red-500 border-red-500/30",
};

const categoryIcons: Record<Strategy["category"], typeof Icons.Zap> = {
  fun: Icons.Sparkles,
  challenge: Icons.Swords,
  teamwork: Icons.Users,
  meme: Icons.Star,
  tactical: Icons.Shield,
};

const categoryColors: Record<Strategy["category"], string> = {
  fun: "text-purple-400",
  challenge: "text-orange-400",
  teamwork: "text-blue-400",
  meme: "text-pink-400",
  tactical: "text-green-400",
};

export function StratRoulette() {
  const [selectedSide, setSelectedSide] = useState<Side>("both");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("all");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningText, setSpinningText] = useState<string>("");
  const [history, setHistory] = useState<Strategy[]>([]);

  const getFilteredStrategies = useCallback(() => {
    let filtered = getStrategiesBySide(selectedSide);

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((s) => s.difficulty === selectedDifficulty);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    return filtered;
  }, [selectedSide, selectedDifficulty, selectedCategory]);

  const spinRoulette = useCallback(() => {
    const filtered = getFilteredStrategies();
    if (filtered.length === 0) return;

    setIsSpinning(true);

    // Spinning animation
    let spinCount = 0;
    const maxSpins = 20;
    const spinInterval = setInterval(() => {
      const randomStrat = filtered[Math.floor(Math.random() * filtered.length)];
      setSpinningText(randomStrat.name);
      spinCount++;

      if (spinCount >= maxSpins) {
        clearInterval(spinInterval);
        const finalStrategy = filtered[Math.floor(Math.random() * filtered.length)];
        setCurrentStrategy(finalStrategy);
        setHistory((prev) => [finalStrategy, ...prev.slice(0, 4)]);
        setIsSpinning(false);
      }
    }, 100);
  }, [getFilteredStrategies]);

  const filteredCount = getFilteredStrategies().length;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Side Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Side</label>
          <div className="flex gap-2">
            {(["both", "attack", "defense"] as Side[]).map((side) => (
              <button
                key={side}
                onClick={() => setSelectedSide(side)}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  selectedSide === side
                    ? side === "attack"
                      ? "bg-orange-500/20 text-orange-500 border border-orange-500/30"
                      : side === "defense"
                        ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    : "bg-card text-muted-foreground border border-border hover:bg-accent"
                )}
              >
                {side === "both" ? "Any" : side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {(["all", "easy", "medium", "hard", "extreme"] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
                  selectedDifficulty === diff
                    ? diff === "all"
                      ? "bg-primary/20 text-primary border-primary/30"
                      : difficultyColors[diff]
                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                )}
              >
                {diff === "all" ? "All" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Category</label>
          <div className="flex flex-wrap gap-2">
            {(["all", "fun", "challenge", "teamwork", "meme", "tactical"] as Category[]).map(
              (cat) => {
                const Icon = cat !== "all" ? categoryIcons[cat] : Icons.Shuffle;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
                      selectedCategory === cat
                        ? "bg-card border-primary/50"
                        : "bg-card text-muted-foreground border-border hover:bg-accent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5",
                        selectedCategory === cat && cat !== "all" && categoryColors[cat]
                      )}
                    />
                    {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {filteredCount} strategies available
        </p>
        <ShimmerButton
          onClick={spinRoulette}
          disabled={isSpinning || filteredCount === 0}
          className="px-8 py-4 text-lg"
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <Icons.Loader2 className="w-5 h-5 animate-spin" />
              {spinningText}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Icons.Shuffle className="w-5 h-5" />
              Spin the Roulette
            </span>
          )}
        </ShimmerButton>
      </div>

      {/* Current Strategy Display */}
      <AnimatePresence mode="wait">
        {currentStrategy && !isSpinning && (
          <motion.div
            key={currentStrategy.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium border",
                      currentStrategy.side === "attack"
                        ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
                        : currentStrategy.side === "defense"
                          ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                          : "bg-purple-500/20 text-purple-500 border-purple-500/30"
                    )}
                  >
                    {currentStrategy.side === "both"
                      ? "Any Side"
                      : currentStrategy.side.charAt(0).toUpperCase() + currentStrategy.side.slice(1)}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium border",
                      difficultyColors[currentStrategy.difficulty]
                    )}
                  >
                    {currentStrategy.difficulty.charAt(0).toUpperCase() +
                      currentStrategy.difficulty.slice(1)}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {currentStrategy.name}
                </h2>
              </div>
              <div
                className={cn(
                  "p-3 rounded-xl bg-card/50",
                  categoryColors[currentStrategy.category]
                )}
              >
                {(() => {
                  const Icon = categoryIcons[currentStrategy.category];
                  return <Icon className="w-8 h-8" />;
                })()}
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {currentStrategy.description}
            </p>

            {/* Restrictions */}
            {currentStrategy.restrictions && currentStrategy.restrictions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Icons.AlertCircle className="w-4 h-4 text-yellow-500" />
                  Rules & Restrictions
                </h3>
                <ul className="space-y-2">
                  {currentStrategy.restrictions.map((restriction, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {currentStrategy.tips && currentStrategy.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <Icons.Info className="w-4 h-4" />
                  Tips
                </h3>
                <ul className="space-y-1">
                  {currentStrategy.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <Icons.ChevronRight className="w-3 h-3 text-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icons.Clock className="w-4 h-4" />
            Recent Strategies
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.map((strat, index) => (
              <button
                key={`${strat.id}-${index}`}
                onClick={() => setCurrentStrategy(strat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:bg-accent",
                  currentStrategy?.id === strat.id
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {strat.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Strategies Browser */}
      <div className="pt-8 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.FileText className="w-5 h-5 text-primary" />
          All Strategies ({strategies.length})
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredStrategies().map((strat) => {
            const CategoryIcon = categoryIcons[strat.category];
            return (
              <button
                key={strat.id}
                onClick={() => setCurrentStrategy(strat)}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all hover:bg-accent group",
                  currentStrategy?.id === strat.id
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {strat.name}
                  </span>
                  <CategoryIcon
                    className={cn("w-4 h-4 flex-shrink-0", categoryColors[strat.category])}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      strat.side === "attack"
                        ? "bg-orange-500/20 text-orange-500"
                        : strat.side === "defense"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-purple-500/20 text-purple-500"
                    )}
                  >
                    {strat.side === "both" ? "Any" : strat.side}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      difficultyColors[strat.difficulty]
                    )}
                  >
                    {strat.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
