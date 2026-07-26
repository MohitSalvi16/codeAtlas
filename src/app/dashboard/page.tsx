"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, FolderTree, Sparkles, Network } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopHeader } from "@/components/dashboard/top-header";
import { ChatWindow } from "@/components/dashboard/chat-window";
import { RepoOverview } from "@/components/dashboard/repo-overview";
import { RepoTree } from "@/components/dashboard/repo-tree";
import { RepoStats } from "@/components/dashboard/repo-stats";
import { Insights } from "@/components/dashboard/insights";
import { ArchitectureGraph } from "@/components/dashboard/architecture-graph";
import { ServiceGraph } from "@/components/dashboard/service-graph";
import { LoadingTimeline } from "@/components/dashboard/loading-timeline";
import { useAppStore } from "@/store/useAppStore";
import { useAnalyze } from "@/hooks/useAnalyze";
import { cn } from "@/lib/utils";

type Tab = "overview" | "files" | "insights" | "system";
const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "files", label: "Files", icon: FolderTree },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "system", label: "System", icon: Network },
];

function DashboardInner() {
  const analysis = useAppStore((s) => s.analysis);
  const system = useAppStore((s) => s.system);
  const analyzing = useAppStore((s) => s.analyzing);
  const { analyze, progress } = useAnalyze();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const params = useSearchParams();

  // Auto-load a demo repo when arriving from the "GitHub Demo" button.
  useEffect(() => {
    if (params.get("demo") && !analysis && !analyzing) {
      analyze("https://github.com/acme/shopflow");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onMenu={() => setSidebarOpen(true)} />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_minmax(360px,440px)]">
          {/* Center: chat */}
          <div className="min-h-0 border-r border-black/10">
            <ChatWindow />
          </div>

          {/* Right: repository panel */}
          <aside className="hidden min-h-0 flex-col lg:flex">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-black/10 px-3 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === t.id && (
                    <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-black/[0.05] ring-1 ring-black/[0.08]" />
                  )}
                  <t.icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {analyzing && !analysis && <LoadingTimeline steps={progress} />}

              {!analysis && !analyzing && (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <Network className="mb-3 h-8 w-8 text-accent/60" />
                  Analyze a repository to see its overview, files, insights, and service graph.
                </div>
              )}

              {analysis && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {tab === "overview" && (
                      <>
                        <RepoOverview repo={analysis} />
                        <RepoStats repo={analysis} />
                      </>
                    )}
                    {tab === "files" && (
                      <div className="glass h-[calc(100vh-11rem)] rounded-2xl p-3">
                        <RepoTree tree={analysis.tree} />
                      </div>
                    )}
                    {tab === "insights" && (
                      <>
                        <Insights repo={analysis} />
                        <ArchitectureGraph nodes={analysis.architecture} />
                      </>
                    )}
                    {tab === "system" && system && <ServiceGraph graph={system.graph} />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
