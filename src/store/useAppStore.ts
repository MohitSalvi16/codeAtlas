"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Audience, ChatMessage, RepoAnalysis, Session, SystemAnalysis } from "@/lib/types";
import { uid } from "@/lib/utils";

interface AppState {
  // repo / system
  analysis: RepoAnalysis | null;
  system: SystemAnalysis | null;
  analyzing: boolean;
  setSystem: (s: SystemAnalysis | null) => void;
  setAnalysis: (a: RepoAnalysis | null) => void;
  setAnalyzing: (b: boolean) => void;

  // chat
  messages: ChatMessage[];
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt">) => string;
  appendToMessage: (id: string, chunk: string) => void;
  finishMessage: (id: string) => void;
  togglePin: (id: string) => void;
  clearMessages: () => void;

  // sessions / history
  sessions: Session[];
  saveSession: () => void;
  loadSession: (id: string) => void;
  removeSession: (id: string) => void;
  newSession: () => void;

  // ui
  voiceEnabled: boolean;
  setVoiceEnabled: (b: boolean) => void;

  // audience — tailors answer tone (business owner by default)
  audience: Audience;
  setAudience: (a: Audience) => void;

  // voice settings
  autoSpeak: boolean;
  setAutoSpeak: (b: boolean) => void;
  ttsLanguage: string;
  setTtsLanguage: (l: string) => void;
  ttsSpeaker: string;
  setTtsSpeaker: (s: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      analysis: null,
      system: null,
      analyzing: false,
      setSystem: (s) => set({ system: s, analysis: s ? s.primary : null }),
      setAnalysis: (a) => set({ analysis: a }),
      setAnalyzing: (b) => set({ analyzing: b }),

      messages: [],
      addMessage: (m) => {
        const id = uid("msg_");
        set((s) => ({ messages: [...s.messages, { ...m, id, createdAt: Date.now() }] }));
        return id;
      },
      appendToMessage: (id, chunk) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + chunk } : m,
          ),
        })),
      finishMessage: (id) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
        })),
      togglePin: (id) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
        })),
      clearMessages: () => set({ messages: [] }),

      sessions: [],
      saveSession: () => {
        const { analysis, messages, sessions } = get();
        if (!analysis || messages.length === 0) return;
        const existing = sessions.find((s) => s.repoUrl === analysis.url);
        const session: Session = {
          id: existing?.id || uid("ses_"),
          repoUrl: analysis.url,
          repoName: `${analysis.owner}/${analysis.name}`,
          createdAt: Date.now(),
          messages,
        };
        set({
          sessions: [session, ...sessions.filter((s) => s.id !== session.id)].slice(0, 20),
        });
      },
      loadSession: (id) => {
        const s = get().sessions.find((x) => x.id === id);
        if (s) set({ messages: s.messages });
      },
      removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      newSession: () => set({ messages: [], analysis: null, system: null }),

      voiceEnabled: true,
      setVoiceEnabled: (b) => set({ voiceEnabled: b }),

      audience: "business",
      setAudience: (a) => set({ audience: a }),

      autoSpeak: true,
      setAutoSpeak: (b) => set({ autoSpeak: b }),
      ttsLanguage: "en-IN",
      setTtsLanguage: (l) => set({ ttsLanguage: l }),
      ttsSpeaker: "shubh",
      setTtsSpeaker: (s) => set({ ttsSpeaker: s }),
    }),
    {
      name: "codeatlas-store",
      partialize: (s) => ({
        sessions: s.sessions,
        voiceEnabled: s.voiceEnabled,
        audience: s.audience,
        autoSpeak: s.autoSpeak,
        ttsLanguage: s.ttsLanguage,
        ttsSpeaker: s.ttsSpeaker,
      }),
    },
  ),
);
