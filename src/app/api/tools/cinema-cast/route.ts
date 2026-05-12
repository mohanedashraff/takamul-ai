// ════════════════════════════════════════════════════════════════
// POST /api/tools/cinema-cast — Cinema Character generator
// ════════════════════════════════════════════════════════════════
// Mirrors the reference platform's `cinematic_studio_soul_cast` flow,
// where the user fills a structured form (archetype, gender, body
// type, era, genre, attractiveness) plus a name + short backstory,
// and the platform composes a portrait of the character.
//
// We approximate it by:
//   1. Composing a richly-structured English prompt from all 8 fields.
//   2. Submitting to MuAPI's `nano-banana-pro` text-to-image endpoint
//      at 2K with a portrait aspect ratio (3:4 default).
//
// Body (JSON):
//   { full_name:      string,
//     description:    string,
//     archetype:      string,         // e.g. "hero" / "villain" / ...
//     gender:         "male"|"female"|"non-binary",
//     body_type:      string,         // e.g. "athletic" / "muscular"
//     era:            string,         // e.g. "modern" / "medieval"
//     genre:          string,         // 6 cinema genres
//     attractiveness: number          // 0-10 charisma slider
//   }
//
// Returns: { url, mimeType:"image/png", urls?, requestId? }

import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  full_name:      z.string().min(1).max(120),
  description:    z.string().min(1).max(2_000),
  archetype:      z.string().min(1).max(40),
  gender:         z.enum(["male", "female", "non-binary"]),
  body_type:      z.string().min(1).max(40),
  era:            z.string().min(1).max(40),
  // Accept the 14 Higgsfield-aligned genres plus our 2 originals.
  // Permissive enum makes adding genres a one-line change.
  genre:          z.string().min(1).max(40),
  attractiveness: z.number().int().min(0).max(10),
  // Higgsfield Cast extras (all optional — only stitched into the
  // prompt when explicitly picked).
  hair_style:     z.string().max(40).optional(),
  hair_color:     z.string().max(40).optional(),
  eye_color:      z.string().max(40).optional(),
  outfit:         z.string().max(40).optional(),
  beard:          z.string().max(40).optional(),
  imperfections:  z.string().max(40).optional(),
});

