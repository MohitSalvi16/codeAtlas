"use client";

import { motion } from "framer-motion";

const SNIPPETS = [
  "const app = analyze(repo)",
  "await claude.ask('explain auth')",
  "git clone --depth=1",
  "kind: Deployment",
  "producer.send('order.created')",
  "SELECT * FROM services",
  "export async function GET()",
  "grpc.Server()",
];

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Glowing blobs */}
      <motion.div
        className="absolute -left-40 top-10 h-[32rem] w-[32rem] rounded-full bg-primary/25 blur-[120px]"
        animate={{ y: [0, -40, 0], x: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[120px]"
        animate={{ y: [0, 50, 0], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-600/20 blur-[110px]"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Floating code snippets */}
      {SNIPPETS.map((s, i) => (
        <motion.span
          key={s}
          className="absolute select-none font-mono text-xs text-black/[0.05]"
          style={{ left: `${(i * 13 + 8) % 90}%`, top: `${(i * 21 + 12) % 85}%` }}
          animate={{ y: [0, -26, 0], opacity: [0.05, 0.18, 0.05] }}
          transition={{ duration: 10 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
        >
          {s}
        </motion.span>
      ))}
    </div>
  );
}
