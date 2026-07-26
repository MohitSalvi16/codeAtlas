"use client";

import { motion } from "framer-motion";
import {
  Blocks, ShieldCheck, Database, Plug, Component, Cog, Layers, Boxes, Route,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RepoAnalysis } from "@/lib/types";

export function Insights({ repo }: { repo: RepoAnalysis }) {
  const i = repo.insights;
  const textCards = [
    { icon: Blocks, title: "Architecture", body: i.architecture, tint: "from-primary/20 to-indigo-500/10" },
    { icon: ShieldCheck, title: "Authentication", body: i.authentication, tint: "from-emerald-500/20 to-emerald-500/5" },
    { icon: Database, title: "Database", body: i.database, tint: "from-accent/20 to-cyan-500/5" },
  ];
  const metrics = [
    { icon: Plug, label: "APIs", value: i.apiCount },
    { icon: Component, label: "Components", value: i.components },
    { icon: Cog, label: "Controllers", value: i.controllers },
    { icon: Layers, label: "Services", value: i.services },
    { icon: Boxes, label: "Models", value: i.models },
    { icon: Route, label: "Routes", value: i.routes },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {textCards.map((c, idx) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
            <Card className={`h-full bg-gradient-to-br ${c.tint} p-4`}>
              <div className="flex items-center gap-2">
                <c.icon className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-semibold">{c.title}</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {metrics.map((m, idx) => (
          <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.05 }}>
            <Card className="flex flex-col items-center justify-center p-3 text-center">
              <m.icon className="mb-1 h-4 w-4 text-primary" />
              <span className="text-xl font-bold">{m.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
