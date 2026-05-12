// ════════════════════════════════════════════════════════════════
// POST /api/tools/virality-predictor — Brain Activity / Virality
// ════════════════════════════════════════════════════════════════
// Multimodal-vision pass over a video URL → structured prediction of
// how the clip will perform on TikTok / Reels / Shorts. Mirrors the
// reference platform's "Brain Activity" tool, but with a richer
// schema (hook strength, sustain, payoff, branded-content guess).
//
// Body  : { video_url: string, platform?: "tiktok"|"reels"|"shorts"|"any" }
// Reply : { prediction: {...}, creditsBalance }
//
// Credit cost: 6 (flat). Refunded on failure.

import { z } from "zod";
import { generateObject } from "ai";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 120;

const COST = 6;

const Schema = z.object({
  video_url: z.string().url(),
  platform:  z.enum(["tiktok", "reels", "shorts", "any"]).default("any"),
});

const PredictionSchema = z.object({
  /** Overall predicted virality on a 0-100 scale. */
  viralityScore:   z.number().min(0).max(100),
  /** First-3-seconds attention-grab strength. */
  hookStrength:    z.number().min(0).max(100),
  /** How well the clip keeps watching past second 5. */
  sustain:         z.number().min(0).max(100),
  /** End-of-clip payoff — does the viewer get a clear punchline. */
  payoff:          z.number().min(0).max(100),
  /** Polished talking-head vs raw UGC — affects which platforms it works on. */
  productionLevel: z.enum(["ugc-raw", "ugc-polished", "studio", "cinematic"]),
  /** A guess at the genre / intent of the clip. */
  contentType:     z.enum([
    "skit", "review", "tutorial", "lifestyle", "fashion", "food",
    "fitness", "pet", "travel", "music", "dance", "ad", "other",
  ]),
  /** Up to 3 specific tweak suggestions that would lift virality. */
  improvements:    z.array(z.string().min(1).max(200)).max(3),
  /** A 1-sentence verdict for the user. */
  verdict:         z.string().min(1).max(280),
  /** Per-second "brain activity" map — 0..100 attention by 0.5s window. */
  attentionTimeline: z
    .array(
      z.object({
        timeSec:   z.number().min(0).max(120),
        attention: z.number().min(0).max(100),
      }),
    )
    .max(60),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  if (!isAiConfigured()) {
    return jsonError("الميزة دي محتاجة مفتاح OpenRouter", 503);
  }

  const rl = rateLimit({ key: clientKey(req, "virality"), limit: 30, windowMs: 60 * 60 * 1000 });
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

  const { video_url, platform } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:virality-predictor",
      metadata: { video_url, platform },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    const platformHint =
      platform === "any" ? "across short-form (TikTok / Reels / Shorts)"
        : `specifically on ${platform.toUpperCase()}`;

    const { object } = await generateObject({
      model:  aiModel("anthropic/claude-sonnet-4.5"),
      schema: PredictionSchema,
      system:
        "You are a short-form-video virality analyst. Watch the supplied clip and " +
        "predict how it will perform " + platformHint + ". Return a calibrated " +
        "viralityScore (0-100), hookStrength (first 3 sec), sustain (mid clip), " +
        "and payoff (ending). Also classify production level + content type. " +
        "Include up to 3 specific, actionable improvement suggestions (no fluff). " +
        "Finally, sample the perceived viewer attention every 0.5 seconds and return " +
        "an attentionTimeline array — 0=lost interest, 100=glued to screen. Skip the " +
        "attentionTimeline (return empty array) only if the clip is longer than 60 sec.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyse this clip for ${platformHint} virality.` },
            // The AI SDK accepts a URL for video via `type: "file"` —
            // multimodal Claude can process modest-length clips this way.
            { type: "file", data: video_url, mediaType: "video/mp4" },
          ],
        },
      ],
      maxRetries: 1,
    });

    return jsonOk({ prediction: object, creditsBalance: balanceAfter });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:virality-failed",
      type:     "REFUND",
      metadata: { video_url, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Virality analysis failed";
    return jsonError(message, 500);
  }
}
