// ════════════════════════════════════════════════════════════════
// POST /api/audio/enhance — noise reduction + clarity
// ════════════════════════════════════════════════════════════════
// Body: { audio_url: string }
// Returns: { url: string }
//
// Uses Resemble AI's "resemble-enhance" on Replicate — free model that
// applies denoise + dereverb + intelligibility boost. Excellent for
// podcast-style content; handles Arabic narration cleanly.

import { z } from "zod";
import { auth } from "@/auth";
import { isReplicateConfigured, run } from "@/lib/replicate";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 300;

const Schema = z.object({
  audio_url: z.string().url(),
});

const ENHANCE_VERSION = "daanelson/resemble-enhance";

export async function POST(req: Request) {
  if (!isReplicateConfigured()) {
    return jsonError("خدمة تحسين الصوت غير مُعدّة بعد. أضف REPLICATE_API_TOKEN.", 503);
  }
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const output = await run({
      version: ENHANCE_VERSION,
      input:   { audio_input: parsed.data.audio_url },
    });

    const url = typeof output === "string"
      ? output
      : (output as { audio?: string; output?: string })?.audio
        ?? (output as { audio?: string; output?: string })?.output;
    if (!url) return jsonError("لم يتم استلام الناتج", 502);
    return jsonOk({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audio enhance failed";
    return jsonError(message, 500);
  }
}
