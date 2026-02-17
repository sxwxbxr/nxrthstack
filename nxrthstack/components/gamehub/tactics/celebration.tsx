"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface CelebrationProps {
  show: boolean;
  type?: "confetti" | "burst" | "shine";
  message?: string;
  subMessage?: string;
  duration?: number;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "bg-yellow-400", "bg-red-400", "bg-blue-400", "bg-green-400",
  "bg-purple-400", "bg-pink-400", "bg-orange-400",
];

export function Celebration({
  show,
  type = "confetti",
  message,
  subMessage,
  duration = 3000,
  onComplete,
}: CelebrationProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Particles */}
          {type === "confetti" && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute w-2 h-2 rounded-sm",
                    CONFETTI_COLORS[i % CONFETTI_COLORS.length]
                  )}
                  initial={{
                    x: `${50 + (Math.random() - 0.5) * 20}%`,
                    y: "-5%",
                    rotate: 0,
                    scale: 1,
                  }}
                  animate={{
                    y: "110%",
                    x: `${50 + (Math.random() - 0.5) * 80}%`,
                    rotate: Math.random() * 720 - 360,
                    scale: Math.random() * 0.5 + 0.5,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 1.5,
                    delay: Math.random() * 0.5,
                    ease: "easeIn",
                  }}
                />
              ))}
            </div>
          )}

          {type === "burst" && (
            <motion.div
              className="absolute w-64 h-64 rounded-full bg-primary/20"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          )}

          {type === "shine" && (
            <motion.div
              className="absolute w-32 h-32 bg-gradient-radial from-yellow-400/30 to-transparent rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          )}

          {/* Message */}
          {message && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center pointer-events-auto"
            >
              <p className="text-3xl font-bold text-foreground drop-shadow-lg">{message}</p>
              {subMessage && (
                <p className="text-lg text-muted-foreground mt-1">{subMessage}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
