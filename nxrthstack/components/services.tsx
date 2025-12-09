"use client";

import { Icons } from "./icons";
import { HoverEffect } from "./ui/card-hover-effect";
import { FadeIn, StaggerContainer, StaggerItem } from "./ui/fade-in";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { motion } from "motion/react";
import { Globe, Monitor, Gamepad2, Database, Cloud, Palette } from "lucide-react";

const services = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Web Applications",
    description:
      "Modern, responsive web applications built with Next.js and React. From dynamic dashboards to e-commerce platforms, I deliver fast, scalable solutions optimized for performance and SEO.",
  },
  {
    icon: <Monitor className="h-6 w-6" />,
    title: "Desktop Applications",
    description:
      "Cross-platform desktop applications that run natively on Windows, macOS, and Linux. Built for performance with modern frameworks and native integrations.",
  },
  {
    icon: <Gamepad2 className="h-6 w-6" />,
    title: "Game Development",
    description:
      "Engaging games and interactive experiences. From prototypes to polished products, I bring creative visions to life with attention to gameplay and user experience.",
  },
];

const features = [
  {
    title: "API Development",
    description: "RESTful and GraphQL APIs built for scale",
    icon: <Database className="h-5 w-5 text-primary" />,
    header: (
      <div className="flex h-full min-h-[120px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Database className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "Cloud Deployment",
    description: "AWS, Vercel, and containerized solutions",
    icon: <Cloud className="h-5 w-5 text-primary" />,
    header: (
      <div className="flex h-full min-h-[120px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cloud className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    title: "UI/UX Design",
    description: "Beautiful interfaces with great user experience",
    icon: <Palette className="h-5 w-5 text-primary" />,
    header: (
      <div className="flex h-full min-h-[120px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Palette className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    ),
    className: "md:col-span-1",
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block text-sm font-semibold uppercase tracking-widest text-primary mb-2"
            >
              Services
            </motion.span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What I Build
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Specialized in delivering high-quality software solutions tailored
              to your needs.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-16">
            <HoverEffect items={services} />
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-16">
            <h3 className="text-center text-xl font-semibold mb-8">
              Additional Capabilities
            </h3>
            <BentoGrid>
              {features.map((feature, idx) => (
                <BentoGridItem
                  key={idx}
                  title={feature.title}
                  description={feature.description}
                  header={feature.header}
                  icon={feature.icon}
                  className={feature.className}
                />
              ))}
            </BentoGrid>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
          <StaggerContainer
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            staggerDelay={0.1}
          >
            {[
              { label: "Next.js & React", icon: "⚛️" },
              { label: "TypeScript", icon: "📘" },
              { label: "Node.js", icon: "🟢" },
              { label: "Rust", icon: "🦀" },
            ].map((tech) => (
              <StaggerItem key={tech.label}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm"
                >
                  <span className="text-2xl">{tech.icon}</span>
                  <span className="font-medium">{tech.label}</span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      </div>
    </section>
  );
}
