// ════════════════════════════════════════════════════════════════
// POST /api/tools/storyboard-extractor
// ════════════════════════════════════════════════════════════════
// Multimodal Claude reads a single storyboard sheet (PDF page or
// composite image with multiple panels) and breaks it down into
// individual shot prompts ready for image-gen / video-gen.
//
// Output is a list of shots, each with:
//   • panelIndex  — order on the sheet
//   • shotType    — wide / medium / close / extreme close / aerial / pov
//   • cameraMove  — static / pan / dolly / push / pull / tilt / orbit
//   • duration    — seconds (estimated)
//   • description — concise but vivid prompt
//   • dialogue?   — any speech bubble / caption text
//   • notes?      — direction notes ("freeze frame", "match cut to next panel")
//
// Body  : { image_url: string, expectedPanels?: number }
// Reply : { shots: Shot[], totalPanels: number, creditsBalance }
//
// Credit cost: 4 (flat). Refunded on failure.

import { z } from "zod";
import { generateObject } from "ai";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 90;

const COST = 4;

const Schema = z.object({
  image_url:       z.string().url(),
  expectedPanels:  z.number().int().min(2).max(30).optional(),
});

const ShotSchema = z.object({
  panelIndex:  z.number().int().min(1).max(30),
  shotType: z.enum([
    "wide", "medium", "close", "extreme-close",
    "aerial", "pov", "two-shot", "over-shoulder",
  ]),
  cameraMove: z.enum([
    "static", "pan", "dolly-in", "dolly-out",
    "push-in", "pull-back", "tilt", "orbit", "tracking",
  ]),
  duration:    z.number().min(0.5).max(20),
  description: z.string().min(1).max(600),
  dialogue:    z.string().max(280).optional(),
  notes:       z.string().max(280).optional(),
});

const ResultSchema = z.object({
  totalPanels: z.number().int().min(1).max(30),
  shots:       z.array(ShotSchema).min(1).max(30),
  /** Overall storyline arc — one paragraph linking the shots. */
  arcSummary:  z.string().min(1).max(600),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  if (!isAiConfigured()) {
    return jsonError("الميزة دي محتاجة مفتاح OpenRouter", 503);
  }

  const rl = rateLimit({ key: clientKey(req, "storyboard"), limit: 30, windowMs: 60 * 60 * 1000 });
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

  const { image_url, expectedPanels } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:storyboard-extractor",
      metadata: { image_url, expectedPanels },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    const hint = expectedPanels
      ? `The user said this sheet has roughly ${expectedPanels} panels — use that as a sanity check.`
      : "Count the panels yourself.";

    const { object } = await generateObject({
      model:  aiModel("anthropic/claude-sonnet-4.5"),
      schema: ResultSchema,
      system:
        "You are a film-production storyboard analyst. Look at the supplied " +
        "storyboard sheet (a single image with multiple panels) and break it " +
        "down panel-by-panel. For each panel, output: shotType, cameraMove, " +
        "estimated duration, a vivid prompt-ready description, any visible " +
        "dialogue/captions, and director's notes (freeze, match cut, etc.). " +
        "Read panels in the conventional left-to-right, top-to-bottom order " +
        "unless arrows clearly indicate otherwise. Be precise — the output " +
        "feeds directly into a video-gen pipeline. " + hint + " " +
        "Finally, produce a one-paragraph arcSummary linking the shots into a story.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text",  text: "Break this storyboard down panel-by-panel." },
            { type: "image", image: image_url },
          ],
        },
      ],
      maxRetries: 1,
    });

    return jsonOk({
      shots:          object.shots,
      totalPanels:    object.totalPanels,
      arcSummary:     object.arcSummary,
      creditsBalance: balanceAfter,
    });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:storyboard-failed",
      type:     "REFUND",
      metadata: { image_url, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Storyboard extraction failed";
    return jsonError(message, 500);
  }
}
