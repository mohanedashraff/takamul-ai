// ════════════════════════════════════════════════════════════════
// POST /api/tools/product-photoshoot/generate
// ════════════════════════════════════════════════════════════════
// Yilow's product-photoshoot studio — a structured 10-mode product
// photography flow where each mode has its own Claude system prompt
// that rewrites the user's short intent into a 200-word photography
// brief.
//
// Pipeline:
//   1. Look up the picked mode + its system_prompt
//   2. Run user_intent through Claude Sonnet 4.5 (via OpenRouter)
//   3. Submit the enhanced brief to nano-banana-pro-edit with the
//      uploaded product image as `images_list[0]`
//   4. Return the result(s) — supports 1-10 variants per call by
//      fanning out `count` parallel calls server-side.
//
// Body  : { mode, intent, productUrl, count?, aspect?, brand_context? }
// Reply : { url, urls?, mimeType, finalPrompts: string[] }

import { z } from "zod";
import { generateText } from "ai";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import {
  PRODUCT_PHOTOSHOOT_MODES, PRODUCT_ASPECTS,
} from "@/lib/data/product-photoshoot";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  mode:           z.enum(PRODUCT_PHOTOSHOOT_MODES.map((m) => m.id) as [string, ...string[]]),
  intent:         z.string().min(1).max(2_000),
  productUrl:     z.string().url(),
  count:          z.number().int().min(1).max(10).default(1),
  aspect:         z.enum(PRODUCT_ASPECTS.map((a) => a.id) as [string, ...string[]]).optional(),
  brand_context:  z.string().max(500).optional(),
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

  const { mode: modeId, intent, productUrl, count, aspect, brand_context } = parsed.data;
  const mode = PRODUCT_PHOTOSHOOT_MODES.find((m) => m.id === modeId);
  if (!mode) return jsonError("Mode not found");

  const aspectFinal = aspect ?? mode.defaultAspect;
  const negative_prompt =
    "blurry, low quality, watermark, text, logo other than the product label, " +
    "distorted product, missing label, jpeg artifacts, oversaturated, " +
    "extra products, plastic skin";

  // ── Step 1: enhance the user intent through the mode's Claude
  //   system prompt. We fan out `count` calls so each variant gets a
  //   slightly different brief (better diversity than n>1 same-prompt).
  const finalPrompts: string[] = [];
  if (!isAiConfigured()) {
    // Fallback when OpenRouter isn't configured: just stitch the user
    // intent + a simple mode-aware suffix together. Generation still
    // works, just with less polish.
    for (let i = 0; i < count; i++) {
      finalPrompts.push(`${intent.trim()}. ${mode.englishName} style, professional product photography, sharp focus, ultra-detailed, 8K finishing.${brand_context ? ` Brand context: ${brand_context}.` : ""}`);
    }
  } else {
    // Claude branch — N parallel enhancement calls. Each gets the
    // same system prompt but a slightly different user instruction
    // suffix to encourage variation across the batch.
    const userPrompt = (variant: number) => {
      const variationHint = count > 1
        ? ` (Variation ${variant + 1} of ${count} — vary lighting angle, prop choice, and composition slightly while keeping the brand mood consistent.)`
        : "";
      return `User intent: ${intent.trim()}${brand_context ? `\nBrand context: ${brand_context}` : ""}${variationHint}\n\nWrite the brief now.`;
    };

    const llmResults = await Promise.allSettled(
      Array.from({ length: count }, (_, i) =>
        generateText({
          model:       aiModel("anthropic/claude-sonnet-4.5"),
          system:      mode.systemPrompt,
          prompt:      userPrompt(i),
          temperature: 0.85,
        })
      )
    );
    for (const r of llmResults) {
      if (r.status === "fulfilled") {
        const text = r.value.text.trim().replace(/^["'`]+|["'`]+$/g, "");
        finalPrompts.push(text);
      } else {
        // Fallback per-failure — never abort the whole batch
        finalPrompts.push(`${intent.trim()}. ${mode.englishName} style, professional product photography.`);
      }
    }
  }

  // ── Step 2: submit each enhanced prompt to nano-banana-pro-edit
  //   with the product image as the visual anchor.
  const submissions = await Promise.allSettled(
    finalPrompts.map((prompt) =>
      submitAndPollServer({
        endpoint:  "nano-banana-pro-edit",
        apiKey:    muKey,
        payload: {
          prompt,
          aspect_ratio:  aspectFinal,
          resolution:    "2k",
          num_images:    1,
          negative_prompt,
          images_list:   [productUrl],
        },
        timeoutMs: 4 * 60 * 1000,
      })
    )
  );

  const urls: string[] = [];
  let firstError: string | undefined;
  for (const sub of submissions) {
    if (sub.status === "fulfilled") {
      const u = pickResultUrl(sub.value);
      if (u) urls.push(u);
    } else if (!firstError) {
      firstError = sub.reason instanceof Error ? sub.reason.message : String(sub.reason);
    }
  }
  if (urls.length === 0) {
    return jsonError(firstError ?? "لم يتم استلام أي ناتج", 502);
  }

  return jsonOk({
    url:          urls[0],
    urls,
    mimeType:     "image/png",
    finalPrompts,
    mode:         modeId,
    aspect:       aspectFinal,
    count:        urls.length,
    failedCount:  count - urls.length,
  });
}
