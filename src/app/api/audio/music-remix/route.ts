// ════════════════════════════════════════════════════════════════
// POST /api/audio/music-remix — remix a track via Suno (MuAPI)
// ════════════════════════════════════════════════════════════════
// Wraps `suno-remix-music` on MuAPI. Same submit+poll pattern as
// music-create. Required: an existing audio URL plus a target style.
//
// Body (JSON):
//   { audio_url: string,
//     style: string,
//     prompt?: string,
//     title?: string,
//     model?: "V3_5"|"V4"|"V4_5"|"V4_5PLUS"|"V4_5ALL"|"V5"|"V5_5" }
// Returns: { url, mimeType?, requestId? }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";

export const runtime    = "nodejs";
export const maxDuration = 300;

const Schema = z.object({
  audio_url: z.string().url(),
  style:     z.string().min(1).max(500),
  prompt:    z.string().max(3000).optional(),
  title:     z.string().max(200).optional(),
  model:     z.enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"]).default("V5"),
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
      endpoint:  "suno-remix-music",
      apiKey:    muKey,
      payload:   parsed.data,
      timeoutMs: 5 * 60 * 1000,
    });
    const url = pickResultUrl(result);
    if (!url) return jsonError("لم يتم استلام الناتج من Suno", 502);
    return jsonOk({
      url,
      mimeType:  "audio/mpeg",
      requestId: result.requestId,
      raw:       result.raw,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Music remix failed", 500);
  }
}
