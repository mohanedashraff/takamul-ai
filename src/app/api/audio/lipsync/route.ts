// ════════════════════════════════════════════════════════════════
// POST /api/audio/lipsync — image + audio → talking-head video
// ════════════════════════════════════════════════════════════════
// Routes the supplied portrait image and audio file through one of
// MuAPI's lipsync families:
//
//   • ltx-2.3-lipsync           (default — best quality)
//   • ltx-2-19b-lipsync
//   • wan2.2-speech-to-video
//   • infinitetalk-image-to-video
//
// Body  : { image_url, audio_url, model?, resolution?, prompt? }
// Reply : { url, requestId, creditsBalance }
//
// Credit cost: 14 (flat). Refunded on any failure.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 300;

const COST = 14;

const Schema = z.object({
  image_url:  z.string().url(),
  audio_url:  z.string().url(),
  model:      z.enum([
    "ltx-2.3-lipsync",
    "ltx-2-19b-lipsync",
    "wan2.2-speech-to-video",
    "infinitetalk-image-to-video",
  ]).default("ltx-2.3-lipsync"),
  resolution: z.enum(["480p", "720p", "1080p"]).default("720p"),
  prompt:     z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  const rl = rateLimit({ key: clientKey(req, "lipsync"), limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "محاولات كثيرة — حاول لاحقاً" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { image_url, audio_url, model, resolution, prompt } = parsed.data;

  // Some models cap at 720p — silently clamp to keep the experience smooth.
  const safeRes =
    (model === "wan2.2-speech-to-video" || model === "infinitetalk-image-to-video") && resolution === "1080p"
      ? "720p"
      : resolution;

  // Build the per-model payload. The lipsync family is fairly consistent on
  // image_url / audio_url; resolution comes through as `resolution`.
  const payload: Record<string, unknown> = {
    image_url,
    audio_url,
    resolution: safeRes,
  };
  if (prompt) payload.prompt = prompt;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:lipsync",
      metadata: { model, resolution: safeRes },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    const result = await submitAndPollServer({
      endpoint:  model,
      apiKey:    muKey,
      payload,
      timeoutMs: 4 * 60 * 1000,
    });
    const url = pickResultUrl(result);
    if (!url) {
      await addCredits({
        userId:   session.user.id,
        amount:   COST,
        reason:   "refund:lipsync-no-result",
        type:     "REFUND",
        metadata: { model },
      }).catch(() => {});
      return jsonError("لم يتم استلام الناتج من النموذج", 502);
    }
    return jsonOk({ url, requestId: result.requestId, creditsBalance: balanceAfter });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:lipsync-failed",
      type:     "REFUND",
      metadata: { model, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Lipsync failed";
    return jsonError(message, 500);
  }
}
