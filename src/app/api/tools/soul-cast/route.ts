// ════════════════════════════════════════════════════════════════
// POST /api/tools/soul-cast — Soul Studio character generator
// ════════════════════════════════════════════════════════════════
// Soul-specific counterpart to /api/tools/cinema-cast. Mirrors the
// reference platform's `soul_cast` flow: a structured character
// builder that produces clean, identity-preserving portraits
// optimized for use as Soul ID seed references.
//
// Differences from cinema-cast:
//   • Output is portrait (3:4) at 2K — perfect frame for Soul
//     thumbnails + face-driven generation.
//   • Composition skews toward neutral studio lighting (Soul ID
//     trains better on consistent lighting).
//   • No "genre" knob — Soul characters travel across genres so
//     baking one in hurts versatility.
//
// Body  : structured character form (8 fields)
// Reply : { url, urls?, requestId? }
//
// Credit cost: 6 — same as Soul portrait. Refunded on failure.

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";

export const runtime    = "nodejs";
export const maxDuration = 240;

const COST = 6;

const Schema = z.object({
  full_name:      z.string().min(1).max(120),
  description:    z.string().min(1).max(2_000),
  archetype:      z.string().min(1).max(40),
  gender:         z.enum(["male", "female", "non-binary"]),
  body_type:      z.string().min(1).max(40),
  age_range:      z.enum(["teen", "20s", "30s", "40s", "50s", "60-plus"]).default("30s"),
  hair_style:     z.string().max(80).optional(),
  ethnicity_hint: z.string().max(80).optional(),
  num_images:     z.number().int().min(1).max(4).default(1),
});

const ARCHETYPE_HINTS: Record<string, string> = {
  hero:       "principled hero archetype, resolute presence",
  antihero:   "antihero archetype, morally complex, weathered",
  villain:    "villain archetype, calculating menace, controlled stillness",
  mentor:     "mentor archetype, wisdom-worn features, calm authority",
  trickster:  "trickster archetype, mischievous spark, asymmetric smirk",
  everyman:   "everyman archetype, relatable warmth, unguarded expression",
  innocent:   "innocent archetype, open trusting expression",
  explorer:   "explorer archetype, curious gaze",
  ruler:      "ruler archetype, commanding posture, regal bearing",
  creator:    "creator archetype, focused intensity",
  rebel:      "rebel archetype, defiant posture",
  lover:      "lover archetype, magnetic warmth, soft inviting gaze",
  // ── Higgsfield additions ───────────────────────────────────────
  sage:       "sage archetype, contemplative eyes, weathered wisdom",
  jester:     "jester archetype, playful raised brow, lopsided grin",
  magician:   "magician archetype, knowing half-smile, otherworldly stillness",
  caregiver:  "caregiver archetype, warm reassuring expression, steady presence",
};

// Map our slug-style identity values onto a human-readable English
// phrase the prompt-builder splices in. Mirrors Higgsfield's 6
// identity buckets.
const ETHNICITY_HINT_MAP: Record<string, string> = {
  asian:    "East Asian heritage",
  black:    "African / Black heritage",
  european: "European heritage",
  hindi:    "Indian / South Asian heritage",
  latina:   "Latin / Hispanic heritage",
  mixed:    "mixed-heritage features",
};

// Map our hair-style slugs onto descriptive English.
const HAIR_STYLE_MAP: Record<string, string> = {
  short:       "short hair",
  medium:      "medium-length hair",
  long:        "long flowing hair",
  very_long:   "very long hair",
  bangs:       "front bangs",
  bun:         "neat hair bun",
  ponytail:    "ponytail",
  afro:        "afro hairstyle",
  braids:      "braided hair",
  dreadlocks:  "dreadlocks",
  messy:       "tousled messy hair",
  slick_back:  "slick-back hair",
  shave_sides: "shaved-sides hairstyle",
  undercut:    "undercut hairstyle",
  blade:       "clean-shaven head",
};

