import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAnalysisFromItems } from "./github";
import type { RepoAnalysis } from "./types";

const exec = promisify(execFile);

const IGNORE = new Set([".git", "node_modules", ".next", "dist", "build", "vendor", "target", ".venv", "__pycache__"]);

interface ItemLite { path: string; type: "blob" | "tree"; size?: number }

/** Recursively walk a cloned repo into a flat item list (relative paths). */
async function walk(root: string, dir = "", acc: ItemLite[] = [], budget = { n: 0 }): Promise<ItemLite[]> {
  if (budget.n > 6000) return acc;
  const abs = join(root, dir);
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (IGNORE.has(e.name) || e.name.startsWith(".git")) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) {
      acc.push({ path: rel, type: "tree" });
      await walk(root, rel, acc, budget);
    } else if (e.isFile()) {
      budget.n++;
      let size: number | undefined;
      try { size = (await stat(join(root, rel))).size; } catch { /* ignore */ }
      acc.push({ path: rel, type: "blob", size });
    }
  }
  return acc;
}

async function readIf(root: string, names: string[]): Promise<string> {
  for (const n of names) {
    try {
      return await readFile(join(root, n), "utf8");
    } catch {
      /* try next */
    }
  }
  return "";
}

/**
 * Clone a public repo shallowly and analyze it from disk. This bypasses the
 * GitHub REST 60/hr rate limit entirely (git protocol is separate). Requires
 * `git` on PATH and filesystem access (works in local/Node dev; not on edge).
 */
export async function analyzeByClone(owner: string, repo: string): Promise<RepoAnalysis> {
  const dir = await mkdtemp(join(tmpdir(), "codeatlas-"));
  const url = `https://github.com/${owner}/${repo}.git`;
  try {
    // Shallow, single-branch, no checkout of history/blobs we don't need.
    await exec(
      "git",
      ["clone", "--depth", "1", "--single-branch", "--no-tags", url, dir],
      { timeout: 120_000, maxBuffer: 1024 * 1024 * 16, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
    );

    // Determine the checked-out branch name.
    let branch = "main";
    try {
      const { stdout } = await exec("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"], { timeout: 10_000 });
      branch = stdout.trim() || "main";
    } catch { /* ignore */ }

    const items = await walk(dir);
    const pkg = await readIf(dir, ["package.json"]);
    const readme = (await readIf(dir, ["README.md", "readme.md", "Readme.md", "README.rst"])).slice(0, 4000);

    return buildAnalysisFromItems({
      owner, repo, name: repo, branch,
      description: readme.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.slice(0, 160) || null,
      items, pkg, readme, source: "github",
    });
  } finally {
    // Best-effort cleanup.
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
