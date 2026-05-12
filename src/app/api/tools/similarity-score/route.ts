// ════════════════════════════════════════════════════════════════
// POST /api/tools/similarity-score
// ════════════════════════════════════════════════════════════════
// Compare two images and return a similarity assessment via
// multimodal Claude:
//
//   • similarityScore — 0-100 (how alike the images are overall)
//   • identityMatch   — 0-100 (same subject? — useful for face-match)
//   • styleMatch      — 0-100 (same vibe / colour grade?)
//   • differences[]   — bullet-point list of meaningful differences
//   • summary         — one-sentence verdict
//
// Body  : { image_a_url: string, image_b_url: string }
// Reply : { score: {...}, creditsBalance: number }
//
// Credit cost: 2 (flat). Refunded on failure.

import { z } from "zod";
import { generateObject } from "ai";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 60;

const COST = 2;

const Schema = z.object({
  image_a_url: z.string().url(),
  image_b_url: z.string().url(),
});

const ScoreSchema = z.object({
  similarityScore: z.number().min(0).max(100),
  identityMatch:   z.number().min(0).max(100),
  styleMatch:      z.number().min(0).max(100),
  differences:     z.array(z.string().min(1).max(200)).max(8),
  summary:         z.string().min(1).max(280),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  if (!isAiConfigured()) {
    return jsonError("الميزة دي محتاجة مفتاح OpenRouter — كلّم الأدمن", 503);
  }

  const rl = rateLimit({ key: clientKey(req, "similarity-score"), limit: 30, windowMs: 60 * 60 * 1000 });
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

  const { image_a_url, image_b_url } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:similarity-score",
      metadata: { imageA: image_a_url, imageB: image_b_url },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    const { object } = await generateObject({
      model:  aiModel("anthropic/claude-sonnet-4.5"),
      schema: ScoreSchema,
      system:
        "You are a visual-similarity assessor. Compare two images and return three " +
        "0-100 scores: similarityScore (overall), identityMatch (same subject / face), " +
        "and styleMatch (same vibe / palette / lighting). Then list up to 8 meaningful " +
        "differences as short bullet phrases, and a one-sentence verdict. " +
        "If one or both images don't have a clear subject, set identityMatch to 0 and " +
        "explain it in the summary. Be calibrated — 100 means visually identical, " +
        "80 means same subject with minor differences, 50 means similar vibe but " +
        "different subject, 0 means unrelated.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text",  text: "Image A (first):" },
            { type: "image", image: image_a_url },
            { type: "text",  text: "Image B (second):" },
            { type: "image", image: image_b_url },
            { type: "text",  text: "Score them now using the schema." },
          ],
        },
      ],
      maxRetries: 1,
    });
    return jsonOk({ score: object, creditsBalance: balanceAfter });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:similarity-failed",
      type:     "REFUND",
      metadata: { imageA: image_a_url, imageB: image_b_url, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Similarity scoring failed";
    return jsonError(message, 500);
  }
}
