"use client";

import { Icons } from "@/components/icons";
import {
  type AchievementDefinition,
  RARITY_COLORS,
} from "@/lib/gamehub/achievements";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  unlockedAt?: Date;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function AchievementBadge({
  achievement,
  isUnlocked,
  unlockedAt,
  size = "md",
  showDetails = true,
}: AchievementBadgeProps) {
  const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
    achievement.icon
  ] || Icons.Award;

  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const isSecret = achievement.isSecret && !isUnlocked;

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all",
        isUnlocked
          ? RARITY_COLORS[achievement.rarity]
          : "bg-muted/30 border-border opacity-50 grayscale",
        sizeClasses[size]
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 rounded-lg p-2",
            isUnlocked ? "bg-background/50" : "bg-muted"
          )}
        >
          {isSecret ? (
            <Icons.Lock className={cn(iconSizes[size], "text-foreground/60")} />
          ) : (
            <IconComponent
              className={cn(
                iconSizes[size],
                isUnlocked ? "" : "text-foreground/60"
              )}
            />
          )}
        </div>

        {showDetails && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn("font-medium truncate", size === "sm" && "text-sm")}>
                {isSecret ? "???" : achievement.name}
              </h4>
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] rounded uppercase font-medium",
                  RARITY_COLORS[achievement.rarity]
                )}
              >
                {achievement.rarity}
              </span>
            </div>
            <p
              className={cn(
                "text-foreground/60 line-clamp-2",
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              {isSecret ? "Complete a secret challenge to unlock" : achievement.description}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-foreground/60">
                {achievement.points} pts
              </span>
              {isUnlocked && unlockedAt && (
                <span className="text-xs text-foreground/60">
                  Unlocked {new Date(unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {isUnlocked && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-green-500 rounded-full p-0.5">
            <Icons.Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
