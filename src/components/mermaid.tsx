"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

let initialized = false;
let counter = 0;

/**
 * Renders a Mermaid diagram from source. Safe during streaming: invalid/partial
 * source shows a lightweight "building diagram…" state instead of crashing.
 */
export function Mermaid({ code, streaming }: { code: string; streaming?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    // Don't attempt to render an obviously-incomplete diagram mid-stream.
    if (streaming) return;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "loose",
            theme: "base",
            themeVariables: {
              primaryColor: "#EEF2FF",
              primaryBorderColor: "#4F46E5",
              primaryTextColor: "#1e293b",
              lineColor: "#64748b",
              secondaryColor: "#ECFEFF",
              tertiaryColor: "#F8FAFC",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            },
          });
          initialized = true;
        }
        const id = `mmd-${counter++}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (!cancelled) { setSvg(svg); setError(false); }
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [code, streaming]);

  if (streaming) {
    return (
      <div className="my-3 flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building diagram…
      </div>
    );
  }

  if (error) {
    // Fall back to showing the raw source so nothing is lost.
    return (
      <pre className="my-3 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs text-muted-foreground">
        {code}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-diagram my-3 flex justify-center overflow-x-auto rounded-xl border border-black/10 bg-white p-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
