"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Github, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-28 text-center">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Powered by Sarvam AI — answers &amp; multilingual voice
        </span>
      </motion.div>

      <motion.h1
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-6 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
      >
        Talk to Any <span className="text-gradient">GitHub Repository</span>
      </motion.h1>

      <motion.p
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
      >
        Analyze, understand and review any codebase using AI and multilingual voice.
        Single repos, monorepos, and full microservice systems.
      </motion.p>

      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link href="/dashboard">
          <Button size="lg" className="group">
            Start Reviewing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <Link href="/dashboard?demo=1">
          <Button size="lg" variant="secondary">
            <Github className="h-4 w-4" />
            GitHub Demo
          </Button>
        </Link>
      </motion.div>

      {/* Floating voice pill */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-14 flex items-center gap-3 rounded-2xl glass px-5 py-3 text-sm text-muted-foreground"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
          <Mic className="h-4 w-4 text-primary" />
        </span>
        “Explain the authentication flow” — ask in any language, hear the answer back.
      </motion.div>
    </section>
  );
}
