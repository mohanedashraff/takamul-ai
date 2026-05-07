// ════════════════════════════════════════════════════════════════
// POST /api/audio/transcribe — speech-to-text via Whisper (MuAPI)
// ════════════════════════════════════════════════════════════════
// Wraps `openai-whisper` on MuAPI. Returns the full transcript text;
// the client renders it inline.
//
// Body (JSON): { audio_url: string, language?: string }
// Returns:    { text: string, raw }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer } from "@/lib/muapi-server";

export const runtime    = "nodejs";
export const maxDuration = 180;

const Schema = z.object({
  audio_url: z.string().url(),
  language:  z.string().min(2).max(8).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const result = await submitAndPollServer({
      endpoint:  "openai-whisper",
      apiKey:    muKey,
      payload:   parsed.data,
      timeoutMs: 3 * 60 * 1000,
    });

    // Whisper's output is text, not a URL. Fish it out of the various
    // shapes MuAPI uses for completed predictions.
    const raw  = result.raw as Record<string, unknown>;
    const text =
      (typeof raw.text === "string" && raw.text) ||
      (typeof raw.transcript === "string" && raw.transcript) ||
      (typeof raw.output === "string" && raw.output) ||
      (raw.output && typeof raw.output === "object" && "text" in raw.output
        ? String((raw.output as { text: unknown }).text ?? "") : "") ||
      (Array.isArray(raw.outputs) && typeof raw.outputs[0] === "string" ? raw.outputs[0] as string : "") ||
      "";

    if (!text) return jsonError("لم يتم استخراج النص من الصوت", 502);
    return jsonOk({ text, raw });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Transcription failed", 500);
  }
}
