"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5"
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Animated 404 */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-[12rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            404
          </motion.h1>

          {/* Glitch effect layers */}
          <motion.h1
            className="absolute inset-0 text-[12rem] font-bold leading-none text-primary/30"
            animate={{
              x: [-2, 2, -2],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            404
          </motion.h1>
          <motion.h1
            className="absolute inset-0 text-[12rem] font-bold leading-none text-pink-500/30"
            animate={{
              x: [2, -2, 2],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
              delay: 0.1,
            }}
          >
            404
          </motion.h1>
        </motion.div>

        {/* Floating astronaut/icon */}
        <motion.div
          className="mb-8"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
            <Icons.Search className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like you've ventured into uncharted territory.
            The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              <Icons.Home className="w-5 h-5" />
              Back to Home
            </motion.button>
          </Link>
          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
            Go Back
          </motion.button>
        </motion.div>

        {/* Helpful links */}
        <motion.div
          className="mt-12 pt-8 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/shop"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Icons.Store className="w-4 h-4" />
              Shop
            </Link>
            <Link
              href="/dashboard"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Icons.LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/gamehub"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Icons.Gamepad className="w-4 h-4" />
              GameHub
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
