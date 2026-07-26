import { NextRequest, NextResponse } from "next/server";
import { hasSarvam, sarvamSTT } from "@/lib/sarvam";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasSarvam()) {
    // Client should fall back to the browser Web Speech API.
    return NextResponse.json(
      { error: "sarvam_unconfigured", useBrowserFallback: true },
      { status: 501 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    const transcript = await sarvamSTT(file);
    return NextResponse.json({ transcript });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
