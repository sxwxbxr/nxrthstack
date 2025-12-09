"use client";

import { Icons } from "./icons";
import { Spotlight } from "./ui/spotlight";
import { FlipWords } from "./ui/flip-words";
import { ShimmerButton } from "./ui/shimmer-button";
import { AnimatedCounter } from "./ui/animated-counter";
import { FadeIn } from "./ui/fade-in";
import { Magnetic } from "./ui/magnetic";
import { motion } from "motion/react";

export function Hero() {
  const words = ["Web Apps", "Desktop Apps", "Games", "Solutions"];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-background">
      {/* Spotlight effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="hsl(var(--primary))"
      />

      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 [background-size:40px_40px] select-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn delay={0.1}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Icons.code className="h-4 w-4 text-primary" />
              </motion.span>
              <span>Freelance Software Development</span>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Building Digital
              <span className="block text-primary h-[1.2em] relative">
                <FlipWords words={words} className="text-primary" />
              </span>
              That Matter
            </h1>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              From modern web applications to powerful desktop software, I craft
              tailored solutions that help businesses thrive in the digital
              landscape.
            </p>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Magnetic strength={0.2}>
                <ShimmerButton className="group">
                  Start Your Project
                  <Icons.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ShimmerButton>
              </Magnetic>

              <Magnetic strength={0.2}>
                <motion.a
                  href="#services"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur-sm px-6 py-3 text-sm font-semibold transition-all hover:bg-muted hover:border-primary/50"
                >
                  View Services
                </motion.a>
              </Magnetic>
            </div>
          </FadeIn>

          <FadeIn delay={0.8}>
            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="cursor-default"
              >
                <div className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={5} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Years Experience
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="cursor-default"
              >
                <div className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={50} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Projects Delivered
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="cursor-default"
              >
                <div className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={100} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Client Satisfaction
                </div>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
