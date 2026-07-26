"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  GitBranch,
  Mic,
  Network,
  ScanSearch,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  { icon: ScanSearch, title: "Instant Analysis", desc: "Clone, detect framework, map files, and build architecture in seconds." },
  { icon: Mic, title: "Multilingual Voice", desc: "Ask by voice, hear answers back via Sarvam STT + TTS in many languages." },
  { icon: Network, title: "Service Graph", desc: "Auto-build dependency graphs across microservices, gateways, and queues." },
  { icon: Boxes, title: "Monorepo Aware", desc: "Detects single apps, monorepos, and multi-repo systems automatically." },
  { icon: Workflow, title: "Event Flow", desc: "Trace Kafka, RabbitMQ, Redis Streams producers and consumers." },
  { icon: ShieldCheck, title: "Security Insights", desc: "Surface auth flows, secrets risk, and infra misconfigurations." },
  { icon: GitBranch, title: "Call Hierarchy", desc: "Understand request lifecycle from gateway to database ownership." },
  { icon: Zap, title: "Streaming Answers", desc: "Sarvam responses stream token-by-token with rich Markdown + code." },
];

const PLANS = [
  { name: "Free", price: "$0", features: ["3 repos / day", "Voice Q&A", "Mock analysis"], cta: "Start free" },
  { name: "Pro", price: "$19", features: ["Unlimited repos", "Org + monorepo", "Service graphs", "Priority Sarvam"], cta: "Go Pro", highlight: true },
  { name: "Team", price: "$49", features: ["Everything in Pro", "Shared sessions", "SSO", "Audit exports"], cta: "Contact us" },
];

export function Features() {
  return (
    <>
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to <span className="text-gradient">understand code</span></h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">From a single file to a distributed system — CodeAtlas maps it and talks you through it.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08, duration: 0.5 }}
            >
              <Card className="h-full p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-black/[0.08]">
                  <f.icon className="h-5 w-5 text-accent" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-4 pb-28">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Simple <span className="text-gradient">pricing</span></h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when your system grows.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card key={p.name} className={`relative p-6 ${p.highlight ? "ring-2 ring-primary shadow-glow" : ""}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 text-4xl font-bold">{p.price}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.features.map((ft) => (
                  <li key={ft} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {ft}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
