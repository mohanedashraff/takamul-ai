// ════════════════════════════════════════════════════════════════
// POST /api/tools/breakdown
// ════════════════════════════════════════════════════════════════
// Visual-search utility — multimodal Claude reads an uploaded image
// and returns a structured breakdown:
//
//   • subject       — concise description of the main subject
//   • items[]       — every distinguishable object with type / colour /
//                     material / brand-guess where confident
//   • palette[]     — top 5 dominant HEX colours
//   • mood          — one-sentence vibe summary
//
// This mirrors the reference platform's "breakdown" viral-tool / app —
// useful for moodboarding, fashion-source identification, and ad-art
// cataloguing.
//
// Body  : { image_url: string }
// Reply : { breakdown: { subject, items, palette, mood } }
//
// Credit cost: 2 (flat). Refunded on Claude failure.

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
  image_url: z.string().url(),
});

const BreakdownSchema = z.object({
  subject: z.string().min(1).max(280),
  items: z
    .array(
      z.object({
        type:        z.string().min(1).max(80),
        description: z.string().min(1).max(200),
        color:       z.string().min(1).max(80).optional(),
        material:    z.string().min(1).max(80).optional(),
        brandGuess:  z.string().min(1).max(80).optional(),
        confidence:  z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .max(20),
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(5),
  mood: z.string().min(1).max(280),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  if (!isAiConfigured()) {
    return jsonError("الميزة دي محتاجة مفتاح OpenRouter — كلّم الأدمن", 503);
  }

  const rl = rateLimit({ key: clientKey(req, "breakdown"), limit: 30, windowMs: 60 * 60 * 1000 });
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

  const { image_url } = parsed.data;

  // ── Charge first; refund on failure ──
  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "tool:breakdown",
      metadata: { imageUrl: image_url },
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
      schema: BreakdownSchema,
      system:
        "You are a visual-search assistant. Look at the image and produce a structured " +
        "breakdown of everything visible: subject, items (objects/garments/products with " +
        "their colour, material, and a brand guess if you're confident), a 5-colour HEX " +
        "palette of dominant tones, and a one-sentence mood description. " +
        "Be precise but concise. If unsure about a brand, omit brandGuess — never invent one.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text",  text: "Break this image down into structured fields." },
            { type: "image", image: image_url },
          ],
        },
      ],
      maxRetries: 1,
    });
    return jsonOk({ breakdown: object, creditsBalance: balanceAfter });
  } catch (err) {
    // Refund on failure
    await addCredits({
      userId:   session.user.id,
      amount:   COST,
      reason:   "refund:breakdown-failed",
      type:     "REFUND",
      metadata: { imageUrl: image_url, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Breakdown failed";
    return jsonError(message, 500);
  }
}
