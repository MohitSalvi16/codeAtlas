import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/10 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Compass className="h-4 w-4 text-white" />
          </span>
          <span className="font-semibold">CodeAtlas</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Built with Next.js & Sarvam AI. © {new Date().getFullYear()} CodeAtlas.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground">Features</Link>
          <Link href="/dashboard" className="hover:text-foreground">Demo</Link>
          <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
