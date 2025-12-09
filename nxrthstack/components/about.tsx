"use client";

import { Icons } from "./icons";
import { FadeIn, StaggerContainer, StaggerItem } from "./ui/fade-in";
import { motion } from "motion/react";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { Zap, Users, Rocket, Code } from "lucide-react";

const reasons = [
  {
    icon: Users,
    title: "Direct Communication",
    description:
      "Work directly with me throughout your project. No account managers, no middlemen - just clear, efficient collaboration.",
  },
  {
    icon: Zap,
    title: "Quality Focused",
    description:
      "Every line of code is written with care. I prioritize clean architecture, maintainability, and performance.",
  },
  {
    icon: Rocket,
    title: "End-to-End Delivery",
    description:
      "From initial concept to deployment and beyond. I handle the full development lifecycle so you can focus on your business.",
  },
  {
    icon: Code,
    title: "Modern Stack",
    description:
      "Built with the latest technologies and best practices. Your project will be future-proof and easy to scale.",
  },
];

const technologies = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "PostgreSQL",
  "Rust",
  "Electron",
];

export function About() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <FadeIn>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-block text-sm font-semibold uppercase tracking-widest text-primary"
              >
                About
              </motion.span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Why Work With Me
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                As a freelance developer, I bring a personal touch to every
                project. You get dedicated attention, flexible collaboration,
                and solutions crafted specifically for your needs.
              </p>
            </FadeIn>

            <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-2" staggerDelay={0.15}>
              {reasons.map((reason) => (
                <StaggerItem key={reason.title}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex gap-4 p-4 rounded-xl transition-colors hover:bg-card/50"
                  >
                    <div className="flex-shrink-0">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                      >
                        <reason.icon className="h-5 w-5 text-primary" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{reason.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {reason.description}
                      </p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <FadeIn delay={0.3} direction="left">
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-lg"
              >
                <h3 className="text-lg font-semibold">Technology Stack</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I work with modern, battle-tested technologies to deliver
                  reliable solutions.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {technologies.map((tech, index) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm font-medium cursor-default"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 border-t border-border pt-8"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Icons.message className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    </motion.div>
                    <div>
                      <TextGenerateEffect
                        words="I believe in building software that solves real problems. Every project is an opportunity to create something meaningful that makes a difference for the people who use it."
                        className="text-sm text-muted-foreground font-normal"
                        duration={0.3}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
