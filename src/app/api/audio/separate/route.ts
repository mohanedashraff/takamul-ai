// ════════════════════════════════════════════════════════════════
// POST /api/audio/separate — split vocals/instruments via Demucs (Replicate)
// ════════════════════════════════════════════════════════════════
// Body: { audio_url: string, stems?: 2 | 4 }
// Returns: { vocals: url, drums?: url, bass?: url, other?: url, instrumental?: url }

import { z } from "zod";
import { auth } from "@/auth";
import { isReplicateConfigured, run } from "@/lib/replicate";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime    = "nodejs";
export const maxDuration = 300;

const Schema = z.object({
  audio_url: z.string().url(),
  stems:     z.union([z.literal(2), z.literal(4)]).default(2),
});

// ryan5453/demucs is a maintained fork that returns clean stem URLs.
// Pinning to a known-good version means a model push won't break us.
const DEMUCS_VERSION = "ryan5453/demucs";

export async function POST(req: Request) {
  if (!isReplicateConfigured()) {
    return jsonError("خدمة فصل الصوت غير مُعدّة بعد. أضف REPLICATE_API_TOKEN.", 503);
  }
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const output = await run({
      version: DEMUCS_VERSION,
      input: {
        audio:        parsed.data.audio_url,
        stem:         parsed.data.stems === 2 ? "vocals" : "all",
        model:        "htdemucs",
        output_format: "mp3",
      },
    });

    // Demucs returns either an object map of stems or a single URL.
    if (typeof output === "string") {
      return jsonOk({ vocals: output });
    }
    if (output && typeof output === "object") {
      return jsonOk(output as Record<string, string>);
    }
    return jsonError("لم يتم استلام الناتج", 502);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audio separation failed";
    return jsonError(message, 500);
  }
}
