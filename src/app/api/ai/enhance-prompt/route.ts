// ════════════════════════════════════════════════════════════════
// POST /api/ai/enhance-prompt — auto-expand a user prompt
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `enhance_prompt: true` flag — we run the user's
// short text through Claude Sonnet 4.5 (via OpenRouter) and expand
// it into a richly-detailed English prompt tuned for the target
// studio. If the input is in Arabic we translate as part of the
// expansion. Returns ~60-100 words.
//
// Body:  { prompt: string, variant: "soul" | "cinema" | "marketing" }
// Reply: { enhanced: string }
//
// Free for now (pure UX improvement). When we add per-call cost we'll
// wire it through deductCredits like other tools.

import { z } from "zod";
import { generateText } from "ai";
import { aiModel, isAiConfigured } from "@/lib/ai-provider";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime    = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  prompt:  z.string().min(2).max(2_000),
  variant: z.enum(["soul", "cinema", "marketing", "generic"]).default("generic"),
});

// Each studio has its own system prompt so the expansion stays in
// the right lane — Soul leans editorial, Cinema leans atmospheric,
// Marketing leans social-media-energy.
const SYSTEM_PROMPTS: Record<z.infer<typeof Schema>["variant"], string> = {
  soul: `You are a prompt expansion engine for an editorial fashion image
generator. Given the user's short text, expand it into a 60-100 word
English prompt that focuses on:
  • subject details, pose, expression
  • lighting (soft, natural, golden hour, etc.)
  • composition / framing
  • photographic technical hints (lens, depth of field)
  • editorial / fashion-magazine aesthetic cues

Do NOT include text rendering, watermarks, or specific colour names —
the user picks colour palettes separately.
If the input is Arabic, translate the meaning then expand.
Reply with the expanded prompt ONLY — no preamble, no quotes, no markdown.`,

  cinema: `You are a prompt expansion engine for a cinematic image / video
generator. Given the user's short text, expand it into a 60-100 word
English prompt focused on:
  • cinematic atmosphere and mood
  • lighting setup (motivated practicals, dramatic key, etc.)
  • shot framing and blocking
  • visual storytelling cues
  • action / character moment

Do NOT name specific cameras, lenses, or focal lengths — the user
picks those separately. Do NOT name a specific genre or palette.
If the input is Arabic, translate the meaning then expand.
Reply with the expanded prompt ONLY — no preamble, no quotes, no markdown.`,

  marketing: `You are a prompt expansion engine for a product / app marketing
video generator. Given the user's short text, expand it into a 60-100
word English prompt focused on:
  • product or app showcase moment
  • talent action / emotion / hook
  • energy and pacing (scroll-stopping)
  • social-media-ready vibe (UGC / unboxing / review feel)

Do NOT name specific formats / hooks / settings (Bedroom, Volcano,
UGC, etc.) — the user picks those separately.
If the input is Arabic, translate the meaning then expand.
Reply with the expanded prompt ONLY — no preamble, no quotes, no markdown.`,

  generic: `You are a prompt expansion engine for an AI image / video generator.
Given the user's short text, expand it into a 60-100 word English
prompt with subject, lighting, composition, mood, and quality cues.
If the input is Arabic, translate the meaning then expand.
Reply with the expanded prompt ONLY — no preamble, no quotes, no markdown.`,
};

export async function POST(req: Request) {
  const { response } = await requireAuth();
  if (response) return response;

  // Cap to ~30 expansions / hour / user — generous but stops obvious abuse.
  const rl = rateLimit({ key: clientKey(req, "enhance-prompt"), limit: 30, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "محاولات كثيرة — حاول لاحقاً" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }

  if (!isAiConfigured()) {
    return jsonError("الـAI غير مُعدّ. أضف OPENROUTER_API_KEY إلى البيئة.", 503);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { prompt, variant } = parsed.data;

  try {
    const { text } = await generateText({
      model:       aiModel("anthropic/claude-sonnet-4.5"),
      system:      SYSTEM_PROMPTS[variant],
      prompt:      `User prompt:\n"""\n${prompt.trim()}\n"""\n\nExpanded prompt:`,
      temperature: 0.7,
    });
    // Strip any stray quote/preamble Claude might add despite instructions.
    const enhanced = text
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^Expanded prompt:\s*/i, "")
      .trim();
    if (!enhanced) return jsonError("لم نحصل على ناتج من النموذج", 502);
    return jsonOk({ enhanced });
  } catch (err) {
    console.error("[enhance-prompt]", err);
    return jsonError(err instanceof Error ? err.message : "Enhance failed", 500);
  }
}
