// ════════════════════════════════════════════════════════════════
// POST /api/audio/transcribe — speech-to-text via OpenAI Whisper
// ════════════════════════════════════════════════════════════════
// Body (JSON): { audio_url: string, language?: string }
// Returns:    { text: string }
//
// NOTE: previously hit MuAPI's `openai-whisper` endpoint, which does
// NOT exist in the registry — every submission 404'd silently. Now
// calls OpenAI's transcription API directly (whisper-1) using
// OPENAI_API_KEY.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 180;

const Schema = z.object({
  audio_url: z.string().url(),
  language:  z.string().min(2).max(8).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return jsonError("الميزة دي محتاجة مفتاح OpenAI", 503);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { audio_url, language } = parsed.data;

  try {
    // 1) Fetch the audio bytes
    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) return jsonError(`فشل تحميل ملف الصوت (${audioRes.status})`, 502);
    const audioBuf = await audioRes.arrayBuffer();
    if (audioBuf.byteLength > 25 * 1024 * 1024) {
      return jsonError("ملف الصوت أكبر من 25MB (حد Whisper الرسمي)", 413);
    }

    // 2) Build the multipart form
    const filename = audio_url.split("/").pop()?.split("?")[0] || "audio.mp3";
    const ext = filename.toLowerCase().split(".").pop() || "mp3";
    const mime = ext === "wav"  ? "audio/wav"
              : ext === "m4a"  ? "audio/m4a"
              : ext === "ogg"  ? "audio/ogg"
              : ext === "webm" ? "audio/webm"
              : ext === "mp4"  ? "video/mp4"
              : "audio/mpeg";

    const form = new FormData();
    form.append("file",  new Blob([audioBuf], { type: mime }), filename);
    form.append("model", "whisper-1");
    if (language && language !== "auto") form.append("language", language);
    form.append("response_format", "json");

    // 3) Call OpenAI
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method:  "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body:    form,
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return jsonError(`Whisper failed: ${errText.slice(0, 200)}`, 502);
    }
    const data = await r.json().catch(() => ({} as Record<string, unknown>));
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) return jsonError("لم يتم استخراج النص من الصوت", 502);

    return jsonOk({ text });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Transcription failed", 500);
  }
}
