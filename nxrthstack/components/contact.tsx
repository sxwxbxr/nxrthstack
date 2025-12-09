"use client";

import { Icons } from "./icons";
import { FadeIn } from "./ui/fade-in";
import { MovingBorderButton } from "./ui/moving-border";
import { Magnetic } from "./ui/magnetic";
import { motion } from "motion/react";

export function Contact() {
  return (
    <section id="contact" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -right-1/2 h-full w-full opacity-30"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, var(--primary) 10%, transparent 20%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block text-sm font-semibold uppercase tracking-widest text-primary"
            >
              Contact
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Let&apos;s Build Something Great
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-muted-foreground"
            >
              Have a project in mind? I&apos;d love to hear about it. Get in
              touch and let&apos;s discuss how I can help bring your vision to
              life.
            </motion.p>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mx-auto mt-16 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-lg backdrop-blur-sm"
            >
              <form className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Your name"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="you@example.com"
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <label
                    htmlFor="project-type"
                    className="block text-sm font-medium mb-2"
                  >
                    Project Type
                  </label>
                  <select
                    id="project-type"
                    name="project-type"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a project type</option>
                    <option value="web">Web Application</option>
                    <option value="desktop">Desktop Application</option>
                    <option value="game">Game Development</option>
                    <option value="other">Other</option>
                  </select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Tell me about your project..."
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Magnetic strength={0.15}>
                    <MovingBorderButton
                      borderRadius="0.75rem"
                      containerClassName="w-full h-12"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <span className="flex items-center gap-2">
                        Send Message
                        <Icons.arrowRight className="h-4 w-4" />
                      </span>
                    </MovingBorderButton>
                  </Magnetic>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="mt-8 pt-8 border-t border-border"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Prefer email?{" "}
                  <motion.a
                    href="mailto:hello@nxrthstack.dev"
                    whileHover={{ scale: 1.05 }}
                    className="inline-block font-medium text-primary hover:underline"
                  >
                    hello@nxrthstack.dev
                  </motion.a>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
