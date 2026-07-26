"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "/dashboard" },
  { label: "Pricing", href: "#pricing" },
  { label: "GitHub", href: "https://github.com" },
];

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 mx-auto mt-4 max-w-6xl px-4"
    >
      <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-soft">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Code<span className="text-gradient">Atlas</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="https://github.com" aria-label="GitHub" className="hidden sm:block">
            <Button variant="ghost" size="icon-sm">
              <Github className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Launch App</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
