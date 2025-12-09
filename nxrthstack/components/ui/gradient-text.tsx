"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const GradientText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }}
      className={cn(
        "inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </motion.span>
  );
};
