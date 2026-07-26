"use client";

import { motion } from "framer-motion";
import { FileCode2, FolderTree, Package, Ruler } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { RepoAnalysis } from "@/lib/types";

export function RepoStats({ repo }: { repo: RepoAnalysis }) {
  const s = repo.stats;
  const tiles = [
    { icon: Ruler, label: "Lines of Code", value: formatNumber(s.linesOfCode) },
    { icon: FileCode2, label: "Files", value: formatNumber(s.files) },
    { icon: Package, label: "Dependencies", value: String(s.dependencies) },
    { icon: FolderTree, label: "Largest Folder", value: s.largestFolder, small: true },
  ];

  return (
    <Card className="p-5">
      <h4 className="mb-4 text-sm font-semibold">Repository Statistics</h4>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-black/10 bg-black/[0.025] p-3">
            <t.icon className="mb-1.5 h-4 w-4 text-accent" />
            <div className={t.small ? "text-sm font-medium" : "text-2xl font-bold"}>{t.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</p>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {s.languages.map((l) => (
            <motion.div
              key={l.name}
              initial={{ width: 0 }}
              animate={{ width: `${l.percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: l.color }}
              title={`${l.name} ${l.percent}%`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {s.languages.map((l) => (
            <span key={l.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.name} {l.percent}%
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
