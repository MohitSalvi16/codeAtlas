"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Plus, History, Settings, Trash2, MessageSquare, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sessions = useAppStore((s) => s.sessions);
  const newSession = useAppStore((s) => s.newSession);
  const loadSession = useAppStore((s) => s.loadSession);
  const removeSession = useAppStore((s) => s.removeSession);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-4 border-r border-black/10 bg-white/95 p-4 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 lg:bg-transparent",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Compass className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold">Code<span className="text-gradient">Atlas</span></span>
          </Link>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => { newSession(); onClose(); }} className="w-full">
          <Plus className="h-4 w-4" /> New Session
        </Button>

        <div className="flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Repository History
          </div>

          {sessions.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              No recent repositories yet. Analyze one to get started.
            </p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((s) => (
                <li key={s.id} className="group flex items-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-black/[0.04]">
                  <button
                    onClick={() => { loadSession(s.id); onClose(); }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{s.repoName}</span>
                      <span className="block text-xs text-muted-foreground">{timeAgo(s.createdAt)} · {s.messages.length} msgs</span>
                    </span>
                  </button>
                  <button
                    onClick={() => removeSession(s.id)}
                    aria-label="Delete session"
                    className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1 border-t border-black/10 pt-3">
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-black/[0.04]">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground/80">
            <span>Theme</span>
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-xs">Dark</span>
          </div>
        </div>
      </aside>
    </>
  );
}
