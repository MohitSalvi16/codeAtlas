import type { RepoAnalysis, RepoFileNode } from "./types";

const tree: RepoFileNode[] = [
  {
    name: "src",
    path: "src",
    type: "dir",
    children: [
      {
        name: "app",
        path: "src/app",
        type: "dir",
        children: [
          { name: "layout.tsx", path: "src/app/layout.tsx", type: "file", size: 1240 },
          { name: "page.tsx", path: "src/app/page.tsx", type: "file", size: 3820 },
          {
            name: "api",
            path: "src/app/api",
            type: "dir",
            children: [
              { name: "auth/route.ts", path: "src/app/api/auth/route.ts", type: "file", size: 2100 },
              { name: "users/route.ts", path: "src/app/api/users/route.ts", type: "file", size: 1780 },
              { name: "orders/route.ts", path: "src/app/api/orders/route.ts", type: "file", size: 2440 },
            ],
          },
        ],
      },
      {
        name: "components",
        path: "src/components",
        type: "dir",
        children: [
          { name: "Navbar.tsx", path: "src/components/Navbar.tsx", type: "file", size: 1560 },
          { name: "Dashboard.tsx", path: "src/components/Dashboard.tsx", type: "file", size: 4200 },
          { name: "OrderTable.tsx", path: "src/components/OrderTable.tsx", type: "file", size: 3100 },
        ],
      },
      {
        name: "server",
        path: "src/server",
        type: "dir",
        children: [
          { name: "auth.service.ts", path: "src/server/auth.service.ts", type: "file", size: 2900 },
          { name: "user.controller.ts", path: "src/server/user.controller.ts", type: "file", size: 2600 },
          { name: "order.model.ts", path: "src/server/order.model.ts", type: "file", size: 1900 },
          { name: "db.ts", path: "src/server/db.ts", type: "file", size: 820 },
        ],
      },
      { name: "lib/utils.ts", path: "src/lib/utils.ts", type: "file", size: 640 },
    ],
  },
  {
    name: "infra",
    path: "infra",
    type: "dir",
    children: [
      { name: "Dockerfile", path: "infra/Dockerfile", type: "file", size: 420 },
      { name: "docker-compose.yml", path: "infra/docker-compose.yml", type: "file", size: 680 },
      { name: "k8s/deployment.yaml", path: "infra/k8s/deployment.yaml", type: "file", size: 1120 },
    ],
  },
  { name: "package.json", path: "package.json", type: "file", size: 1340 },
  { name: "README.md", path: "README.md", type: "file", size: 5200 },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file", size: 620 },
];

export const MOCK_ANALYSIS: RepoAnalysis = {
  url: "https://github.com/acme/shopflow",
  owner: "acme",
  name: "shopflow",
  description:
    "ShopFlow — a full-stack commerce platform with a Next.js storefront, Node API, Postgres, and Redis-backed queues. Deployed on Kubernetes.",
  stars: 4820,
  forks: 612,
  language: "TypeScript",
  framework: "Next.js",
  branch: "main",
  technologies: ["Next.js", "React", "TypeScript", "Node", "Postgres", "Redis", "Docker", "Kubernetes", "Tailwind"],
  tree,
  insights: {
    architecture:
      "Layered monolith: Next.js App Router frontend + colocated API routes calling a service/controller/model layer over Postgres. Redis handles sessions and a background job queue.",
    authentication:
      "JWT access tokens (15m) + rotating refresh tokens stored in httpOnly cookies. Passwords hashed with bcrypt (cost 12). OAuth via GitHub + Google.",
    database: "PostgreSQL 15 (primary) with Prisma ORM. Redis 7 for sessions, rate-limits, and BullMQ job queue.",
    apiCount: 14,
    components: 23,
    controllers: 5,
    services: 7,
    models: 9,
    routes: 14,
  },
  stats: {
    linesOfCode: 28430,
    files: 214,
    languages: [
      { name: "TypeScript", percent: 71, color: "#3178c6" },
      { name: "CSS", percent: 12, color: "#563d7c" },
      { name: "JavaScript", percent: 9, color: "#f1e05a" },
      { name: "Dockerfile", percent: 4, color: "#384d54" },
      { name: "Other", percent: 4, color: "#8b949e" },
    ],
    largestFolder: "src/components (23 files)",
    dependencies: 47,
  },
  architecture: [
    { id: "web", label: "Next.js Storefront", kind: "frontend", children: ["api"] },
    { id: "api", label: "API Routes", kind: "backend", children: ["svc", "cache"] },
    { id: "svc", label: "Service Layer", kind: "backend", children: ["db", "queue"] },
    { id: "db", label: "PostgreSQL", kind: "data" },
    { id: "cache", label: "Redis", kind: "data", children: ["queue"] },
    { id: "queue", label: "BullMQ Workers", kind: "backend" },
    { id: "oauth", label: "GitHub / Google OAuth", kind: "external" },
    { id: "k8s", label: "Kubernetes", kind: "infra", children: ["web", "api"] },
  ],
  readme:
    "# ShopFlow\n\nFull-stack commerce platform. Next.js + Node + Postgres + Redis, shipped on Kubernetes.\n\n## Quick start\n\n```bash\nnpm install\nnpm run dev\n```\n\n## Architecture\n\n- **Frontend**: Next.js App Router, React 19, Tailwind\n- **Backend**: API routes → services → Prisma → Postgres\n- **Async**: BullMQ workers on Redis\n- **Auth**: JWT + refresh rotation, OAuth\n",
  source: "mock",
};

