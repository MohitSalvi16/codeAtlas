"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mermaid } from "@/components/mermaid";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-black/10 bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-black/10 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{language || "code"}</span>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.8rem", padding: "1rem" }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export const Markdown = memo(function Markdown({ content, className, streaming }: { content: string; className?: string; streaming?: boolean }) {
  return (
    <div className={cn("prose-chat max-w-none text-sm leading-relaxed text-foreground/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const value = String(children).replace(/\n$/, "");
            if (match?.[1] === "mermaid") return <Mermaid code={value} streaming={streaming} />;
            if (match) return <CodeBlock language={match[1]} value={value} />;
            return (
              <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.8em] font-medium text-primary" {...props}>
                {children}
              </code>
            );
          },
          h1: (p) => <h1 className="mb-2 mt-4 text-xl font-bold" {...p} />,
          h2: (p) => <h2 className="mb-2 mt-4 text-lg font-semibold text-gradient" {...p} />,
          h3: (p) => <h3 className="mb-1 mt-3 text-base font-semibold" {...p} />,
          p: (p) => <p className="mb-3 leading-relaxed" {...p} />,
          ul: (p) => <ul className="mb-3 ml-5 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...p} />,
          a: (p) => <a className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noreferrer" {...p} />,
          blockquote: (p) => <blockquote className="my-3 border-l-2 border-primary/50 pl-3 italic text-muted-foreground" {...p} />,
          table: (p) => <div className="my-3 overflow-x-auto"><table className="w-full border-collapse text-xs" {...p} /></div>,
          th: (p) => <th className="border border-black/10 bg-black/[0.04] px-3 py-1.5 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-black/10 px-3 py-1.5" {...p} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
