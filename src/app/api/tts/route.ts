import { NextRequest, NextResponse } from "next/server";
import { hasSarvam, sarvamTTS } from "@/lib/sarvam";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text, language, speaker } = (await req.json().catch(() => ({}))) as {
    text?: string;
    language?: string;
    speaker?: string;
  };
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  if (!hasSarvam()) {
    // Client should fall back to the browser SpeechSynthesis API.
    return NextResponse.json(
      { error: "sarvam_unconfigured", useBrowserFallback: true },
      { status: 501 },
    );
  }

  try {
    const audioBase64 = await sarvamTTS(text, language || process.env.SARVAM_TTS_LANGUAGE || "en-IN", speaker);
    return NextResponse.json({ audio: audioBase64, mime: "audio/wav" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
