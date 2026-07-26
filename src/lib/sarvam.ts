/**
 * Sarvam AI helpers — the ONLY provider CodeAtlas needs.
 * - Chat/LLM answers  → sarvam-m  (OpenAI-compatible /v1/chat/completions)
 * - Speech-to-Text    → saarika
 * - Text-to-Speech    → bulbul:v3
 * Docs: https://docs.sarvam.ai
 * All calls are server-side (API key never reaches the browser).
 */

import type { Audience, RepoAnalysis } from "./types";

// Available Sarvam chat models: sarvam-105b (most capable), sarvam-30b (faster).
const CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || "sarvam-105b";

const AUDIENCE_STYLE: Record<Audience, string> = {
  business: [
    `AUDIENCE: a BUSINESS OWNER / non-technical stakeholder.`,
    `Lead with what the product DOES and the VALUE it delivers. Explain in plain business English — no jargon, no code unless explicitly asked.`,
    `Where relevant cover: the problem it solves, key capabilities, business & security RISKS, rough build/maintenance effort, scalability, and opportunities.`,
    `Structure: a 1-2 sentence plain-English summary first, then short skimmable bullets.`,
    `IMPORTANT: include ONE simple Mermaid diagram to make it visual — a \`\`\`mermaid flowchart (flowchart TD) showing how the main pieces connect, OR a mermaid "journey"/"sequenceDiagram" for a user flow. Keep labels plain-English (e.g. "Customer", "Payments", "Database"), max ~8 nodes. Put the diagram near the top. Never dump source code.`,
  ].join(" "),
  product: [
    `AUDIENCE: a PRODUCT OWNER / product manager.`,
    `Focus on features, user-facing flows, capabilities and gaps, integrations, and roadmap/effort implications.`,
    `Use plain English with only light technical detail. Prefer bullets and short paragraphs over code.`,
    `IMPORTANT: include ONE Mermaid diagram to visualise it — a \`\`\`mermaid flowchart (flowchart LR) of the main features/services, or a sequenceDiagram of a key user journey. Plain-English labels, max ~8 nodes.`,
  ].join(" "),
  developer: [
    `AUDIENCE: a software ENGINEER.`,
    `Be precise and technical. Use fenced code blocks with language tags and reference real file paths from the repo.`,
    `Where architecture or flows are involved, include a \`\`\`mermaid diagram (flowchart or sequenceDiagram) in addition to any code.`,
  ].join(" "),
};

/** Build a compact system prompt describing the analyzed repo, tuned to the audience. */
export function buildRepoContext(repo: RepoAnalysis, audience: Audience = "business"): string {
  return [
    `You are CodeAtlas, an expert who explains a specific GitHub repository to different audiences.`,
    `Repository: ${repo.owner}/${repo.name}`,
    `Description: ${repo.description}`,
    `Language: ${repo.language} | Framework: ${repo.framework} | Branch: ${repo.branch}`,
    `Detected technologies: ${repo.technologies.join(", ")}`,
    `Architecture: ${repo.insights.architecture}`,
    `Authentication: ${repo.insights.authentication}`,
    `Database: ${repo.insights.database}`,
    `Stats: ${repo.stats.linesOfCode} LOC across ${repo.stats.files} files, ${repo.stats.dependencies} dependencies.`,
    ``,
    AUDIENCE_STYLE[audience],
    `Answer in concise Markdown. If unsure, say so honestly rather than inventing details.`,
  ].join("\n");
}

/**
 * Stream a Sarvam chat answer as text chunks (OpenAI-compatible SSE).
 * Caller should have checked hasSarvam().
 */
export async function* streamSarvamChat(
  repo: RepoAnalysis,
  history: { role: "user" | "assistant"; content: string }[],
  question: string,
  audience: Audience = "business",
): AsyncGenerator<string> {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
      "api-subscription-key": process.env.SARVAM_API_KEY as string,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        { role: "system", content: buildRepoContext(repo, audience) },
        ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sarvam chat ${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }
}

const STT_URL = "https://api.sarvam.ai/speech-to-text";
const TTS_URL = "https://api.sarvam.ai/text-to-speech";
const CHAT_URL = "https://api.sarvam.ai/v1/chat/completions";

export function hasSarvam(): boolean {
  return Boolean(process.env.SARVAM_API_KEY);
}

/** Transcribe an audio blob. Returns recognized text. */
export async function sarvamSTT(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "audio.webm");
  form.append("model", process.env.SARVAM_STT_MODEL || "saarika:v2");
  form.append("language_code", "unknown"); // auto-detect

  const res = await fetch(STT_URL, {
    method: "POST",
    headers: { "api-subscription-key": process.env.SARVAM_API_KEY as string },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sarvam STT ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { transcript?: string };
  return data.transcript ?? "";
}

/**
 * Synthesize speech. Returns base64 WAV audio.
 * Mirrors the Sarvam SDK: model `bulbul:v3`, speaker `shubh`, and a
 * `target_language_code` such as `hi-IN` / `en-IN` for multilingual output.
 *
 *   client.text_to_speech.convert({
 *     model: "bulbul:v3", text, target_language_code: "hi-IN", speaker: "shubh" })
 */
export async function sarvamTTS(
  text: string,
  languageCode = "en-IN",
  speaker?: string,
): Promise<string> {
  // Sarvam TTS caps input length; chunk defensively.
  const input = text.slice(0, 1500);
  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": process.env.SARVAM_API_KEY as string,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // v3 accepts `text`; older versions accept `inputs`. Send both for
      // forward/backward compatibility — the API ignores the unused one.
      text: input,
      inputs: [input],
      target_language_code: languageCode,
      model: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
      speaker: speaker || process.env.SARVAM_TTS_SPEAKER || "shubh",
      speech_sample_rate: 22050,
      enable_preprocessing: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sarvam TTS ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { audios?: string[] };
  if (!data.audios?.[0]) throw new Error("Sarvam TTS returned no audio");
  return data.audios[0]; // base64 wav
}
