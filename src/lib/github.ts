import type {
  ArchNode,
  DetectedTech,
  RepoAnalysis,
  RepoFileNode,
} from "./types";

const GH = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

interface GhRepo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
}

interface GhTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

/** Build a nested tree from flat GitHub tree paths. */
function buildTree(items: GhTreeItem[]): RepoFileNode[] {
  const root: RepoFileNode[] = [];
  const dirMap = new Map<string, RepoFileNode>();

  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));
  for (const it of sorted) {
    const parts = it.path.split("/");
    let level = root;
    let prefix = "";
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      prefix = prefix ? `${prefix}/${name}` : name;
      const isLeaf = i === parts.length - 1;
      if (isLeaf) {
        if (it.type === "tree") {
          if (!dirMap.has(prefix)) {
            const node: RepoFileNode = { name, path: prefix, type: "dir", children: [] };
            dirMap.set(prefix, node);
            level.push(node);
          }
        } else {
          level.push({ name, path: prefix, type: "file", size: it.size });
        }
      } else {
        let dir = dirMap.get(prefix);
        if (!dir) {
          dir = { name, path: prefix, type: "dir", children: [] };
          dirMap.set(prefix, dir);
          level.push(dir);
        }
        level = dir.children!;
      }
    }
  }
  return root;
}

/** List an org's (or user's) public repos, most-starred first. */
export async function listOrgRepos(org: string, limit = 6): Promise<{ owner: string; repo: string }[]> {
  // Try org endpoint, fall back to user endpoint.
  for (const path of [`/orgs/${org}/repos`, `/users/${org}/repos`]) {
    const res = await fetch(`${GH}${path}?per_page=50&sort=updated`, { headers: headers() });
    if (res.ok) {
      const repos = (await res.json()) as { name: string; stargazers_count: number; fork: boolean }[];
      return repos
        .filter((r) => !r.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, limit)
        .map((r) => ({ owner: org, repo: r.name }));
    }
  }
  throw new Error(`GitHub org/user "${org}" not found`);
}

const TECH_SIGNALS: { tech: DetectedTech; test: (paths: string[], pkg: string) => boolean }[] = [
  { tech: "Next.js", test: (_, pkg) => /"next"/.test(pkg) },
  { tech: "React", test: (_, pkg) => /"react"/.test(pkg) },
  { tech: "TypeScript", test: (p) => p.some((x) => x.endsWith("tsconfig.json") || x.endsWith(".ts") || x.endsWith(".tsx")) },
  { tech: "Node", test: (p) => p.some((x) => x.endsWith("package.json")) },
  { tech: "Python", test: (p) => p.some((x) => x.endsWith("requirements.txt") || x.endsWith("pyproject.toml") || x.endsWith(".py")) },
  { tech: "Go", test: (p) => p.some((x) => x.endsWith("go.mod")) },
  { tech: "Rust", test: (p) => p.some((x) => x.endsWith("Cargo.toml")) },
  { tech: "Docker", test: (p) => p.some((x) => /dockerfile/i.test(x) || x.endsWith("docker-compose.yml")) },
  { tech: "Kubernetes", test: (p) => p.some((x) => /k8s|kubernetes|deployment\.ya?ml|helm/i.test(x)) },
  { tech: "Tailwind", test: (p, pkg) => /tailwindcss/.test(pkg) || p.some((x) => x.includes("tailwind.config")) },
  { tech: "GraphQL", test: (p, pkg) => /graphql/.test(pkg) || p.some((x) => x.endsWith(".graphql")) },
  { tech: "Postgres", test: (_, pkg) => /"pg"|postgres|prisma/.test(pkg) },
  { tech: "Redis", test: (_, pkg) => /redis|ioredis|bullmq/.test(pkg) },
  { tech: "MongoDB", test: (_, pkg) => /mongoose|mongodb/.test(pkg) },
];

function detectFramework(paths: string[], pkg: string): string {
  if (/"next"/.test(pkg)) return "Next.js";
  if (/"nuxt"/.test(pkg)) return "Nuxt";
  if (/"@angular\/core"/.test(pkg)) return "Angular";
  if (/"svelte"/.test(pkg)) return "SvelteKit";
  if (/"express"/.test(pkg)) return "Express";
  if (/"fastify"/.test(pkg)) return "Fastify";
  if (/"react"/.test(pkg)) return "React";
  if (paths.some((p) => p.endsWith("manage.py"))) return "Django";
  if (paths.some((p) => p.endsWith("go.mod"))) return "Go";
  if (paths.some((p) => p.endsWith("Cargo.toml"))) return "Rust";
  if (paths.some((p) => p.endsWith("Gemfile"))) return "Rails";
  if (paths.some((p) => p.endsWith("pom.xml") || p.endsWith("build.gradle"))) return "Java";
  if (paths.some((p) => p.endsWith("composer.json"))) return "PHP";
  return "Unknown";
}

