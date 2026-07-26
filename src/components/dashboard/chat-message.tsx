"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check, Pin, Volume2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { ChatMessage as TMessage } from "@/lib/types";

export function ChatMessage({ message, onSpeak }: { message: TMessage; onSpeak?: (text: string) => void }) {
  const isUser = message.role === "user";
  const togglePin = useAppStore((s) => s.togglePin);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex gap-3", isUser && "flex-row-reverse")}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-black/[0.06]" : "bg-gradient-to-br from-primary to-accent shadow-glow",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
      </span>

      <div className={cn("min-w-0 max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser ? "bg-primary text-primary-foreground" : "glass",
            message.pinned && "ring-1 ring-accent/50",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : message.content ? (
            <Markdown content={message.content} streaming={message.streaming} />
          ) : (
            <span className="flex gap-1 py-1">
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" style={{ animationDelay: "0.2s" }} />
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" style={{ animationDelay: "0.4s" }} />
            </span>
          )}
        </div>

        {!isUser && message.content && !message.streaming && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={copy} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => togglePin(message.id)} className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:text-foreground", message.pinned ? "text-accent" : "text-muted-foreground")}>
              <Pin className="h-3.5 w-3.5" /> {message.pinned ? "Pinned" : "Pin"}
            </button>
            {onSpeak && (
              <button onClick={() => onSpeak(message.content)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <Volume2 className="h-3.5 w-3.5" /> Play
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
