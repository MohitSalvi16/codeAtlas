"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, File, Folder, FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RepoFileNode } from "@/lib/types";

const EXT_COLORS: Record<string, string> = {
  ts: "#3178c6", tsx: "#3178c6", js: "#f1e05a", jsx: "#f1e05a", py: "#3776AB",
  go: "#00ADD8", rs: "#dea584", json: "#8b949e", md: "#8b949e", yml: "#cb171e",
  yaml: "#cb171e", css: "#563d7c", html: "#e34c26",
};

function fileColor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (/dockerfile/i.test(name)) return "#2496ED";
  return EXT_COLORS[ext] || "#8b949e";
}

function TreeNode({ node, depth, query }: { node: RepoFileNode; depth: number; query: string }) {
  const [open, setOpen] = useState(depth < 1);

  // When searching, force-open dirs that contain a match.
  const matches = useMemo(() => {
    if (!query) return true;
    const q = query.toLowerCase();
    const walk = (n: RepoFileNode): boolean =>
      n.name.toLowerCase().includes(q) || (n.children?.some(walk) ?? false);
    return walk(node);
  }, [node, query]);

  if (!matches) return null;
  const isDir = node.type === "dir";
  const forceOpen = query.length > 0;
  const expanded = forceOpen || open;

  return (
    <div>
      <button
        onClick={() => isDir && setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-lg py-1 pr-2 text-left text-sm transition-colors hover:bg-black/[0.04]"
        style={{ paddingLeft: depth * 14 + 6 }}
      >
        {isDir ? (
          <>
            <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
            {expanded ? <FolderOpen className="h-4 w-4 shrink-0 text-accent" /> : <Folder className="h-4 w-4 shrink-0 text-accent" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="h-4 w-4 shrink-0" style={{ color: fileColor(node.name) }} />
          </>
        )}
        <span className="truncate text-foreground/80">{node.name}</span>
      </button>

      <AnimatePresence initial={false}>
        {isDir && expanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((c) => (
              <TreeNode key={c.path} node={c} depth={depth + 1} query={query} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RepoTree({ tree }: { tree: RepoFileNode[] }) {
  const [query, setQuery] = useState("");
  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files, functions, classes…"
          className="h-9 pl-9 text-xs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tree.map((n) => (
          <TreeNode key={n.path} node={n} depth={0} query={query} />
        ))}
      </div>
    </div>
  );
}
