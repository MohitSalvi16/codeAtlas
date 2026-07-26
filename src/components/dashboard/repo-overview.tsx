"use client";

import { motion } from "framer-motion";
import { Star, GitFork, Code2, Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { RepoAnalysis } from "@/lib/types";

const TECH_COLORS: Record<string, string> = {
  Docker: "#2496ED", Kubernetes: "#326CE5", React: "#61DAFB", "Next.js": "#111827",
  Node: "#3C873A", Python: "#3776AB", Go: "#00ADD8", Rust: "#dea584",
  Redis: "#DC382D", Postgres: "#336791", MongoDB: "#47A248", GraphQL: "#E10098",
  Tailwind: "#06B6D4", TypeScript: "#3178C6",
};

export function RepoOverview({ repo }: { repo: RepoAnalysis }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {repo.owner}/<span className="text-gradient">{repo.name}</span>
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{repo.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-amber-300"><Star className="h-4 w-4" /> {formatNumber(repo.stars)}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><GitFork className="h-4 w-4" /> {formatNumber(repo.forks)}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Code2 className="h-4 w-4" /> {repo.language}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Boxes className="h-4 w-4" /> {repo.framework}</span>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detected technologies</p>
          <div className="flex flex-wrap gap-1.5">
            {repo.technologies.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.04] px-2.5 py-1 text-xs"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: TECH_COLORS[t] || "#8b949e" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {repo.source === "mock" && (
          <Badge variant="warning" className="mt-4">Representative sample data — set GITHUB_TOKEN for live analysis</Badge>
        )}
      </Card>
    </motion.div>
  );
}
