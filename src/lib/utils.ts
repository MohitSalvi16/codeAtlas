import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Parse "https://github.com/owner/repo(.git)?" into { owner, repo }. */
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, "");
    const m = cleaned.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
    if (!m) return null;
    return { owner: m[1], repo: m[2] };
  } catch {
    return null;
  }
}

/** Classify a GitHub URL as a specific repo or an org/user page. */
export function parseGithubTarget(
  url: string,
): { type: "repo"; owner: string; repo: string } | { type: "org"; owner: string } | null {
  const repo = parseGithubUrl(url);
  if (repo) return { type: "repo", ...repo };
  const cleaned = url.trim().replace(/\/+$/, "");
  const m = cleaned.match(/github\.com[/:]([^/#?]+)$/i);
  if (m && m[1] && !["orgs", "features", "about", "pricing"].includes(m[1].toLowerCase())) {
    return { type: "org", owner: m[1] };
  }
  return null;
}

/** Split a textarea/comma/space separated blob into candidate URLs. */
export function splitUrls(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /github\.com/i.test(s));
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
