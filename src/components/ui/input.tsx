import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-black/10 bg-black/[0.025] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
