"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Database, Boxes, Radio, Server, Monitor, Package, Cog, X, Users, ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ServiceKind, ServiceNode, SystemGraph } from "@/lib/types";

const COL_ORDER: ServiceKind[] = ["frontend", "gateway", "backend", "worker", "shared-lib"];
const KIND_COLOR: Record<ServiceKind, string> = {
  frontend: "#06B6D4", gateway: "#F59E0B", backend: "#4F46E5",
  worker: "#A78BFA", "shared-lib": "#64748B", database: "#22C55E", queue: "#EC4899",
};
const KIND_ICON: Record<ServiceKind, typeof Server> = {
  frontend: Monitor, gateway: Network, backend: Server, worker: Cog,
  "shared-lib": Package, database: Database, queue: Radio,
};
const PROTO_COLOR: Record<string, string> = {
  REST: "#4F46E5", GraphQL: "#E10098", gRPC: "#00ADD8",
  Kafka: "#EC4899", RabbitMQ: "#F59E0B", "Redis Streams": "#DC382D", WebSocket: "#22C55E",
};

export function ServiceGraph({ graph }: { graph: SystemGraph }) {
  const [selected, setSelected] = useState<ServiceNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const { positioned, dbNodes, edges, width, height } = useMemo(() => {
    const cols = COL_ORDER.filter((k) => graph.services.some((s) => s.kind === k));
    const colWidth = 210;
    const rowHeight = 92;
    const pad = 28;
    const pos = new Map<string, { x: number; y: number }>();
    let maxRows = 0;

    cols.forEach((kind, ci) => {
      const group = graph.services.filter((s) => s.kind === kind);
      maxRows = Math.max(maxRows, group.length);
      group.forEach((s, ri) => pos.set(s.id, { x: pad + ci * colWidth, y: pad + ri * rowHeight }));
    });

    // Database column at the far right.
    const dbCol = cols.length;
    const dbNodes = graph.databases.map((name, ri) => {
      const id = `db:${name}`;
      pos.set(id, { x: pad + dbCol * colWidth, y: pad + ri * rowHeight });
      return { id, name };
    });
    maxRows = Math.max(maxRows, dbNodes.length);

    // Service→service edges + service→db ownership edges.
    const edges: { from: string; to: string; protocol: string; kind: "sync" | "async"; label?: string }[] = [
      ...graph.edges.filter((e) => pos.has(e.from) && pos.has(e.to)),
    ];
    for (const s of graph.services) {
      for (const db of s.databases) {
        const id = `db:${db}`;
        if (pos.has(id)) edges.push({ from: s.id, to: id, protocol: "REST", kind: "sync", label: "owns" });
      }
    }

    return {
      positioned: graph.services.map((s) => ({ node: s, ...pos.get(s.id)! })),
      dbNodes: dbNodes.map((d) => ({ ...d, ...pos.get(d.id)! })),
      edges,
      width: pad * 2 + (cols.length) * colWidth + 160,
      height: pad * 2 + maxRows * rowHeight + 10,
    };
  }, [graph]);

  const nodeW = 168;
  const nodeH = 58;
  const posOf = (id: string) => {
    const s = positioned.find((p) => p.node.id === id);
    if (s) return { x: s.x, y: s.y };
    const d = dbNodes.find((n) => n.id === id);
    return d ? { x: d.x, y: d.y } : null;
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-semibold">Service Dependency Graph</h4>
        </div>
        <Badge variant="accent" className="capitalize">{graph.workspaceKind}</Badge>
      </div>

      {/* Summary chips */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {graph.gateways.length > 0 && <Badge variant="warning"><Network className="h-3 w-3" /> Gateway: {graph.gateways.join(", ")}</Badge>}
        {graph.protocols.map((p) => (
          <span key={p} className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-0.5" style={{ color: PROTO_COLOR[p] }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PROTO_COLOR[p] }} /> {p}
          </span>
        ))}
        {graph.queues.map((q) => <Badge key={q} variant="default"><Radio className="h-3 w-3" /> {q}</Badge>)}
        {graph.databases.map((d) => <Badge key={d} variant="success"><Database className="h-3 w-3" /> {d}</Badge>)}
        {graph.sharedLibs.map((l) => <Badge key={l} variant="muted"><Package className="h-3 w-3" /> {l}</Badge>)}
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={Math.max(height, 180)} className="min-w-full">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="rgba(15,23,42,0.35)" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const a = posOf(e.from), b = posOf(e.to);
            if (!a || !b) return null;
            const x1 = a.x + nodeW, y1 = a.y + nodeH / 2;
            const x2 = b.x, y2 = b.y + nodeH / 2;
            const mx = (x1 + x2) / 2;
            const active = hovered === e.from || hovered === e.to;
            const color = PROTO_COLOR[e.protocol] || "rgba(15,23,42,0.2)";
            return (
              <motion.path
                key={i}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={active ? color : "rgba(15,23,42,0.15)"}
                strokeWidth={active ? 2.2 : 1.4}
                strokeDasharray={e.kind === "async" ? "5 4" : undefined}
                markerEnd="url(#arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: i * 0.04 }}
              />
            );
          })}

          {/* Database nodes */}
          {dbNodes.map((d, i) => (
            <motion.g key={d.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <rect x={d.x} y={d.y} width={nodeW} height={nodeH} rx={14} fill="rgba(34,197,94,0.08)" stroke={KIND_COLOR.database} strokeWidth={1.2} />
              <text x={d.x + 40} y={d.y + nodeH / 2 + 4} fill="#0f172a" fontSize={13} fontWeight={600}>{d.name}</text>
              <circle cx={d.x + 20} cy={d.y + nodeH / 2} r={5} fill={KIND_COLOR.database} />
            </motion.g>
          ))}

          {/* Service nodes */}
          {positioned.map(({ node, x, y }, i) => {
            const Icon = KIND_ICON[node.kind];
            const color = KIND_COLOR[node.kind];
            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(node)}
                style={{ cursor: "pointer" }}
              >
                <rect x={x} y={y} width={nodeW} height={nodeH} rx={14} fill="#ffffff" stroke={color} strokeWidth={hovered === node.id || selected?.id === node.id ? 2.4 : 1.2} />
                <foreignObject x={x + 12} y={y + 10} width={26} height={26}>
                  <div style={{ color, display: "flex" }}><Icon size={20} color={color} /></div>
                </foreignObject>
                <text x={x + 46} y={y + 24} fill="#0f172a" fontSize={13} fontWeight={600}>
                  {node.name.length > 15 ? node.name.slice(0, 14) + "…" : node.name}
                </text>
                <text x={x + 46} y={y + 40} fill="rgba(71,85,105,0.95)" fontSize={10} className="capitalize">{node.kind} · {node.owner}</text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-4 rounded-xl border border-black/10 bg-black/[0.025] p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_COLOR[selected.kind] }} />
                  <h5 className="font-semibold">{selected.name}</h5>
                  <Badge variant="muted" className="capitalize">{selected.kind}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {selected.owner} · <span className="font-mono">{selected.repo}</span>
                </p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 font-semibold text-muted-foreground">Protocols</p>
                <div className="flex flex-wrap gap-1">{selected.protocols.map((p) => <span key={p} className="rounded-full border border-black/10 px-2 py-0.5" style={{ color: PROTO_COLOR[p] }}>{p}</span>)}</div>
              </div>
              <div>
                <p className="mb-1 font-semibold text-muted-foreground">Databases</p>
                <div className="flex flex-wrap gap-1">{selected.databases.length ? selected.databases.map((d) => <Badge key={d} variant="success">{d}</Badge>) : <span className="text-muted-foreground">none</span>}</div>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">Produces <ArrowRight className="h-3 w-3" /></p>
                <div className="flex flex-wrap gap-1">{selected.produces.length ? selected.produces.map((t) => <Badge key={t} variant="default">{t}</Badge>) : <span className="text-muted-foreground">none</span>}</div>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground"><ArrowRight className="h-3 w-3" /> Consumes</p>
                <div className="flex flex-wrap gap-1">{selected.consumes.length ? selected.consumes.map((t) => <Badge key={t} variant="accent">{t}</Badge>) : <span className="text-muted-foreground">none</span>}</div>
              </div>
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Tech</p>
              <div className="flex flex-wrap gap-1">{selected.tech.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {COL_ORDER.filter((k) => graph.services.some((s) => s.kind === k)).map((k) => {
          const Icon = KIND_ICON[k];
          return <span key={k} className="flex items-center gap-1.5 capitalize"><Icon className="h-3.5 w-3.5" style={{ color: KIND_COLOR[k] }} /> {k}</span>;
        })}
        <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-black/25" /> sync</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-dashed border-black/25" /> async</span>
      </div>
    </Card>
  );
}
