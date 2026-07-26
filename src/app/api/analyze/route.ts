import { NextRequest, NextResponse } from "next/server";
import { analyzeGithub, listOrgRepos } from "@/lib/github";
import { analyzeByClone } from "@/lib/clone";
import { MOCK_ANALYSIS } from "@/lib/mock-data";
import { buildSystemAnalysis } from "@/lib/services";
import { parseGithubTarget, splitUrls } from "@/lib/utils";
import type { RepoAnalysis } from "@/lib/types";

export const runtime = "nodejs";

function mockFor(owner: string, repo: string): RepoAnalysis {
  return { ...MOCK_ANALYSIS, url: `https://github.com/${owner}/${repo}`, owner, name: repo, source: "mock" };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: string; urls?: string[] };
  const raw = body.urls?.length ? body.urls.join(" ") : body.url || "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "Provide a GitHub repo, org, or multiple repo URLs." }, { status: 400 });
  }

  const urls = splitUrls(raw);
  if (urls.length === 0) {
    return NextResponse.json({ error: "No valid github.com URLs found." }, { status: 400 });
  }

  const warnings: string[] = [];
  let organization = false;

  // Resolve every URL into concrete repo targets (expanding any org URL).
  const targets: { owner: string; repo: string }[] = [];
  for (const u of urls) {
    const t = parseGithubTarget(u);
    if (!t) { warnings.push(`Skipped unrecognized URL: ${u}`); continue; }
    if (t.type === "repo") {
      targets.push({ owner: t.owner, repo: t.repo });
    } else {
      organization = true;
      try {
        const orgRepos = await listOrgRepos(t.owner);
        targets.push(...orgRepos);
      } catch (e) {
        warnings.push(`Org "${t.owner}" expansion failed (${(e as Error).message}). Using sample services.`);
        // Seed a few representative services so the graph still renders.
        ["api-gateway", "auth-service", "orders-service", "web-app"].forEach((r) => targets.push({ owner: t.owner, repo: r }));
      }
    }
  }

  if (targets.length === 0) {
    return NextResponse.json({ error: "Could not resolve any repositories." }, { status: 400 });
  }

  // Analyze each target (cap to keep latency sane), falling back to mock per-repo.
  const capped = targets.slice(0, 8);
  if (targets.length > capped.length) warnings.push(`Analyzed first ${capped.length} of ${targets.length} repositories.`);

  const repos: RepoAnalysis[] = await Promise.all(
    capped.map(async ({ owner, repo }) => {
      // 1) Fast path: GitHub REST (2 calls). 2) On failure (rate limit / private /
      // offline): git clone the repo — bypasses the 60/hr REST limit. 3) Mock.
      try {
        return await analyzeGithub(owner, repo);
      } catch (restErr) {
        try {
          const cloned = await analyzeByClone(owner, repo);
          warnings.push(`${owner}/${repo}: REST unavailable (${(restErr as Error).message}); analyzed via git clone instead.`);
          return cloned;
        } catch (cloneErr) {
          warnings.push(`${owner}/${repo}: live analysis failed (REST: ${(restErr as Error).message}; clone: ${(cloneErr as Error).message}); using sample data.`);
          return mockFor(owner, repo);
        }
      }
    }),
  );

  const system = buildSystemAnalysis(repos, { organization, warnings });
  return NextResponse.json({ system });
}
