import { NextRequest } from "next/server";
import { hasSarvam, streamSarvamChat } from "@/lib/sarvam";
import { mockAnswer } from "@/lib/mock-data";
import type { Audience, RepoAnalysis } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  repo: RepoAnalysis;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
  audience?: Audience;
}

export async function POST(req: NextRequest) {
  const { repo, history, question, audience } = (await req.json()) as Body;

  if (!repo || !question) {
    return new Response("Missing repo or question", { status: 400 });
  }

  const encoder = new TextEncoder();

  // Live Sarvam LLM streaming (sarvam-m).
  if (hasSarvam()) {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamSarvamChat(repo, history || [], question, audience || "business")) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          const fallback = `\n\n> ⚠️ Sarvam chat error (${(err as Error).message}). Falling back to sample answer.\n\n` + mockAnswer(question, repo);
          controller.enqueue(encoder.encode(fallback));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  // No key → deterministic mock, streamed word-by-word for a live feel.
  const answer = mockAnswer(question, repo);
  const words = answer.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
