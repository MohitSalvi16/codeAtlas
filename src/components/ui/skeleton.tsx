import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-black/[0.04]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-black/[0.06] before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