const HAIR_STYLE_HINTS: Record<string, string> = {
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
const HAIR_COLOR_HINTS: Record<string, string> = {
  black:  "jet-black hair",
  brown:  "brown hair",
  blonde: "blonde hair",
  auburn: "auburn / chestnut hair",
  red:    "red hair",
  grey:   "grey hair",
  white:  "white hair",
};
const EYE_COLOR_HINTS: Record<string, string> = {
  brown: "warm brown eyes",
  blue:  "bright blue eyes",
  green: "green eyes",
  hazel: "hazel eyes",
  amber: "amber eyes",
  gray:  "cool grey eyes",
};
const OUTFIT_HINTS: Record<string, string> = {
  casual:      "casual everyday outfit",
  formal:      "formal tailored outfit",
  sporty:      "sporty athletic outfit",
  highfashion: "high-fashion editorial outfit",
  military:    "military-styled outfit",
  workwear:    "workwear-styled outfit",
  vintage:     "vintage period outfit",
  punk:        "punk styling, leather and studs",
};
const BEARD_HINTS: Record<string, string> = {
  "clean-shaven": "clean-shaven",
  stubble:        "light stubble",
  short_beard:    "short well-kept beard",
  beard:          "full beard",
  long_beard:     "long beard",
  mustache:       "groomed mustache",
};
const IMPERFECTIONS_HINTS: Record<string, string> = {
  none:        "",
  freckles:    "soft freckles across the cheeks",
  facial_scar: "small facial scar (character-building, not gruesome)",
  tattoos:     "tasteful visible tattoos",
  eye_patch:   "single eye patch",
};

// ── Composers ──────────────────────────────────────────────────────────

const ARCHETYPE_HINTS: Record<string, string> = {
  hero:       "principled hero archetype, resolute presence, quiet strength",
  antihero:   "antihero archetype, morally complex, weathered",
  villain:    "villain archetype, calculating menace, controlled stillness",
  mentor:     "mentor archetype, wisdom-worn features, calm authority",
  trickster:  "trickster archetype, mischievous spark in the eyes, asymmetric smirk",
  everyman:   "everyman archetype, relatable warmth, unguarded expression",
  innocent:   "innocent archetype, open trusting expression, soft features",
  explorer:   "explorer archetype, curious gaze, road-worn texture",
  ruler:      "ruler archetype, commanding posture, controlled regal bearing",
  creator:    "creator archetype, focused intensity, hands suggesting craft",
  rebel:      "rebel archetype, defiant posture, untamed energy",
  lover:      "lover archetype, magnetic warmth, soft inviting gaze",
  // ── Higgsfield additions ───────────────────────────────────────
  sage:       "sage archetype, contemplative eyes, weathered wisdom",
  jester:     "jester archetype, playful raised brow, lopsided grin",
  magician:   "magician archetype, knowing half-smile, otherworldly stillness",
  caregiver:  "caregiver archetype, warm reassuring expression, steady presence",
};

const ERA_HINTS: Record<string, string> = {
  ancient:      "ancient-era costume and props, tactile natural materials, classical wardrobe",
  medieval:     "medieval-era costume, leather and chain, candlelit color palette",
  renaissance:  "Renaissance-era costume, rich velvet and embroidery, painterly composition",
  victorian:    "Victorian-era costume, high collar and tailored coat, foggy gas-lamp light",
  "1920s":      "1920s-era costume, art-deco styling, jazz-age glamour",
  "noir-1940s": "1940s noir wardrobe, fedora and trench, hard venetian-blind shadows",
  "1970s":      "1970s wardrobe, warm earthy palette, soft film grain",
  "1980s":      "1980s wardrobe, neon-tinged backlighting, bold silhouettes",
  modern:       "modern contemporary wardrobe, naturalistic styling",
  "near-future": "near-future wardrobe, subtle techwear accents, clean architecture",
  cyberpunk:    "cyberpunk styling, neon rim light, holographic glitch accents",
  "post-apoc":  "post-apocalyptic wardrobe, weathered layers, dust and ash atmosphere",
  "space-opera": "space opera costume, holstered tools, deep-space ambient light",
};

const GENRE_HINTS: Record<string, string> = {
  action:     "high-energy action cinema mood, kinetic stance, bold contrast",
  horror:     "horror cinema atmosphere, dread, low-key shadows, unsettling framing",
  comedy:     "comedy cinema mood, bright energetic palette, charming light",
  noir:       "classic film noir aesthetic, hard shadows, venetian-blind light, moral ambiguity",
  drama:      "intimate dramatic cinema, emotional close-up, restrained colour, naturalistic light",
  epic:       "epic cinema scale, heroic blocking, atmospheric depth",
  // ── Higgsfield additions ───────────────────────────────────────
  adventure:  "adventure cinema mood, golden-hour exploration, wide vistas hinted",
  detective:  "detective procedural mood, smoky urban interior, tungsten desk light",
  fantasy:    "fantasy cinema atmosphere, magical rim-light, mythic colour palette",
  historical: "period historical cinema, time-accurate styling, painterly composition",
  romance:    "romantic cinema mood, soft golden glow, intimate framing",
  "sci-fi":   "sci-fi cinema aesthetic, neon-cool palette, sleek production design",
  sitcom:     "TV sitcom warm-set mood, flat shadows, bright friendly palette",
  thriller:   "thriller cinema mood, tense low-key lighting, anxious framing",
  war:        "war cinema mood, smoke and dust, desaturated palette",
  western:    "western cinema mood, dusty golden plains, low-angle hero framing",
};

const BODY_HINTS: Record<string, string> = {
  slim:       "slim build",
  lean:       "lean wiry build",
  athletic:   "athletic build",
  muscular:   "muscular powerful build",
  curvy:      "curvy build",
  heavy:      "heavyset solid build",
  // ── Higgsfield additions ───────────────────────────────────────
  average:    "average naturally-proportioned build",
  stocky:     "stocky solid-shoulders build",
  plus_size:  "plus-size confident build",
};

function attractivenessHint(score: number): string {
  // 0-3: rough/lived-in; 4-6: average / approachable; 7-9: striking;
  // 10: magnetically beautiful. Keep the language SFW and editorial.
  if (score <= 3) return "lived-in raw features, weathered character";
  if (score <= 6) return "average approachable features, natural appeal";
  if (score <= 9) return "striking handsome/beautiful features, magnetic presence";
  return "magnetically beautiful features, screen-icon presence";
}

function composePrompt(params: z.infer<typeof Schema>): string {
  const archetype = ARCHETYPE_HINTS[params.archetype]
    ?? `${params.archetype} archetype`;
  const era       = ERA_HINTS[params.era]
    ?? `${params.era} era styling`;
  const genre     = GENRE_HINTS[params.genre]
    ?? `${params.genre} cinema mood`;
  const body      = BODY_HINTS[params.body_type]
    ?? `${params.body_type} build`;
  const charisma  = attractivenessHint(params.attractiveness);

  // Optional Higgsfield Cast extras — combined into a single "Features"
  // clause to keep the prompt readable.
  const extras: string[] = [];
  if (params.hair_style && params.hair_style.length) {
    extras.push(HAIR_STYLE_HINTS[params.hair_style] ?? `${params.hair_style} hair`);
  }
  if (params.hair_color && params.hair_color.length) {
    extras.push(HAIR_COLOR_HINTS[params.hair_color] ?? `${params.hair_color} hair colour`);
  }
  if (params.eye_color && params.eye_color.length) {
    extras.push(EYE_COLOR_HINTS[params.eye_color] ?? `${params.eye_color} eyes`);
  }
  if (params.outfit && params.outfit.length) {
    extras.push(OUTFIT_HINTS[params.outfit] ?? `${params.outfit} outfit`);
  }
  if (params.beard && params.beard.length && params.gender === "male") {
    extras.push(BEARD_HINTS[params.beard] ?? params.beard);
  }
  if (params.imperfections && params.imperfections.length && params.imperfections !== "none") {
    extras.push(IMPERFECTIONS_HINTS[params.imperfections] ?? params.imperfections);
  }
  const features = extras.length > 0 ? `Features: ${extras.join(", ")}.` : "";

  return [
    // Subject + name + backstory anchor the model on a specific person.
    `Cinematic character portrait of ${params.full_name.trim()}, a ${params.gender} character.`,
    `Backstory: ${params.description.trim()}.`,
    // Visual / personality layers from structured params.
    `Archetype: ${archetype}.`,
    `Build: ${body}.`,
    `Era: ${era}.`,
    `Mood: ${genre}.`,
    `Look: ${charisma}.`,
    features,
    // Cinematic finishing tail.
    "Three-quarter framing, head and upper body, eye contact with camera.",
    "Shot on 35mm film, anamorphic widescreen feel, professional cinematography.",
    "Ultra-detailed face, sharp focus, natural skin tones, 8K finishing.",
    "No text, no watermarks, no logos.",
  ].filter(Boolean).join(" ");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const muKey = process.env.MU_API_KEY;
  if (!muKey) return jsonError("MuAPI key missing on server", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const finalPrompt = composePrompt(parsed.data);

  const negative_prompt =
    "blurry, low quality, distorted face, asymmetric eyes, bad anatomy, " +
    "watermark, text, logo, signature, jpeg artifacts, oversaturated, plastic skin";

  const payload: Record<string, unknown> = {
    prompt:          finalPrompt,
    aspect_ratio:    "3:4",          // portrait — character work
    resolution:      "2k",
    num_images:      1,
    negative_prompt,
  };

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
    if (!url) return jsonError("لم يتم استلام الناتج من Cinema Cast", 502);
    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: result.requestId,
      raw:       result.raw,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Cinema Cast generation failed", 500);
  }
}
