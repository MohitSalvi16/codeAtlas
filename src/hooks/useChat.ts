"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useChat(onAssistantDone?: (text: string) => void) {
  const analysis = useAppStore((s) => s.analysis);
  const audience = useAppStore((s) => s.audience);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const appendToMessage = useAppStore((s) => s.appendToMessage);
  const finishMessage = useAppStore((s) => s.finishMessage);
  const saveSession = useAppStore((s) => s.saveSession);
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async (question: string) => {
      if (!analysis || !question.trim() || sending) return;
      setSending(true);
      addMessage({ role: "user", content: question });
      const assistantId = addMessage({ role: "assistant", content: "", streaming: true });

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      let full = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo: analysis, history, question, audience }),
        });
        if (!res.body) throw new Error("No response stream");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          appendToMessage(assistantId, chunk);
        }
      } catch (e) {
        const msg = `\n\n> ⚠️ ${(e as Error).message}`;
        full += msg;
        appendToMessage(assistantId, msg);
      } finally {
        finishMessage(assistantId);
        setSending(false);
        saveSession();
        onAssistantDone?.(full);
      }
      return full;
    },
    [analysis, audience, messages, sending, addMessage, appendToMessage, finishMessage, saveSession, onAssistantDone],
  );

  return { send, sending };
}
