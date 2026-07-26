"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, X, RotateCcw, Loader2, Volume2, Repeat, Sparkles, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { SARVAM_LANGUAGES, SARVAM_SPEAKERS } from "@/lib/voice-options";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/types";
import type { VoiceEngine } from "@/hooks/useVoice";

const LABEL: Record<VoiceState, string> = {
  idle: "Tap the mic and ask anything",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

export function VoiceMode({
  open, onClose, state, levels, engine, continuous, onToggleContinuous,
  onMicClick, onStopSpeaking, onReplay, canReplay,
}: {
  open: boolean;
  onClose: () => void;
  state: VoiceState;
  levels: number[];
  engine: VoiceEngine;
  continuous: boolean;
  onToggleContinuous: () => void;
  onMicClick: () => void;
  onStopSpeaking: () => void;
  onReplay: () => void;
  canReplay: boolean;
}) {
  const ttsLanguage = useAppStore((s) => s.ttsLanguage);
  const setTtsLanguage = useAppStore((s) => s.setTtsLanguage);
  const ttsSpeaker = useAppStore((s) => s.ttsSpeaker);
  const setTtsSpeaker = useAppStore((s) => s.setTtsSpeaker);

  const ring =
    state === "listening" ? "bg-accent/40" :
    state === "thinking" ? "bg-amber-400/40" :
    state === "speaking" ? "bg-primary/40" : "bg-black/[0.06]";

  const engineLabel = engine === "sarvam" ? `Sarvam · ${ttsSpeaker}` : engine === "browser" ? "Browser voice (fallback)" : `Sarvam · ${ttsSpeaker}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-2xl"
        >
          <button onClick={onClose} aria-label="Close voice mode" className="absolute right-5 top-5 text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>

          {/* Voice + language pickers */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
            <label className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2 py-1 text-xs shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <select
                value={ttsSpeaker}
                onChange={(e) => setTtsSpeaker(e.target.value)}
                className="bg-transparent pr-1 outline-none"
                aria-label="Voice / speaker"
              >
                {SARVAM_SPEAKERS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} ({s.gender})</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2 py-1 text-xs shadow-sm">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <select
                value={ttsLanguage}
                onChange={(e) => setTtsLanguage(e.target.value)}
                className="bg-transparent pr-1 outline-none"
                aria-label="Language"
              >
                {SARVAM_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="mb-2 mt-10 text-lg font-medium text-foreground/90">{LABEL[state]}</p>
          <p className="mb-8 text-xs text-muted-foreground">
            <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", engine === "browser" ? "bg-amber-500" : "bg-emerald-500")} />
            {engineLabel}
          </p>

          {/* Mic + rings */}
          <div className="relative flex h-56 w-56 items-center justify-center">
            {(state === "listening" || state === "speaking") && (
              <>
                <span className={`absolute inset-0 animate-pulse-ring rounded-full ${ring}`} />
                <span className={`absolute inset-6 animate-pulse-ring rounded-full ${ring}`} style={{ animationDelay: "0.4s" }} />
              </>
            )}

            <button
              onClick={onMicClick}
              disabled={state === "thinking"}
              className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-glow transition-transform hover:scale-105 disabled:opacity-60"
              aria-label={state === "listening" ? "Stop recording" : "Start recording"}
            >
              {state === "thinking" ? (
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              ) : state === "listening" ? (
                <Square className="h-11 w-11 fill-white text-white" />
              ) : state === "speaking" ? (
                <Volume2 className="h-12 w-12 text-white" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </button>
          </div>

          {/* Waveform */}
          <div className="mt-12 flex h-16 items-center gap-1">
            {levels.map((l, i) => (
              <motion.span
                key={i}
                className="wave-bar"
                animate={{ height: state === "listening" ? `${Math.max(6, l * 60)}px` : state === "speaking" ? `${8 + Math.abs(Math.sin(i)) * 24}px` : "6px" }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {state === "speaking" ? (
              <Button variant="secondary" onClick={onStopSpeaking}>
                <Square className="h-4 w-4" /> Stop speaking
              </Button>
            ) : (
              <Button variant="secondary" onClick={onReplay} disabled={!canReplay || state === "thinking"}>
                <RotateCcw className="h-4 w-4" /> Replay
              </Button>
            )}
            <Button
              variant={continuous ? "default" : "outline"}
              onClick={onToggleContinuous}
              title="Hands-free: keep listening after each answer"
            >
              <Repeat className="h-4 w-4" /> {continuous ? "Hands-free on" : "Hands-free off"}
            </Button>
          </div>

          <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
            {continuous
              ? "Hands-free conversation — I listen again automatically after each answer. Tap the mic to interrupt."
              : "Tap the mic, ask, tap again to send."}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
