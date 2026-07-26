"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Mic, Sparkles, Download, Pin, AudioLines, Trash2, Volume2, VolumeX, Building2, Package, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import type { Audience } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { ChatMessage } from "./chat-message";
import { SuggestedQuestions } from "./suggested-questions";
import { VoiceMode } from "./voice-mode";

export function ChatWindow() {
  const analysis = useAppStore((s) => s.analysis);
  const messages = useAppStore((s) => s.messages);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const autoSpeak = useAppStore((s) => s.autoSpeak);
  const setAutoSpeak = useAppStore((s) => s.setAutoSpeak);
  const ttsLanguage = useAppStore((s) => s.ttsLanguage);
  const ttsSpeaker = useAppStore((s) => s.ttsSpeaker);
  const audience = useAppStore((s) => s.audience);
  const setAudience = useAppStore((s) => s.setAudience);

  const voice = useVoice();
  const lastAnswerRef = useRef<string>("");

  // Speak any answer with the user's chosen Sarvam voice + language.
  const speakAnswer = useCallback(
    (text: string) => voice.speak(stripMarkdown(text), { language: ttsLanguage, speaker: ttsSpeaker }),
    [voice, ttsLanguage, ttsSpeaker],
  );

  const { send, sending } = useChat(async (answer) => {
    lastAnswerRef.current = answer;
    // Voice-intensive: speak every answer when auto-speak is on OR the voice overlay is open.
    if ((autoSpeakRef.current || voiceOpenRef.current) && answer.trim()) {
      await speakAnswer(answer);
    }
  });

  const [input, setInput] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const voiceOpenRef = useRef(false);
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => { voiceOpenRef.current = voiceOpen; }, [voiceOpen]);
  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);

  // Hands-free loop: after the assistant finishes speaking in voice mode, listen again.
  const prevVoiceState = useRef(voice.state);
  useEffect(() => {
    if (prevVoiceState.current === "speaking" && voice.state === "idle" && voiceOpenRef.current && continuous) {
      voice.startListening();
    }
    prevVoiceState.current = voice.state;
  }, [voice.state, continuous, voice]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = useCallback(
    async (q?: string) => {
      const text = (q ?? input).trim();
      if (!text || sending || !analysis) return;
      setInput("");
      await send(text);
    },
    [input, sending, analysis, send],
  );

  // Voice-mode mic button: toggles record → transcribe → send.
  const onMicClick = useCallback(async () => {
    if (voice.state === "speaking") { voice.stopSpeaking(); return; }
    if (voice.state === "listening") {
      const transcript = await voice.stopListening();
      if (transcript.trim()) await submit(transcript);
      return;
    }
    if (voice.state === "idle") await voice.startListening();
  }, [voice, submit]);

  const openVoice = useCallback(async () => {
    setVoiceOpen(true);
    await voice.startListening();
  }, [voice]);

  const closeVoice = useCallback(() => {
    voice.stopSpeaking();
    if (voice.state === "listening") voice.stopListening();
    setVoiceOpen(false);
  }, [voice]);

  const exportMarkdown = useCallback(() => {
    if (!analysis) return;
    const md = [
      `# CodeAtlas — ${analysis.owner}/${analysis.name}`,
      `> ${analysis.description}\n`,
      ...messages.map((m) => `## ${m.role === "user" ? "🧑 You" : "🤖 CodeAtlas"}\n\n${m.content}`),
    ].join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.name}-conversation.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, messages]);

  const pinned = messages.filter((m) => m.pinned);
  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2.5">
        <AudiencePicker value={audience} onChange={setAudience} />
        <div className="flex items-center gap-1">
          {pinned.length > 0 && (
            <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-accent">
              <Pin className="h-3.5 w-3.5" /> {pinned.length}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (autoSpeak) voice.stopSpeaking(); setAutoSpeak(!autoSpeak); }}
            className={autoSpeak ? "text-accent" : "text-muted-foreground"}
            title="Auto-speak answers"
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{autoSpeak ? "Voice on" : "Voice off"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={exportMarkdown} disabled={empty}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { voice.stopSpeaking(); clearMessages(); }}
            disabled={empty}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {!analysis ? (
          <EmptyNoRepo />
        ) : empty ? (
          <div className="mx-auto max-w-xl space-y-5 pt-6">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Ask anything about {analysis.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pick a starter question or type your own — by text or voice.</p>
            </div>
            <SuggestedQuestions onPick={(q) => submit(q)} />
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} onSpeak={(t) => speakAnswer(t)} />
            ))}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-black/10 p-3">
        <div className="flex items-end gap-2 rounded-2xl glass p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            placeholder={analysis ? "Ask about this codebase…" : "Analyze a repository first…"}
            disabled={!analysis || sending}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          {voiceEnabled && (
            <Button variant="secondary" size="icon" onClick={openVoice} disabled={!analysis} aria-label="Voice mode" title="Voice conversation">
              <AudioLines className="h-4 w-4 text-accent" />
            </Button>
          )}
          <Button size="icon" onClick={() => submit()} disabled={!analysis || !input.trim() || sending} aria-label="Send">
            {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-white" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 px-2 text-[11px] text-muted-foreground">
          <Mic className="mr-1 inline h-3 w-3" /> Answers &amp; voice powered by Sarvam · Enter to send, Shift+Enter for newline
        </p>
      </div>

      <VoiceMode
        open={voiceOpen}
        onClose={closeVoice}
        state={voice.state}
        levels={voice.levels}
        engine={voice.engine}
        continuous={continuous}
        onToggleContinuous={() => setContinuous((c) => !c)}
        onMicClick={onMicClick}
        onStopSpeaking={voice.stopSpeaking}
        onReplay={() => lastAnswerRef.current && speakAnswer(lastAnswerRef.current)}
        canReplay={!!lastAnswerRef.current}
      />
    </div>
  );
}

const AUDIENCES: { id: Audience; label: string; icon: typeof Building2 }[] = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "product", label: "Product", icon: Package },
  { id: "developer", label: "Developer", icon: Code2 },
];

function AudiencePicker({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-0.5" role="tablist" aria-label="Answer audience">
      {AUDIENCES.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={value === a.id}
          onClick={() => onChange(a.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            value === a.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
          title={`Explain for ${a.label.toLowerCase()} audience`}
        >
          <a.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyNoRepo() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass">
        <Sparkles className="h-8 w-8 text-accent" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No repository yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Paste a GitHub repo, org, or multiple URLs in the bar above and hit Analyze to start the conversation.
      </p>
    </motion.div>
  );
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[#*_>|-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
