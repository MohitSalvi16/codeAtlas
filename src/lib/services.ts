import type {
  CommProtocol,
  DetectedTech,
  RepoAnalysis,
  RepoFileNode,
  ServiceEdge,
  ServiceKind,
  ServiceNode,
  SystemAnalysis,
  SystemGraph,
  WorkspaceKind,
} from "./types";
import { uid } from "./utils";

/** Flatten a file tree into a list of paths. */
export function flattenPaths(nodes: RepoFileNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    acc.push(n.path);
    if (n.children) flattenPaths(n.children, acc);
  }
  return acc;
}

/** Detect protocols used by a repo from its tech + file paths. */
function detectProtocols(tech: DetectedTech[], paths: string[]): CommProtocol[] {
  const p = new Set<CommProtocol>();
  const blob = paths.join("\n").toLowerCase();
  if (tech.includes("GraphQL") || /\.graphql|resolver|apollo/.test(blob)) p.add("GraphQL");
  if (/\.proto\b|grpc/.test(blob)) p.add("gRPC");
  if (/kafka|kafkajs/.test(blob)) p.add("Kafka");
  if (/rabbit|amqp/.test(blob)) p.add("RabbitMQ");
  if (tech.includes("Redis") && /stream|xadd|xreadgroup/.test(blob)) p.add("Redis Streams");
  if (/socket\.io|websocket|\bws\b/.test(blob)) p.add("WebSocket");
  // REST is the default assumption for any HTTP service.
  if (p.size === 0 || /api\/|routes?\/|express|fastify|controller/.test(blob)) p.add("REST");
  return [...p];
}

/** Infer event topics / queues produced or consumed from path + name hints. */
function detectEvents(name: string, paths: string[]): { produces: string[]; consumes: string[] } {
  const blob = paths.join(" ").toLowerCase();
  const produces: string[] = [];
  const consumes: string[] = [];
  if (/producer|publish|emit/.test(blob) || /publisher/.test(name)) produces.push(`${name}.events`);
  if (/consumer|subscribe|worker|listener/.test(blob) || /consumer|worker/.test(name)) consumes.push(`${name}.events`);
  if (/order/.test(name)) produces.push("order.created");
  if (/payment/.test(name)) consumes.push("order.created");
  if (/notification|email|mailer/.test(name)) consumes.push("order.created");
  return { produces, consumes };
}

function classify(name: string, tech: DetectedTech[], paths: string[]): ServiceKind {
  const n = name.toLowerCase();
  if (/gateway|api-gw|apigw|edge|proxy|bff/.test(n)) return "gateway";
  if (/worker|consumer|job|cron|scheduler/.test(n)) return "worker";
  if (/shared|common|lib|utils|packages?\/|core$|types$|sdk/.test(n) && !paths.some((p) => /api\/|route/.test(p)))
    return "shared-lib";
  if (tech.includes("React") || tech.includes("Next.js")) return "frontend";
  return "backend";
}

