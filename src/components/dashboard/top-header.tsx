"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Search, Sparkles, GitBranch, Boxes, Network, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useAnalyze } from "@/hooks/useAnalyze";
import type { WorkspaceKind } from "@/lib/types";

const KIND_META: Record<WorkspaceKind, { label: string; icon: typeof Boxes }> = {
  single: { label: "Single App", icon: Layers },
  monorepo: { label: "Monorepo", icon: Boxes },
  microservices: { label: "Microservices", icon: Network },
  organization: { label: "Organization", icon: Network },
};

export function TopHeader({ onMenu }: { onMenu: () => void }) {
  const analysis = useAppStore((s) => s.analysis);
  const system = useAppStore((s) => s.system);
  const analyzing = useAppStore((s) => s.analyzing);
  const { analyze, error } = useAnalyze();
  const [url, setUrl] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || analyzing) return;
    await analyze(url.trim());
  };

  const kind = system ? KIND_META[system.workspaceKind] : null;

  return (
    <div className="sticky top-0 z-20 border-b border-black/10 bg-white/70 backdrop-blur-xl">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>

        <form onSubmit={submit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a GitHub repo, org, or multiple URLs…"
              className="pl-9"
              aria-label="Repository URL"
            />
          </div>
          <Button type="submit" disabled={analyzing || !url.trim()}>
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/25 border-t-white" />
                Scanning…
              </span>
            ) : (
              <><Sparkles className="h-4 w-4" /> Analyze</>
            )}
          </Button>
        </form>
      </div>

      {/* Status row */}
      {(analysis || analyzing || error) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-2 px-4 pb-3 text-sm"
        >
          {analyzing && (
            <Badge variant="warning" className="animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Scanning repository…
            </Badge>
          )}
          {error && <Badge variant="danger">{error}</Badge>}
          {analysis && !analyzing && (
            <>
              <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Ready</Badge>
              {kind && <Badge variant="accent"><kind.icon className="h-3 w-3" /> {kind.label}</Badge>}
              <Badge variant="muted"><GitBranch className="h-3 w-3" /> {analysis.branch}</Badge>
              <Badge variant="muted">{analysis.language}</Badge>
              <Badge variant="muted">{analysis.framework}</Badge>
              {system && system.repos.length > 1 && (
                <Badge variant="default">{system.repos.length} repos</Badge>
              )}
              {analysis.source === "mock" && <Badge variant="warning">sample data</Badge>}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