const AGE_HINTS: Record<string, string> = {
  "teen":     "late teen, soft youthful features",
  "20s":      "mid-twenties, sharp youthful proportions",
  "30s":      "early-thirties, settled adult bone structure",
  "40s":      "mid-forties, subtle character lines",
  "50s":      "mid-fifties, refined mature features",
  "60-plus":  "sixty-plus, dignified weathered features, distinguished gray",
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

  const {
    full_name, description, archetype, gender, body_type,
    age_range, hair_style, ethnicity_hint, num_images,
  } = parsed.data;

  const archetypeHint = ARCHETYPE_HINTS[archetype.toLowerCase()] ?? `${archetype} archetype`;
  const ageHint       = AGE_HINTS[age_range] ?? "adult";
  // Slug-aware translation — if the value is one of our known slugs
  // use the mapped phrase; otherwise fall back to the raw text (so
  // free-text values still work for backward compat).
  const hairPhrase    = hair_style
    ? (HAIR_STYLE_MAP[hair_style] ?? `${hair_style} hairstyle`)
    : "";
  const hairBit       = hairPhrase ? `${hairPhrase}, ` : "";
  const ethnicityPhrase = ethnicity_hint
    ? (ETHNICITY_HINT_MAP[ethnicity_hint] ?? `${ethnicity_hint} heritage`)
    : "";
  const ethnicityBit  = ethnicityPhrase ? `${ethnicityPhrase}, ` : "";

  const finalPrompt = [
    `Studio portrait of ${full_name.trim()}, a ${gender} character with ${body_type} build.`,
    `${ageHint}. ${ethnicityBit}${hairBit}${archetypeHint}.`,
    `Backstory note (for emotional cast only — don't render as a scene): ${description.trim()}`,
    "Composition: clean three-quarter portrait, neutral mid-gray seamless backdrop, soft three-point softbox lighting,",
    "subject facing slightly off-camera, relaxed natural expression, sharp focus on eyes, photographic 85 mm lens look,",
    "skin texture preserved, no compositing artefacts, no genre styling, no costume drama — this is a clean reference plate.",
  ].join(" ");

  const totalCost = COST * num_images;

  let balanceAfter: number;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   totalCost,
      reason:   "tool:soul-cast",
      metadata: { full_name, num_images },
    });
    balanceAfter = r.balanceAfter;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  try {
    // Generate `num_images` in parallel via fan-out.
    const tasks = Array.from({ length: num_images }).map(() =>
      submitAndPollServer({
        endpoint:  "nano-banana-pro",
        apiKey:    muKey,
        payload: {
          prompt:       finalPrompt,
          aspect_ratio: "3:4",
          resolution:   "2k",
        },
        timeoutMs: 3 * 60 * 1000,
      }).then((r) => pickResultUrl(r)),
    );
    const results = await Promise.allSettled(tasks);
    const urls = results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter(Boolean) as string[];

    if (urls.length === 0) {
      // Refund the lot on no-result.
      await addCredits({
        userId:   session.user.id,
        amount:   totalCost,
        reason:   "refund:soul-cast-no-result",
        type:     "REFUND",
        metadata: { full_name },
      }).catch(() => {});
      return jsonError("لم يتم استلام أي ناتج من النموذج", 502);
    }

    // Refund the failed sub-tasks proportionally.
    const missing = num_images - urls.length;
    if (missing > 0) {
      await addCredits({
        userId:   session.user.id,
        amount:   COST * missing,
        reason:   "refund:soul-cast-partial",
        type:     "REFUND",
        metadata: { full_name, missing },
      }).catch(() => {});
    }

    return jsonOk({
      url:            urls[0],
      urls,
      finalPrompt,
      creditsBalance: balanceAfter + COST * missing,
    });
  } catch (err) {
    await addCredits({
      userId:   session.user.id,
      amount:   totalCost,
      reason:   "refund:soul-cast-failed",
      type:     "REFUND",
      metadata: { full_name, error: err instanceof Error ? err.message : "unknown" },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : "Soul Cast failed";
    return jsonError(message, 500);
  }
}
