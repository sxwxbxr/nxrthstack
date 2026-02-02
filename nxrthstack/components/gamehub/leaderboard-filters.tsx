"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { LeaderboardCategory, LeaderboardPeriod } from "@/lib/gamehub/leaderboards";

interface LeaderboardFiltersProps {
  categories: { value: LeaderboardCategory; label: string }[];
  currentCategory: LeaderboardCategory;
  currentPeriod: LeaderboardPeriod;
}

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "all_time", label: "All Time" },
];

export function LeaderboardFilters({
  categories,
  currentCategory,
  currentPeriod,
}: LeaderboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/dashboard/gamehub/leaderboards?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Category Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => updateFilter("category", category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentCategory === category.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Period
        </label>
        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => updateFilter("period", period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPeriod === period.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
