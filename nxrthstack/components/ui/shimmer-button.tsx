"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ShimmerButtonProps {
  children: React.ReactNode;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const ShimmerButton = ({
  children,
  shimmerColor = "var(--primary)",
  shimmerSize = "0.1em",
  shimmerDuration = "2s",
  borderRadius = "100px",
  background = "linear-gradient(180deg, var(--primary) 0%, var(--primary) 100%)",
  className,
  onClick,
  type = "button",
  disabled,
}: ShimmerButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden whitespace-nowrap px-6 py-3 text-primary-foreground font-semibold",
        "[background:var(--bg)] [border-radius:var(--radius)]",
        "transition-all duration-300 hover:shadow-[0_0_40px_8px_rgba(var(--primary-rgb),0.3)]",
        className
      )}
      style={
        {
          "--bg": background,
          "--radius": borderRadius,
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--shimmer-duration": shimmerDuration,
        } as React.CSSProperties
      }
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <span
        className="absolute inset-0 overflow-hidden [border-radius:var(--radius)]"
        style={{ "--radius": borderRadius } as React.CSSProperties}
      >
        <span className="absolute inset-[-100%] animate-shimmer bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] bg-[length:50%_100%]" />
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
