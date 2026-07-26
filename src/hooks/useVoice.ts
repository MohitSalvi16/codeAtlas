"use client";

import { useCallback, useRef, useState } from "react";
import type { VoiceState } from "@/lib/types";

export type VoiceEngine = "sarvam" | "browser" | null;

interface SpeakOpts {
  language?: string;
  speaker?: string;
}

interface UseVoice {
  state: VoiceState;
  levels: number[]; // live waveform amplitudes 0..1
  engine: VoiceEngine; // which TTS actually spoke last
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>; // resolves with transcript
  speak: (text: string, opts?: SpeakOpts) => Promise<void>;
  stopSpeaking: () => void;
  setState: (s: VoiceState) => void;
  supported: boolean;
}

/**
 * Voice hook: records mic audio, sends to /api/stt (Sarvam) with a browser
 * SpeechRecognition fallback; plays TTS from /api/tts (Sarvam) with a
 * SpeechSynthesis fallback. Also exposes a live waveform via WebAudio analyser.
 */
export function useVoice(): UseVoice {
  const [state, setState] = useState<VoiceState>("idle");
  const [levels, setLevels] = useState<number[]>(new Array(28).fill(0.05));
  const [engine, setEngine] = useState<VoiceEngine>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Browser SpeechRecognition runs alongside recording as a zero-config fallback.
  const recognitionRef = useRef<any>(null);
  const srTranscriptRef = useRef<string>("");

  const supported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const runAnalyser = useCallback((stream: MediaStream) => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const arr = Array.from({ length: 28 }, (_, i) => {
        const v = data[i % data.length] / 255;
        return Math.max(0.05, v);
      });
      setLevels(arr);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startBrowserSR = useCallback(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) return;
    srTranscriptRef.current = "";
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) srTranscriptRef.current = final;
    };
    try { rec.start(); recognitionRef.current = rec; } catch { /* already started */ }
  }, []);

  const startListening = useCallback(async () => {
    startBrowserSR();
    if (!supported) {
      setState("listening");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.start();
      mediaRef.current = rec;
      runAnalyser(stream);
    } catch {
      /* mic denied — browser SR may still work */
    }
    setState("listening");
  }, [supported, runAnalyser, startBrowserSR]);

  const cleanupMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevels(new Array(28).fill(0.05));
  }, []);

  const stopBrowserSR = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    stopBrowserSR();
    const rec = mediaRef.current;
    // Give SR a moment to flush its final result.
    const srText = await new Promise<string>((resolve) =>
      setTimeout(() => resolve(srTranscriptRef.current.trim()), 250),
    );

    if (!rec) {
      cleanupMic();
      setState("idle");
      return srText;
    }
    const blob: Blob = await new Promise((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      rec.stop();
    });
    cleanupMic();
    setState("thinking");

    // Prefer Sarvam server-side STT; fall back to the browser transcript.
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      if (res.ok) {
        const data = (await res.json()) as { transcript: string };
        setState("idle");
        return data.transcript || srText;
      }
    } catch {
      /* fall through */
    }
    setState("idle");
    return srText;
  }, [cleanupMic, stopBrowserSR]);

  const stopSpeaking = useCallback(() => {
    audioElRef.current?.pause();
    audioElRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  const speak = useCallback(async (text: string, opts?: SpeakOpts) => {
    stopSpeaking();
    setState("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: opts?.language, speaker: opts?.speaker }),
      });
      if (res.ok) {
        const data = (await res.json()) as { audio: string; mime: string };
        const audio = new Audio(`data:${data.mime};base64,${data.audio}`);
        audioElRef.current = audio;
        audio.onended = () => setState("idle");
        audio.onerror = () => setState("idle");
        setEngine("sarvam");
        await audio.play();
        return;
      }
    } catch {
      /* fall through to browser TTS */
    }
    // Browser SpeechSynthesis fallback (OS default voice)
    setEngine("browser");
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const clean = text.replace(/[#*`>_-]/g, "").slice(0, 600);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.onend = () => setState("idle");
      window.speechSynthesis.speak(utter);
    } else {
      setState("idle");
    }
  }, [stopSpeaking]);

  return { state, levels, engine, startListening, stopListening, speak, stopSpeaking, setState, supported };
}
