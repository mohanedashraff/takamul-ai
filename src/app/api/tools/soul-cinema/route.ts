// ════════════════════════════════════════════════════════════════
// POST /api/tools/soul-cinema — Higgsfield "Soul Cinema" replica
// ════════════════════════════════════════════════════════════════
// Soul Cinema is Higgsfield's proprietary "cinema-grade visual" model
// (https://higgsfield.ai/ai/image?model=soul-cinematic). It isn't on
// MuAPI, so we approximate the look by:
//
//   1. Layering a curated "soul cinema" descriptor onto the user prompt
//      (warm cinematic palette, anamorphic-style framing, dramatic
//      lighting, film grain, ultra-realistic, 8K finishing).
//   2. Submitting to MuAPI's `nano-banana-pro` (Google's flagship
//      image model — same backbone Higgsfield routes Soul Cinema
//      through, per their UI label).
//   3. Polling server-side and returning the final URL in one POST
//      so the client uses the standard customRunner flow.
//
// Body (JSON):
//   { prompt: string,                          // user description
//     aspect_ratio?: "1:1"|"16:9"|"9:16"|"4:5"|"3:4"|"21:9"|"4:3"|"3:2",
//     quality?:      "1.5k"|"2k"|"4k",
//     character_url?: string,                  // optional reference of a person
//     color_transfer_url?: string,             // optional palette reference
//     enhance_prompt?: boolean,                // adds extra visual richness
//     num_outputs?: 1|2|3|4 }
//
// Returns: { url, mimeType:"image/png", urls?, requestId? }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  prompt:             z.string().min(1).max(3_000),
  aspect_ratio:       z.enum(["1:1", "16:9", "9:16", "4:5", "3:4", "21:9", "4:3", "3:2"]).default("16:9"),
  quality:            z.enum(["1.5k", "2k", "4k"]).default("2k"),
  character_url:      z.string().url().optional(),
  color_transfer_url: z.string().url().optional(),
  enhance_prompt:     z.boolean().default(true),
  num_outputs:        z.number().int().min(1).max(4).default(1),
});

// Higgsfield's signature look — distilled from Soul Cinema sample
// outputs. Keep this as a single concatenated string so the user's
// prompt stays at the head (where image models weight it heaviest).
const SOUL_CINEMA_DESCRIPTOR = [
  "cinema-grade visual",
  "ultra-realistic",
  "shot on 35mm film",
  "anamorphic widescreen framing",
  "deep cinematic color grade",
  "dramatic directional lighting with motivated practicals",
  "rich shadow detail, film highlight rolloff",
  "natural skin tones, painterly mid-tones",
  "subtle film grain",
  "shallow depth of field with creamy bokeh",
  "lens halation around bright sources",
  "high dynamic range",
  "magazine-quality composition",
  "8K finishing",
].join(", ");

// Quality → resolution suffix the model understands. nano-banana-pro
// also accepts an explicit `resolution` field on its payload, so we
// pass both — belt + braces.
const QUALITY_TO_RES: Record<string, string> = {
  "1.5k": "1.5k",
  "2k":   "2k",
  "4k":   "4k",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { prompt, aspect_ratio, quality, character_url, color_transfer_url, enhance_prompt, num_outputs } = parsed.data;

  // ── Final prompt — user intent first, descriptor second ──
  const fragments: string[] = [prompt.trim()];
  if (color_transfer_url) {
    fragments.push("matching the color palette and tonal grade of the reference image");
  }
  if (character_url) {
    fragments.push("featuring the character shown in the reference image, maintaining facial likeness");
  }
  if (enhance_prompt) fragments.push(SOUL_CINEMA_DESCRIPTOR);

  const finalPrompt = fragments.join(", ");

  // nano-banana-pro accepts `images_list` for both reference characters
  // and palette references. We feed both URLs in (it interprets them
  // jointly).
  const images_list = [character_url, color_transfer_url].filter(Boolean) as string[];

  // pick a soft negative prompt to lock out common artefacts
  const negative_prompt =
    "blurry, low quality, low resolution, oversaturated, plastic skin, distorted face, bad anatomy, watermark, text, logo, signature, jpeg artifacts";

  const payload: Record<string, unknown> = {
    prompt:           finalPrompt,
    aspect_ratio,
    resolution:       QUALITY_TO_RES[quality] ?? "2k",
    num_images:       num_outputs,
    negative_prompt,
  };
  if (images_list.length > 0) payload.images_list = images_list;

  // Use the edit endpoint when we have references, the regular endpoint
  // otherwise. nano-banana-pro-edit understands `images_list` for
  // character & palette transfer.
  const endpoint = images_list.length > 0 ? "nano-banana-pro-edit" : "nano-banana-pro";

  try {
    const result = await submitAndPollServer({
      endpoint,
      apiKey:    muKey,
      payload,
      timeoutMs: 4 * 60 * 1000,
    });
    const url  = pickResultUrl(result);
    const urls = Array.isArray(result.urls) ? result.urls : (Array.isArray(result.outputs) ? result.outputs as string[] : undefined);
    if (!url) return jsonError("لم يتم استلام الناتج من Soul Cinema", 502);
    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: result.requestId,
      raw:       result.raw,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Soul Cinema generation failed", 500);
  }
}
