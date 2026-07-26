export type DetectedTech =
  | "Docker"
  | "Kubernetes"
  | "React"
  | "Next.js"
  | "Node"
  | "Python"
  | "Go"
  | "Rust"
  | "Redis"
  | "Postgres"
  | "MongoDB"
  | "GraphQL"
  | "Tailwind"
  | "TypeScript";

export interface RepoFileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: RepoFileNode[];
  size?: number;
}

export interface RepoInsights {
  architecture: string;
  authentication: string;
  database: string;
  apiCount: number;
  components: number;
  controllers: number;
  services: number;
  models: number;
  routes: number;
}

export interface RepoStats {
  linesOfCode: number;
  files: number;
  languages: { name: string; percent: number; color: string }[];
  largestFolder: string;
  dependencies: number;
}

export interface ArchNode {
  id: string;
  label: string;
  kind: "frontend" | "backend" | "data" | "external" | "infra";
  children?: string[];
}

export interface RepoAnalysis {
  url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  framework: string;
  branch: string;
  technologies: DetectedTech[];
  tree: RepoFileNode[];
  insights: RepoInsights;
  stats: RepoStats;
  architecture: ArchNode[];
  readme: string;
  source: "github" | "mock";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  pinned?: boolean;
  streaming?: boolean;
}

export interface Session {
  id: string;
  repoUrl: string;
  repoName: string;
  createdAt: number;
  messages: ChatMessage[];
}

export type AnalyzeStep =
  | "clone"
  | "framework"
  | "files"
  | "architecture"
  | "ready";

export interface AnalyzeProgress {
  step: AnalyzeStep;
  label: string;
  done: boolean;
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

/** Who the chat answer is written for — tunes tone and depth. */
export type Audience = "business" | "product" | "developer";

// ---------------------------------------------------------------------------
// Microservice / distributed-system support
// ---------------------------------------------------------------------------

export type WorkspaceKind = "single" | "monorepo" | "microservices" | "organization";

export type ServiceKind =
  | "gateway"
  | "backend"
  | "frontend"
  | "shared-lib"
  | "worker"
  | "database"
  | "queue";

export type CommProtocol =
  | "REST"
  | "GraphQL"
  | "gRPC"
  | "Kafka"
  | "RabbitMQ"
  | "Redis Streams"
  | "WebSocket";

export interface ServiceNode {
  id: string;
  name: string;
  kind: ServiceKind;
  repo: string; // owner/name or package path
  tech: DetectedTech[];
  databases: string[];
  produces: string[]; // event topics / queues emitted
  consumes: string[]; // event topics / queues read
  protocols: CommProtocol[];
  owner: string; // inferred team / codeowner
  path?: string; // path within a monorepo
}

export interface ServiceEdge {
  from: string;
  to: string;
  protocol: CommProtocol;
  kind: "sync" | "async";
  label?: string;
}

export interface SystemGraph {
  workspaceKind: WorkspaceKind;
  services: ServiceNode[];
  edges: ServiceEdge[];
  gateways: string[];
  queues: string[];
  databases: string[];
  sharedLibs: string[];
  protocols: CommProtocol[];
}

/** Top-level result of analyzing one-or-many repos / a monorepo / an org. */
export interface SystemAnalysis {
  workspaceKind: WorkspaceKind;
  primary: RepoAnalysis; // repo shown in the main dashboard panels
  repos: RepoAnalysis[]; // every analyzed repo (or monorepo package)
  graph: SystemGraph;
  warnings: string[];
}
