"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { AnalyzeProgress, SystemAnalysis } from "@/lib/types";

const STEPS: AnalyzeProgress[] = [
  { step: "clone", label: "Cloning Repository", done: false },
  { step: "framework", label: "Detecting Framework", done: false },
  { step: "files", label: "Reading Files", done: false },
  { step: "architecture", label: "Building Architecture", done: false },
  { step: "ready", label: "Ready", done: false },
];

export function useAnalyze() {
  const setSystem = useAppStore((s) => s.setSystem);
  const setAnalyzing = useAppStore((s) => s.setAnalyzing);
  const clearMessages = useAppStore((s) => s.clearMessages);

  const [progress, setProgress] = useState<AnalyzeProgress[]>(STEPS);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (input: string) => {
      setError(null);
      setAnalyzing(true);
      clearMessages();
      const steps = STEPS.map((s) => ({ ...s, done: false }));
      setProgress(steps);

      // Animate the first steps optimistically while the request runs.
      const timers: ReturnType<typeof setTimeout>[] = [];
      [0, 1, 2, 3].forEach((i, idx) => {
        timers.push(
          setTimeout(() => {
            setProgress((prev) => prev.map((p, j) => (j <= i ? { ...p, done: true } : p)));
          }, 450 * (idx + 1)),
        );
      });

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input }),
        });
        const data = (await res.json()) as { system?: SystemAnalysis; error?: string };
        if (!res.ok || !data.system) throw new Error(data.error || "Analysis failed");

        timers.forEach(clearTimeout);
        setProgress((prev) => prev.map((p) => ({ ...p, done: true })));
        setSystem(data.system);
        return data.system;
      } catch (e) {
        timers.forEach(clearTimeout);
        setError((e as Error).message);
        setProgress(STEPS);
        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    [setAnalyzing, setSystem, clearMessages],
  );

  return { analyze, progress, error };
}
