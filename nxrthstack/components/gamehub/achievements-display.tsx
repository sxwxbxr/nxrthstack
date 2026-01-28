"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { AchievementBadge } from "./achievement-badge";
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementCategory,
  type AchievementDefinition,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  calculateTotalPoints,
} from "@/lib/gamehub/achievements";
import { cn } from "@/lib/utils";

interface UserAchievementData {
  achievementKey: string;
  unlockedAt: Date;
}

interface AchievementsDisplayProps {
  userAchievements: UserAchievementData[];
}

const categories: (AchievementCategory | "all")[] = [
  "all",
  "general",
  "pokemon",
  "r6",
  "minecraft",
];

export function AchievementsDisplay({ userAchievements }: AchievementsDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const unlockedKeys = userAchievements.map((ua) => ua.achievementKey);
  const totalPoints = calculateTotalPoints(unlockedKeys);
  const totalPossiblePoints = ACHIEVEMENT_DEFINITIONS.reduce((sum, a) => sum + a.points, 0);

  const filteredAchievements = ACHIEVEMENT_DEFINITIONS.filter((achievement) => {
    if (selectedCategory !== "all" && achievement.category !== selectedCategory) {
      return false;
    }
    if (showUnlockedOnly && !unlockedKeys.includes(achievement.key)) {
      return false;
    }
    return true;
  });

  const getUnlockedData = (key: string) => {
    return userAchievements.find((ua) => ua.achievementKey === key);
  };

  const groupedByCategory = filteredAchievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<AchievementCategory, AchievementDefinition[]>);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">{unlockedKeys.length}</div>
          <div className="text-sm text-muted-foreground">Unlocked</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold">{ACHIEVEMENT_DEFINITIONS.length}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Points</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold">
            {Math.round((unlockedKeys.length / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Completion</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {totalPoints} / {totalPossiblePoints} points
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{ width: `${(totalPoints / totalPossiblePoints) * 100}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {category === "all" ? "All" : CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 ml-auto">
          <input
            type="checkbox"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show unlocked only</span>
        </label>
      </div>

      {/* Achievements Grid */}
      {selectedCategory === "all" ? (
        <div className="space-y-8">
          {(Object.keys(groupedByCategory) as AchievementCategory[]).map((category) => (
            <div key={category}>
              <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", CATEGORY_COLORS[category])}>
                <Icons.Award className="h-5 w-5" />
                {CATEGORY_LABELS[category]}
                <span className="text-sm text-muted-foreground font-normal">
                  ({groupedByCategory[category].filter((a) => unlockedKeys.includes(a.key)).length}/
                  {groupedByCategory[category].length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedByCategory[category].map((achievement) => {
                  const unlockedData = getUnlockedData(achievement.key);
                  return (
                    <AchievementBadge
                      key={achievement.key}
                      achievement={achievement}
                      isUnlocked={!!unlockedData}
                      unlockedAt={unlockedData?.unlockedAt}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const unlockedData = getUnlockedData(achievement.key);
            return (
              <AchievementBadge
                key={achievement.key}
                achievement={achievement}
                isUnlocked={!!unlockedData}
                unlockedAt={unlockedData?.unlockedAt}
              />
            );
          })}
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icons.Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No achievements found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
