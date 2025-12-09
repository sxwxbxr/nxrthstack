"use client";

import { motion } from "motion/react";
import { FadeIn } from "./ui/fade-in";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <FadeIn>
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-bold tracking-tight">
                Nxrth<span className="text-primary">Stack</span>
              </span>
            </motion.div>

            <nav className="flex gap-6">
              {["Services", "About", "Contact"].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2, color: "var(--primary)" }}
                  className="text-sm text-muted-foreground transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground"
            >
              &copy; {currentYear} NxrthStack. All rights reserved.
            </motion.p>
          </div>
        </div>
      </footer>
    </FadeIn>
  );
}