const EXT_LANG: Record<string, string> = {
  ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
  py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby", php: "PHP",
  c: "C", cpp: "C++", cs: "C#", swift: "Swift", kt: "Kotlin", scala: "Scala",
};

/** Guess primary language from file extensions when GitHub reports none. */
function inferLangFromPaths(paths: string[]): string | null {
  const counts = new Map<string, number>();
  for (const p of paths) {
    const ext = p.split(".").pop()?.toLowerCase();
    const lang = ext && EXT_LANG[ext];
    if (lang) counts.set(lang, (counts.get(lang) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/** When no framework is detected, produce an informative label (never "Unknown"). */
function inferFrameworkFallback(primary: string, techs: DetectedTech[], paths: string[]): string {
  if (paths.some((p) => /(^|\/)(requirements\.txt|pyproject\.toml)$/i.test(p))) {
    if (paths.some((p) => /fastapi/i.test(p))) return "FastAPI";
    if (paths.some((p) => /flask/i.test(p))) return "Flask";
    return "Python";
  }
  if (techs.includes("Docker") || techs.includes("Kubernetes")) return "Containerized service";
  if (primary && primary !== "Unknown") return `${primary} project`;
  return "Library";
}

function countBy(paths: string[], re: RegExp): number {
  return paths.filter((p) => re.test(p)).length;
}

function buildArchitecture(techs: DetectedTech[]): ArchNode[] {
  const nodes: ArchNode[] = [];
  const hasFront = techs.includes("React") || techs.includes("Next.js");
  if (hasFront) nodes.push({ id: "web", label: techs.includes("Next.js") ? "Next.js App" : "Frontend", kind: "frontend", children: ["api"] });
  nodes.push({ id: "api", label: "API Layer", kind: "backend", children: ["svc"] });
  nodes.push({ id: "svc", label: "Services", kind: "backend", children: [] });
  if (techs.includes("Postgres")) { nodes.push({ id: "db", label: "PostgreSQL", kind: "data" }); nodes.find((n) => n.id === "svc")!.children!.push("db"); }
  if (techs.includes("MongoDB")) { nodes.push({ id: "mongo", label: "MongoDB", kind: "data" }); nodes.find((n) => n.id === "svc")!.children!.push("mongo"); }
  if (techs.includes("Redis")) { nodes.push({ id: "cache", label: "Redis", kind: "data" }); nodes.find((n) => n.id === "svc")!.children!.push("cache"); }
  if (techs.includes("Docker") || techs.includes("Kubernetes")) nodes.push({ id: "infra", label: techs.includes("Kubernetes") ? "Kubernetes" : "Docker", kind: "infra", children: hasFront ? ["web", "api"] : ["api"] });
  return nodes;
}

/**
 * Analyze a public GitHub repo via REST. Throws on failure so the API route
 * can fall back to mock data.
 */
export async function analyzeGithub(owner: string, repo: string): Promise<RepoAnalysis> {
  const repoRes = await fetch(`${GH}/repos/${owner}/${repo}`, { headers: headers() });
  if (!repoRes.ok) throw new Error(`GitHub repo ${repoRes.status}`);
  const meta = (await repoRes.json()) as GhRepo;

  const treeRes = await fetch(
    `${GH}/repos/${owner}/${repo}/git/trees/${meta.default_branch}?recursive=1`,
    { headers: headers() },
  );
  if (!treeRes.ok) throw new Error(`GitHub tree ${treeRes.status}`);
  const treeData = (await treeRes.json()) as { tree: GhTreeItem[]; truncated: boolean };
  const items = treeData.tree.slice(0, 3000);
  // package.json + README via raw CDN (no REST quota cost).
  let pkg = "";
  try {
    const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${meta.default_branch}/package.json`);
    if (pkgRes.ok) pkg = await pkgRes.text();
  } catch { /* ignore */ }

  let readme = "";
  for (const name of ["README.md", "readme.md", "Readme.md", "README.rst"]) {
    try {
      const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${meta.default_branch}/${name}`);
      if (r.ok) { readme = (await r.text()).slice(0, 4000); break; }
    } catch { /* ignore */ }
  }

  // Language breakdown — only spend a REST call on /languages when authenticated.
  let langBreakdown: { name: string; bytes: number }[] = [];
  if (process.env.GITHUB_TOKEN) {
    try {
      const lr = await fetch(`${GH}/repos/${owner}/${repo}/languages`, { headers: headers() });
      if (lr.ok) {
        const obj = (await lr.json()) as Record<string, number>;
        langBreakdown = Object.entries(obj).map(([name, bytes]) => ({ name, bytes })).sort((a, b) => b.bytes - a.bytes);
      }
    } catch { /* ignore */ }
  }

  return buildAnalysisFromItems({
    owner, repo, name: meta.name, branch: meta.default_branch,
    description: meta.description, stars: meta.stargazers_count, forks: meta.forks_count,
    language: meta.language, items, pkg, readme, langBreakdown, source: "github",
  });
}

export interface AnalysisInput {
  owner: string;
  repo: string;
  name: string;
  branch: string;
  description?: string | null;
  stars?: number;
  forks?: number;
  language?: string | null;
  items: GhTreeItem[];
  pkg?: string;
  readme?: string;
  langBreakdown?: { name: string; bytes: number }[];
  source?: "github" | "mock";
}

/** Pure analysis builder shared by the REST and git-clone code paths. */
export function buildAnalysisFromItems(input: AnalysisInput): RepoAnalysis {
  const { owner, repo, name, branch, items, pkg = "", readme = "", langBreakdown = [] } = input;
  const paths = items.map((i) => i.path);
  const technologies = TECH_SIGNALS.filter((s) => s.test(paths, pkg)).map((s) => s.tech);
  let framework = detectFramework(paths, pkg);

  const files = items.filter((i) => i.type === "blob");
  const filePaths = files.map((f) => f.path);
  const CODE = "(ts|tsx|js|jsx|py|go|rb|java|cs|php|rs)";
  const apiCount = countBy(filePaths, new RegExp(`(^|/)(api|routes?|handlers?|endpoints?)/.+\\.${CODE}$`, "i"));
  const components = countBy(filePaths, /(^|\/)components?\/.+\.(tsx|jsx|vue|svelte)$/i);
  const services = countBy(filePaths, new RegExp(`[\\w.-]*service[\\w.-]*\\.${CODE}$`, "i"));
  const controllers = countBy(filePaths, new RegExp(`[\\w.-]*controller[\\w.-]*\\.${CODE}$`, "i"));
  const models = countBy(filePaths, new RegExp(`([\\w.-]*model[\\w.-]*|schema)\\.(${CODE.slice(1, -1)}|prisma|sql)$`, "i"));
  const depCount = (() => { try { const j = JSON.parse(pkg || "{}"); return Object.keys(j.dependencies || {}).length + Object.keys(j.devDependencies || {}).length; } catch { return 0; } })();

  const langColors: Record<string, string> = {
    TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
    Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", Ruby: "#701516",
  };
  const primary = input.language || langBreakdown[0]?.name || inferLangFromPaths(paths) || "Unknown";
  if (framework === "Unknown") framework = inferFrameworkFallback(primary, technologies, paths);

  const extraColors: Record<string, string> = {
    HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Dockerfile: "#384d54",
    Vue: "#41b883", "C#": "#178600", PHP: "#4F5D95", Kotlin: "#A97BFF", Swift: "#F05138",
  };
  const colorFor = (n: string) => langColors[n] || extraColors[n] || "#8b949e";
  const totalBytes = langBreakdown.reduce((a, l) => a + l.bytes, 0) || 1;
  const languages = langBreakdown.length
    ? langBreakdown.slice(0, 5).map((l) => ({ name: l.name, percent: Math.max(1, Math.round((l.bytes / totalBytes) * 100)), color: colorFor(l.name) }))
    : [{ name: primary, percent: 100, color: colorFor(primary) }];

  return {
    url: `https://github.com/${owner}/${repo}`,
    owner,
    name,
    description: input.description || "No description provided.",
    stars: input.stars ?? 0,
    forks: input.forks ?? 0,
    language: primary,
    framework,
    branch,
    technologies: technologies.length ? technologies : ["Node"],
    tree: buildTree(items),
    insights: {
      architecture: `Detected a ${framework} project in ${primary}. Heuristic file-name estimate: ~${apiCount} API/route, ~${services} service, ~${controllers} controller, ~${models} model/schema files. Ask the chat for a real architecture breakdown.`,
      authentication: paths.some((p) => /auth|jwt|passport|session|oauth/i.test(p))
        ? "Auth-related files detected (auth/jwt/oauth/session). Review them for token handling and password hashing."
        : "No obvious auth layer detected in file names.",
      database: technologies.filter((t) => ["Postgres", "Redis", "MongoDB"].includes(t)).join(", ") || "No datastore signal detected from dependencies.",
      apiCount, components, controllers, services, models, routes: apiCount,
    },
    stats: {
      linesOfCode: files.reduce((a, f) => a + Math.round((f.size || 0) / 40), 0),
      files: files.length,
      languages,
      largestFolder: (() => {
        const counts = new Map<string, number>();
        for (const p of paths) { const top = p.split("/")[0]; counts.set(top, (counts.get(top) || 0) + 1); }
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        return top ? `${top[0]} (${top[1]} files)` : "n/a";
      })(),
      dependencies: depCount,
    },
    architecture: buildArchitecture(technologies),
    readme: readme || `# ${name}`,
    source: input.source || "github",
  };
}
