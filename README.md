# CodeAtlas 🧭

**Talk to any GitHub repository, monorepo, or microservice system using AI and multilingual voice.**

CodeAtlas clones/analyzes a repo (or a whole org / multiple repos), maps its
architecture, and lets developers ask questions by **text or voice**. Everything is
powered by **Sarvam AI** — answers from the `sarvam-m` LLM, spoken back with Sarvam
multilingual TTS, transcribed with Sarvam STT. **One key, whole app.**

Built to run **immediately** — with zero API keys it uses realistic sample data,
the browser's speech APIs, and a deterministic mock answer engine. Add your Sarvam
key to go fully live.

---

## ✨ Features

- **Landing page** — animated glowing blobs, floating code, glassmorphism, hero CTA.
- **Dashboard** — sidebar (history), center ChatGPT-style chat, right repository panel.
- **Analyze anything** — single repo, **monorepo**, **multiple repos**, or a **GitHub org**.
- **Auto-detection** — language, framework, package managers, Docker, Kubernetes, Terraform.
- **Service Dependency Graph** — gateways, services, workers, shared libs, queues, databases; REST / GraphQL / gRPC / Kafka / RabbitMQ / Redis Streams / WebSocket; sync vs async flows; ownership & event flow.
- **Voice mode** — animated mic, live waveform, listening / thinking / speaking states, replay & stop.
- **Rich chat** — streaming responses, Markdown, syntax-highlighted code, copy, pin, export to Markdown.
- **Insights** — architecture, authentication, database, API/component/service counts, stats.
- **Repository tree** — collapsible, searchable, colored file/folder icons.
- Responsive, keyboard-friendly, dark-themed.

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, glassmorphism, Framer Motion, Lucide icons |
| State / data | Zustand (persisted), React Query |
| AI (chat) | Sarvam `sarvam-m` — OpenAI-compatible streaming |
| Voice | Sarvam Speech-to-Text (`saarika`) + Text-to-Speech (`bulbul:v3`) |
| Backend | Next.js API Routes (Node runtime) |

---

## 🚀 Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Click **Launch App** → paste a GitHub URL → **Analyze**.

> Runs with **no keys**. For live analysis + real voice, copy `.env.example` to
> `.env.local` and fill in your keys.

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `SARVAM_API_KEY` | **The only required key.** Chat answers + STT + TTS (else mock answers + browser Web Speech) |
| `GITHUB_TOKEN` | Optional: higher REST rate limit + private repos (else sample data on 403/404) |

Sarvam models default to `sarvam-m` (chat), `saarika:v2` (STT), and `bulbul:v3` /
speaker `shubh` (TTS). Override via `SARVAM_CHAT_MODEL`, `SARVAM_STT_MODEL`,
`SARVAM_TTS_MODEL`, `SARVAM_TTS_SPEAKER`, `SARVAM_TTS_LANGUAGE` (e.g. `hi-IN`).

---

## 🗂 How input is interpreted

| You paste | CodeAtlas does |
|---|---|
| `github.com/owner/repo` | Analyzes one repo (detects if it's a **monorepo**) |
| several repo URLs (space/comma separated) | Analyzes all → **microservices** system + graph |
| `github.com/org-or-user` | Expands to top repos → **organization** system + graph |

Workspace type (**Single / Monorepo / Microservices / Organization**) is detected
automatically and shown in the status bar and System tab.

---

## 📁 Project structure

```
src/
  app/
    layout.tsx            # fonts, providers, metadata
    page.tsx              # landing page
    dashboard/page.tsx    # 3-pane app shell
    api/
      analyze/route.ts    # repo/org/multi-repo → SystemAnalysis (+ mock fallback)
      chat/route.ts       # streaming Claude answers (+ mock stream)
      stt/route.ts        # Sarvam speech-to-text
      tts/route.ts        # Sarvam text-to-speech
  components/
    landing/              # navbar, hero, animated bg, features, footer
    dashboard/            # sidebar, header, chat, tree, insights, graphs, voice
    ui/                   # button, card, input, badge, skeleton
    markdown.tsx          # markdown + syntax highlighting
  hooks/                  # useAnalyze, useChat, useVoice
  lib/                    # claude, sarvam, github, services, mock-data, types, utils
  store/useAppStore.ts    # Zustand store (sessions persisted)
```

---

## 🔌 Integrations at a glance

- **Sarvam (chat)** — `src/lib/sarvam.ts` `streamSarvamChat()` calls the
  OpenAI-compatible `/v1/chat/completions` (`sarvam-m`) and streams SSE deltas; the
  system prompt is built from the analyzed repo. Falls back to `mockAnswer()` on
  error / no key.
- **Sarvam (voice)** — same lib calls `/speech-to-text` and `/text-to-speech`
  (mirrors the `bulbul:v3` + `target_language_code` SDK example). API routes return
  `501 useBrowserFallback` when unkeyed so the client uses Web Speech.
- **GitHub** — `src/lib/github.ts` fetches repo metadata + recursive tree + README
  via REST; `src/lib/services.ts` infers the service dependency graph.

---

## 🧪 Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

---

## 📝 Notes

- The right repository panel (Overview / Files / Insights / System) is optimized for
  ≥ `lg` screens; chat, header, and sidebar are fully responsive on mobile/tablet.
- Sample data keeps every screen fully functional offline — no blank states.
- Sessions & voice preference persist in `localStorage`.

Built with Next.js, Claude & Sarvam.
