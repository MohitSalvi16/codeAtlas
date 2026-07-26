"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { AnalyzeProgress } from "@/lib/types";

export function LoadingTimeline({ steps }: { steps: AnalyzeProgress[] }) {
  const activeIdx = steps.findIndex((s) => !s.done);
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-4 text-sm font-medium text-muted-foreground">Analyzing repository…</p>
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const active = i === activeIdx;
          return (
            <motion.li
              key={s.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  s.done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-primary/20 text-primary" : "bg-black/[0.04] text-muted-foreground"
                }`}
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
              </span>
              <span className={`text-sm ${s.done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