function inferOwner(name: string): string {
  // Deterministic pseudo-ownership so the UI has a "team" column.
  const teams = ["@platform", "@payments", "@growth", "@core", "@infra", "@identity"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return teams[h % teams.length];
}

function repoToService(repo: RepoAnalysis, path?: string): ServiceNode {
  const paths = flattenPaths(repo.tree);
  const name = path ? path.split("/").pop()! : repo.name;
  const databases = repo.technologies.filter((t) => ["Postgres", "Redis", "MongoDB"].includes(t));
  const { produces, consumes } = detectEvents(name, paths);
  return {
    id: uid("svc_"),
    name,
    kind: classify(name, repo.technologies, paths),
    repo: `${repo.owner}/${repo.name}`,
    tech: repo.technologies,
    databases,
    produces,
    consumes,
    protocols: detectProtocols(repo.technologies, paths),
    owner: inferOwner(name),
    path,
  };
}

/** Find monorepo package/app directories inside a single repo tree. */
function extractMonorepoPackages(repo: RepoAnalysis): { name: string; path: string }[] {
  const out: { name: string; path: string }[] = [];
  for (const top of repo.tree) {
    if (top.type === "dir" && /^(packages|apps|services)$/i.test(top.name) && top.children) {
      for (const child of top.children) {
        if (child.type === "dir") out.push({ name: child.name, path: child.path });
      }
    }
  }
  return out;
}

/** Heuristic: is this single repo actually a monorepo? */
export function looksLikeMonorepo(repo: RepoAnalysis): boolean {
  const paths = flattenPaths(repo.tree);
  const hasWorkspaceCfg = paths.some((p) =>
    /(^|\/)(pnpm-workspace\.yaml|lerna\.json|turbo\.json|nx\.json)$/i.test(p),
  );
  const hasPkgDirs = repo.tree.some(
    (t) => t.type === "dir" && /^(packages|apps|services)$/i.test(t.name) && (t.children?.length || 0) > 1,
  );
  return hasWorkspaceCfg || hasPkgDirs;
}

function buildGraph(kind: WorkspaceKind, services: ServiceNode[]): SystemGraph {
  const edges: ServiceEdge[] = [];
  const byKind = (k: ServiceKind) => services.filter((s) => s.kind === k);

  const gateways = byKind("gateway");
  const frontends = byKind("frontend");
  const backends = byKind("backend");
  const workers = byKind("worker");

  const entry = gateways[0];

  // Frontend → gateway (or first backend) over REST/GraphQL.
  for (const fe of frontends) {
    const target = entry || backends[0];
    if (target) edges.push({ from: fe.id, to: target.id, protocol: fe.protocols.includes("GraphQL") ? "GraphQL" : "REST", kind: "sync", label: "http" });
  }

  // Gateway → each backend (sync).
  if (entry) {
    for (const be of backends) {
      const proto: CommProtocol = be.protocols.includes("gRPC") ? "gRPC" : be.protocols.includes("GraphQL") ? "GraphQL" : "REST";
      edges.push({ from: entry.id, to: be.id, protocol: proto, kind: "sync", label: "routes" });
    }
  }

  // Async: producers → consumers/workers via a message queue node.
  const asyncProtocols = new Set<CommProtocol>();
  services.forEach((s) => s.protocols.forEach((p) => { if (["Kafka", "RabbitMQ", "Redis Streams"].includes(p)) asyncProtocols.add(p); }));
  const queueProto = [...asyncProtocols][0];
  const queues: string[] = [];
  if (queueProto) {
    const queueName = queueProto === "Kafka" ? "Kafka" : queueProto === "RabbitMQ" ? "RabbitMQ" : "Redis Streams";
    queues.push(queueName);
    const producers = services.filter((s) => s.produces.length);
    const consumers = services.filter((s) => s.consumes.length || s.kind === "worker");
    for (const prod of producers) {
      for (const cons of consumers) {
        if (prod.id === cons.id) continue;
        const shared = prod.produces.some((t) => cons.consumes.includes(t)) || (cons.kind === "worker");
        if (shared) edges.push({ from: prod.id, to: cons.id, protocol: queueProto, kind: "async", label: prod.produces[0] || "event" });
      }
    }
  }

  // Shared libs consumed by everyone (dependency, not runtime call).
  const libs = byKind("shared-lib");
  for (const lib of libs) {
    for (const s of [...backends, ...frontends, ...gateways, ...workers]) {
      edges.push({ from: s.id, to: lib.id, protocol: "REST", kind: "sync", label: "imports" });
    }
  }

  const databases = [...new Set(services.flatMap((s) => s.databases))];
  const protocols = [...new Set(services.flatMap((s) => s.protocols))];

  return {
    workspaceKind: kind,
    services,
    edges,
    gateways: gateways.map((g) => g.name),
    queues,
    databases,
    sharedLibs: libs.map((l) => l.name),
    protocols,
  };
}

/**
 * Build a full system analysis from one-or-many analyzed repos.
 * - 1 repo, not a monorepo  → "single"  (one service)
 * - 1 repo, monorepo        → "monorepo" (a service per package/app)
 * - many repos              → "microservices" (or "organization" if flagged)
 */
export function buildSystemAnalysis(
  repos: RepoAnalysis[],
  opts: { organization?: boolean; warnings?: string[] } = {},
): SystemAnalysis {
  const warnings = opts.warnings ?? [];
  let kind: WorkspaceKind;
  let services: ServiceNode[];

  if (repos.length === 1 && looksLikeMonorepo(repos[0])) {
    kind = "monorepo";
    const pkgs = extractMonorepoPackages(repos[0]);
    services = pkgs.length
      ? pkgs.map((p) => repoToService(repos[0], p.path))
      : [repoToService(repos[0])];
  } else if (repos.length > 1) {
    kind = opts.organization ? "organization" : "microservices";
    services = repos.map((r) => repoToService(r));
  } else {
    kind = "single";
    services = [repoToService(repos[0])];
  }

  const graph = buildGraph(kind, services);
  return { workspaceKind: kind, primary: repos[0], repos, graph, warnings };
}