export const SUGGESTED_QUESTIONS = [
  "Explain authentication",
  "Show API endpoints",
  "Explain folder structure",
  "Find performance issues",
  "Find security issues",
  "Generate onboarding guide",
];

/** Deterministic mock answer generator so chat works with zero API keys. */
export function mockAnswer(question: string, repo: RepoAnalysis): string {
  const q = question.toLowerCase();
  if (q.includes("auth")) {
    return `## Authentication in \`${repo.name}\`\n\n${repo.insights.authentication}\n\n**Flow:**\n\n1. User signs in → \`POST /api/auth\` (\`src/app/api/auth/route.ts\`).\n2. Credentials verified in \`src/server/auth.service.ts\` (bcrypt, cost 12).\n3. Short-lived JWT (15m) issued + refresh token set as \`httpOnly\` cookie.\n4. Refresh rotation on \`/api/auth/refresh\`.\n\n\`\`\`ts\n// src/server/auth.service.ts\nexport async function issueTokens(userId: string) {\n  const access = signJwt({ sub: userId }, { expiresIn: "15m" });\n  const refresh = await rotateRefreshToken(userId);\n  return { access, refresh };\n}\n\`\`\`\n\n> Tip: consider binding refresh tokens to a device fingerprint to reduce replay risk.`;
  }
  if (q.includes("api") || q.includes("endpoint")) {
    return `## API Endpoints (${repo.insights.apiCount} total)\n\n| Method | Route | File |\n|---|---|---|\n| POST | \`/api/auth\` | \`src/app/api/auth/route.ts\` |\n| GET | \`/api/users\` | \`src/app/api/users/route.ts\` |\n| POST | \`/api/orders\` | \`src/app/api/orders/route.ts\` |\n| GET | \`/api/orders/:id\` | \`src/app/api/orders/route.ts\` |\n\nAll routes run through a shared auth middleware and Zod validation.`;
  }
  if (q.includes("folder") || q.includes("structure")) {
    return `## Folder Structure\n\n\`\`\`\nsrc/\n  app/         # Next.js App Router (pages + API routes)\n  components/  # ${repo.insights.components} React components\n  server/      # services, controllers, models (business logic)\n  lib/         # shared utilities\ninfra/         # Dockerfile, compose, k8s manifests\n\`\`\`\n\nThe codebase follows a **layered** approach: UI → API route → service → model → DB.`;
  }
  if (q.includes("performance")) {
    return `## Performance Observations\n\n1. **N+1 queries** likely in \`src/server/order.model.ts\` — order lines fetched per row. Use \`include\` / a join.\n2. **No pagination** on \`GET /api/users\` — returns full table.\n3. **Redis** already caches sessions; extend it to hot product reads.\n4. **Bundle**: \`OrderTable.tsx\` (3.1kb) imports a full charting lib — lazy-load it.\n\n\`\`\`ts\n// Fix N+1\nconst orders = await prisma.order.findMany({ include: { lines: true } });\n\`\`\``;
  }
  if (q.includes("security")) {
    return `## Security Review (high level)\n\n- ⚠️ **Secrets**: verify \`infra/k8s/deployment.yaml\` pulls from a Secret, not inline env.\n- ⚠️ **Dockerfile**: confirm a non-root \`USER\` and pinned base image in \`infra/Dockerfile\`.\n- ✅ **Auth**: bcrypt + short JWT + httpOnly refresh — solid baseline.\n- ⚠️ **Input**: ensure Zod validation on every route; \`/api/orders\` writes user input.\n\nRun a dedicated scanner (Semgrep/Trivy/Gitleaks) for line-level findings.`;
  }
  if (q.includes("onboard")) {
    return `## Onboarding Guide — \`${repo.name}\`\n\n**1. Setup**\n\`\`\`bash\ngit clone ${repo.url}\nnpm install\ncp .env.example .env.local\nnpm run dev\n\`\`\`\n\n**2. Mental model**\nUI (\`src/app\`) → API routes (\`src/app/api\`) → services (\`src/server\`) → Postgres via Prisma.\n\n**3. First task ideas**\n- Add pagination to \`GET /api/users\`.\n- Write a test for \`auth.service.ts\`.\n\n**4. Infra**\nDocker + k8s manifests live in \`infra/\`.`;
  }
  return `Here's what I found about **"${question}"** in \`${repo.name}\`:\n\n${repo.insights.architecture}\n\n\`\`\`mermaid\nflowchart LR\n  User([User]) --> App[${repo.framework} App]\n  App --> API[API Layer]\n  API --> DB[(Database)]\n  API --> Ext[External Services]\n\`\`\`\n\nThe project is a **${repo.framework}** app in **${repo.language}** using ${repo.technologies.join(", ")}. Ask me to explain authentication, list API endpoints, or find security issues for a deeper dive.`;
}
