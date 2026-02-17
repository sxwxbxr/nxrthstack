"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface DungeonButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function DungeonButton({
  children,
  className,
  onClick,
  type = "button",
  disabled,
  variant = "primary",
  size = "md",
}: DungeonButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tactics-button relative overflow-hidden font-semibold",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-8 py-3 text-base",
        variant === "primary" && "tactics-button-primary",
        variant === "danger" &&
          "border-red-500/50 bg-gradient-to-b from-red-900/60 to-red-950/80 text-red-300",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
