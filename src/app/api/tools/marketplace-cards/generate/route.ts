// ════════════════════════════════════════════════════════════════
// POST /api/tools/marketplace-cards/generate
// ════════════════════════════════════════════════════════════════
// Yilow's marketplace-cards studio — a structured 13-asset
// marketplace listing flow. Each asset has its own Claude system
// prompt encoding the marketplace compliance rules + visual
// conventions (Amazon white-bg, A+ layout grammar, …).
//
// Pipeline:
//   1. For each picked asset, run the user's product context through
//      its asset-specific Claude system prompt → enhanced brief.
//   2. Submit each brief in parallel to nano-banana-pro-edit with the
//      uploaded product image as `images_list[0]`.
//   3. Return all URLs keyed by asset id so the UI can show them
//      grouped (main / secondary / aplus).
//
// Body  : { selectedAssetIds, intent, productUrl, brand_context?,
//           category?, visual_style? }
// Reply : { results: { assetId, url, prompt }[], failedCount }

import { z } from "zod";
import { generateText } from "ai";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { MARKETPLACE_ASSETS } from "@/lib/data/marketplace-cards";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  selectedAssetIds: z.array(z.string()).min(1, "اختر أصلاً واحداً على الأقل").max(13),
  intent:           z.string().min(1).max(2_000),
  productUrl:       z.string().url(),
  brand_context:    z.string().max(500).optional(),
  category:         z.string().max(80).optional(),
  visual_style:     z.string().max(200).optional(),
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

  const { selectedAssetIds, intent, productUrl, brand_context, category, visual_style } = parsed.data;
  const assetsToGenerate = selectedAssetIds
    .map((id) => MARKETPLACE_ASSETS.find((a) => a.id === id))
    .filter((a): a is (typeof MARKETPLACE_ASSETS)[number] => !!a);
  if (assetsToGenerate.length === 0) return jsonError("لا توجد أصول صالحة");

  const negative_prompt =
    "blurry, low quality, watermark, text overlays unless explicitly required, " +
    "logo other than the product label, jpeg artifacts, oversaturated, distorted product";

  // Build the per-asset enhancer + submission promise in one go.
  const tasks = assetsToGenerate.map(async (asset) => {
    let prompt: string;
    if (!isAiConfigured()) {
      prompt = `${intent.trim()}. ${asset.englishName} layout for marketplace listing.${brand_context ? ` Brand: ${brand_context}.` : ""}${category ? ` Category: ${category}.` : ""}${visual_style ? ` Style: ${visual_style}.` : ""}`;
    } else {
      const userMsg = [
        `Product context: ${intent.trim()}`,
        brand_context ? `Brand context: ${brand_context}` : null,
        category      ? `Product category: ${category}`   : null,
        visual_style  ? `Brand visual style: ${visual_style}` : null,
        "",
        "Write the brief now for this specific asset type.",
      ].filter(Boolean).join("\n");
      try {
        const { text } = await generateText({
          model:       aiModel("anthropic/claude-sonnet-4.5"),
          system:      asset.systemPrompt,
          prompt:      userMsg,
          temperature: 0.75,
        });
        prompt = text.trim().replace(/^["'`]+|["'`]+$/g, "");
      } catch {
        prompt = `${intent.trim()}. ${asset.englishName} layout for marketplace listing.`;
      }
    }
    try {
      const result = await submitAndPollServer({
        endpoint:  "nano-banana-pro-edit",
        apiKey:    muKey,
        payload: {
          prompt,
          aspect_ratio:  asset.defaultAspect,
          resolution:    "2k",
          num_images:    1,
          negative_prompt,
          images_list:   [productUrl],
        },
        timeoutMs: 4 * 60 * 1000,
      });
      const url = pickResultUrl(result);
      return { assetId: asset.id, url, prompt, ok: !!url };
    } catch (err) {
      return {
        assetId: asset.id,
        url:     null as string | null,
        prompt,
        ok:      false,
        error:   err instanceof Error ? err.message : String(err),
      };
    }
  });

  const settled = await Promise.allSettled(tasks);
  const results = settled.map((s) =>
    s.status === "fulfilled" ? s.value : { assetId: "?", url: null as string | null, prompt: "", ok: false, error: String(s.reason) }
  );
  const failedCount = results.filter((r) => !r.ok).length;
  if (failedCount === results.length) {
    const firstErr = results.find((r) => !r.ok && "error" in r);
    return jsonError(firstErr?.error ?? "كل الأصول فشلت", 502);
  }

  return jsonOk({
    results,
    failedCount,
    totalCount:   results.length,
  });
}
