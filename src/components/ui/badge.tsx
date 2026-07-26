import * as React from "react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  default: "bg-primary/10 text-indigo-700 border-primary/20",
  accent: "bg-accent/10 text-cyan-700 border-accent/30",
  muted: "bg-black/[0.04] text-muted-foreground border-black/10",
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  danger: "bg-red-500/10 text-red-700 border-red-500/30",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
