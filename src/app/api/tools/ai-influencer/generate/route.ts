// ════════════════════════════════════════════════════════════════
// POST /api/tools/ai-influencer/generate — character generation
// ════════════════════════════════════════════════════════════════
// Builds an AI Influencer character image from the user's structured
// 22-subcategory config. Mirrors the reference platform's
// `/ai-influencer-studio` page flow:
//
//   1. Compose a richly-templated English prompt from the config
//      (handled by composeInfluencerPrompt in lib/data/ai-influencer).
//   2. Submit to nano-banana-pro with the picked aspect_ratio +
//      resolution + a Soul-grade negative prompt.
//   3. Poll server-side and return the URL.
//
// Body  : { config: InfluencerConfig, aspect_ratio?, resolution?, seed? }
// Reply : { url, mimeType: "image/png", urls?, requestId? }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import {
  composeInfluencerPrompt, INFLUENCER_DEFAULTS, INFLUENCER_ASPECTS,
  type InfluencerConfig,
} from "@/lib/data/ai-influencer";

export const runtime    = "nodejs";
export const maxDuration = 240;

// We accept the config as an open-ended record because it has 22
// optional fields. Each value is either a string (single-select) or
// a string[] (multi-select). Validation happens at the type-narrow
// step inside composeInfluencerPrompt, which falls back to defaults
// for any missing/unknown field.
const Schema = z.object({
  config:       z.record(z.string(), z.union([z.string(), z.array(z.string())]).optional()).default({}),
  aspect_ratio: z.enum(INFLUENCER_ASPECTS.map((a) => a.id) as [string, ...string[]]).default("9:16"),
  resolution:   z.enum(["2k", "4k"]).default("2k"),
  seed:         z.number().int().min(0).max(2_147_483_647).nullable().optional(),
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

  const { config, aspect_ratio, resolution, seed } = parsed.data;

  // Merge user config over defaults — guarantees the prompt never
  // ends up with empty fields that produce nonsensical outputs.
  const fullConfig: InfluencerConfig = { ...INFLUENCER_DEFAULTS, ...config };
  const finalPrompt = composeInfluencerPrompt(fullConfig);

  const negative_prompt =
    "blurry, low quality, distorted face, asymmetric eyes, bad anatomy, " +
    "watermark, text, logo, signature, jpeg artifacts, oversaturated, " +
    "plastic skin, deformed limbs, extra limbs, missing limbs";

  const aspectMeta = INFLUENCER_ASPECTS.find((a) => a.id === aspect_ratio);
  const payload: Record<string, unknown> = {
    prompt:          finalPrompt,
    aspect_ratio,
    resolution,
    num_images:      1,
    negative_prompt,
  };
  if (aspectMeta) {
    payload.width  = aspectMeta.w;
    payload.height = aspectMeta.h;
  }
  if (typeof seed === "number") payload.seed = seed;

  try {
    const result = await submitAndPollServer({
      endpoint:  "nano-banana-pro",
      apiKey:    muKey,
      payload,
      timeoutMs: 4 * 60 * 1000,
    });
    const url  = pickResultUrl(result);
    const urls = Array.isArray(result.urls)
      ? result.urls
      : (Array.isArray(result.outputs) ? result.outputs as string[] : undefined);
    if (!url) return jsonError("لم يتم استلام الناتج من AI Influencer", 502);
    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: result.requestId,
      raw:       result.raw,
      finalPrompt,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "AI Influencer generation failed", 500);
  }
}
