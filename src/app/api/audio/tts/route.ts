// ════════════════════════════════════════════════════════════════
// POST /api/audio/tts — text-to-speech via ElevenLabs
// ════════════════════════════════════════════════════════════════
// Renders text into an audio file, uploads it through the existing
// MuAPI storage so we get a public URL we can return + persist on the
// generation row. Credit-deduction is handled the same way as MuAPI
// tools (caller hits /api/generations first, then comes here).

import { z } from "zod";
import { auth } from "@/auth";
import { isElevenLabsConfigured, synthesize } from "@/lib/elevenlabs";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  text:   z.string().min(1).max(4_000),
  voice:  z.string().default("adam"),
  format: z.enum(["mp3", "wav"]).default("mp3"),
  speed:  z.number().min(0.5).max(2.0).optional(),
});

export async function POST(req: Request) {
  if (!isElevenLabsConfigured()) {
    return jsonError("خدمة تحويل النص لصوت غير مُعدّة بعد. أضف ELEVENLABS_API_KEY.", 503);
  }

  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const { buffer, mimeType } = await synthesize(parsed.data);

    // Forward the audio to MuAPI's upload_file so it lives at a stable
    // public URL we can reference from generations / spaces / etc.
    const muKey = process.env.MU_API_KEY;
    if (muKey) {
      try {
        const filename = `tts-${Date.now()}.${parsed.data.format}`;
        const form = new FormData();
        form.append("file", new Blob([buffer], { type: mimeType }), filename);
        const up = await fetch("https://api.muapi.ai/api/v1/upload_file", {
          method:  "POST",
          headers: { "x-api-key": muKey },
          body:    form,
        });
        if (up.ok) {
          const data = await up.json().catch(() => ({}));
          const url = data.url || data.file_url || data.fileUrl;
          if (url) return jsonOk({ url, mimeType });
        }
      } catch (e) {
        console.error("[tts] muapi upload failed, falling back to inline", e);
      }
    }

    // Fallback: return the audio inline as a data URL (works in dev /
    // when MuAPI storage is unavailable).
    const b64 = Buffer.from(buffer).toString("base64");
    return jsonOk({ url: `data:${mimeType};base64,${b64}`, mimeType, inline: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return jsonError(message, 500);
  }
}
