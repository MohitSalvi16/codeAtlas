"use client";

import { motion } from "framer-motion";
import { KeyRound, Plug, FolderTree, Gauge, ShieldAlert, BookOpen } from "lucide-react";
import { SUGGESTED_QUESTIONS } from "@/lib/mock-data";

const ICONS = [KeyRound, Plug, FolderTree, Gauge, ShieldAlert, BookOpen];

export function SuggestedQuestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTED_QUESTIONS.map((q, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <motion.button
            key={q}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onPick(q)}
            className="group flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.025] p-3 text-left text-sm transition-all hover:border-primary/40 hover:bg-black/[0.04]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Icon className="h-4 w-4 text-accent" />
            </span>
            <span className="text-foreground/90 group-hover:text-foreground">{q}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
