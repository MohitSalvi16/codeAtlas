"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { ArchNode } from "@/lib/types";

const KIND_ORDER: ArchNode["kind"][] = ["frontend", "backend", "data", "external", "infra"];
const KIND_COLOR: Record<ArchNode["kind"], string> = {
  frontend: "#06B6D4",
  backend: "#4F46E5",
  data: "#22C55E",
  external: "#F59E0B",
  infra: "#A78BFA",
};

export function ArchitectureGraph({ nodes }: { nodes: ArchNode[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { positioned, edges, width, height } = useMemo(() => {
    const cols = KIND_ORDER.filter((k) => nodes.some((n) => n.kind === k));
    const colWidth = 190;
    const rowHeight = 84;
    const pad = 30;
    const pos = new Map<string, { x: number; y: number }>();
    let maxRows = 0;

    cols.forEach((kind, ci) => {
      const group = nodes.filter((n) => n.kind === kind);
      maxRows = Math.max(maxRows, group.length);
      group.forEach((n, ri) => {
        pos.set(n.id, { x: pad + ci * colWidth, y: pad + ri * rowHeight });
      });
    });

    const edges: { from: string; to: string }[] = [];
    for (const n of nodes) {
      for (const c of n.children || []) {
        if (pos.has(c)) edges.push({ from: n.id, to: c });
      }
    }

    return {
      positioned: nodes.map((n) => ({ node: n, ...pos.get(n.id)! })),
      edges,
      width: pad * 2 + (cols.length - 1) * colWidth + 150,
      height: pad * 2 + maxRows * rowHeight,
    };
  }, [nodes]);

  const nodeW = 140;
  const nodeH = 46;

  return (
    <Card className="p-5">
      <h4 className="mb-3 text-sm font-semibold">Architecture</h4>
      <div className="overflow-x-auto">
        <svg width={width} height={Math.max(height, 160)} className="min-w-full">
          {edges.map((e, i) => {
            const a = positioned.find((p) => p.node.id === e.from)!;
            const b = positioned.find((p) => p.node.id === e.to)!;
            const x1 = a.x + nodeW, y1 = a.y + nodeH / 2;
            const x2 = b.x, y2 = b.y + nodeH / 2;
            const mx = (x1 + x2) / 2;
            const active = hovered === e.from || hovered === e.to;
            return (
              <motion.path
                key={i}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={active ? "#06B6D4" : "rgba(15,23,42,0.15)"}
                strokeWidth={active ? 2 : 1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            );
          })}
          {positioned.map(({ node, x, y }, i) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x} y={y} width={nodeW} height={nodeH} rx={12}
                fill="#ffffff"
                stroke={KIND_COLOR[node.kind]}
                strokeWidth={hovered === node.id ? 2 : 1}
              />
              <circle cx={x + 16} cy={y + nodeH / 2} r={4} fill={KIND_COLOR[node.kind]} />
              <text x={x + 30} y={y + nodeH / 2 + 4} fill="#0f172a" fontSize={12} fontWeight={500}>
                {node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {KIND_ORDER.filter((k) => nodes.some((n) => n.kind === k)).map((k) => (
          <span key={k} className="flex items-center gap-1.5 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[k] }} /> {k}
          </span>
        ))}
      </div>
    </Card>
  );
}
