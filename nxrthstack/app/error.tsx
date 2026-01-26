"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Animated warning stripes */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              hsl(var(--destructive)) 35px,
              hsl(var(--destructive)) 70px
            )`,
          }}
          animate={{
            x: [0, 70],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Pulsing circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-destructive/20"
            initial={{ width: 100, height: 100, opacity: 0.5 }}
            animate={{
              width: [100, 600],
              height: [100, 600],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Animated error icon */}
        <motion.div
          className="mb-8 inline-block"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
        >
          <motion.div
            className="relative"
            animate={{
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-destructive/20 to-orange-500/20 flex items-center justify-center border border-destructive/30">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icons.AlertCircle className="w-16 h-16 text-destructive" />
              </motion.div>
            </div>

            {/* Sparks */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-orange-500"
                style={{
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  x: [0, Math.cos((i * Math.PI * 2) / 6) * 80],
                  y: [0, Math.sin((i * Math.PI * 2) / 6) * 80],
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Error code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.span
            className="inline-block text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-destructive to-orange-500 mb-4"
            animate={{
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            500
          </motion.span>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Something Went Wrong
          </h2>
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            We encountered an unexpected error. Our team has been notified
            and we're working to fix it.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          >
            <Icons.RefreshCw className="w-5 h-5" />
            Try Again
          </motion.button>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Icons.Home className="w-5 h-5" />
              Back to Home
            </motion.button>
          </Link>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="mt-12 pt-8 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <motion.div
              className="w-2 h-2 rounded-full bg-yellow-500"
              animate={{
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            <span>Our systems are being checked</span>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            If this problem persists, please{" "}
            <Link href="/dashboard/gamehub/feedback" className="text-primary hover:underline">
              report it
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
