// ════════════════════════════════════════════════════════════════
// POST /api/cinema-director — pick Cinema Studio settings via LLM
// ════════════════════════════════════════════════════════════════
// Input :  { description: string }   — user's scene description (Arabic or English)
// Output:  { picks: DirectorPicks }
//
// We hand the model a JSON-only contract: it MUST return exactly the
// shape below, with ids drawn from the cinema.ts catalog. We use AI
// Gateway + Anthropic Claude (good at structured JSON), fall back to
// OpenAI if Anthropic isn't reachable.

import { z } from "zod";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api";
import {
  CAMERAS, LENSES, FOCAL_LENGTHS, APERTURES,
  GENRES, COLOR_PALETTES, LIGHTING_STYLES, MOVESETS,
  CINEMA_ASPECTS, CINEMA_RESOLUTIONS,
} from "@/lib/data/cinema";

export const runtime    = "nodejs";
export const maxDuration = 30;

const ReqSchema = z.object({
  description: z.string().min(1).max(2_000),
});

// Output schema — must mirror DirectorPicks on the client side. We use
// `nullable` rather than `optional` because some models (notably the
// gateway-routed Anthropic backend) reject `additionalProperties` in
// JSON Schema; nullable values keep the schema flat.
const PicksSchema = z.object({
  prompt:     z.string().describe("Refined scene description in English. Vivid, ~30-60 words."),
  rationale:  z.string().describe("One short Arabic sentence explaining the directorial choices."),
  cameraId:   z.enum(CAMERAS.map((c) => c.id) as [string, ...string[]]),
  lensId:     z.enum(LENSES.map((l)  => l.id) as [string, ...string[]]),
  focal:      z.number().int().describe("Focal length in mm. Pick from 8, 14, 24, 35, 50, 85."),
  apertureId: z.enum(APERTURES.map((a) => a.id) as [string, ...string[]]),
  genreId:    z.enum(GENRES.map((g)   => g.id) as [string, ...string[]]),
  paletteId:  z.enum(COLOR_PALETTES.map((p)  => p.id) as [string, ...string[]]),
  lightingId: z.enum(LIGHTING_STYLES.map((l) => l.id) as [string, ...string[]]),
  movesetId:  z.enum(MOVESETS.map((m)        => m.id) as [string, ...string[]]),
  aspect:     z.enum(CINEMA_ASPECTS.map((a)     => a.id) as [string, ...string[]]),
  resolution: z.enum(CINEMA_RESOLUTIONS.map((r) => r.id) as [string, ...string[]]),
});

function buildSystemPrompt(): string {
  // Keep this small but information-dense — the model's job is to map
  // a user description to ids it can pick from each catalog. We surface
  // each id alongside its English label so the model has enough signal.
  const fmt = <T extends { id: string | number; englishName?: string; label?: string; descriptor?: string }>(arr: readonly T[]) =>
    arr.map((x) => `  • ${x.id} — ${x.englishName ?? x.label ?? x.descriptor ?? ""}`).join("\n");

  return `You are an experienced cinematographer working inside Yilow's "Cinema Studio".
Your job: given a one-line scene description from the user, pick exactly one option from EACH of the catalogs below.
Respond ONLY by emitting a JSON object that matches the schema. NEVER add free-form prose.

CATALOGS:

Cameras:
${fmt(CAMERAS)}

Lenses:
${fmt(LENSES)}

Focal lengths (mm):
${FOCAL_LENGTHS.map((f) => `  • ${f.id} — ${f.descriptor}`).join("\n")}

Apertures:
${APERTURES.map((a) => `  • ${a.id} — ${a.descriptor}`).join("\n")}

Genres:
${fmt(GENRES)}

Color palettes:
${fmt(COLOR_PALETTES)}

Lighting:
${fmt(LIGHTING_STYLES)}

Camera moveset styles:
${fmt(MOVESETS)}

Aspects: ${CINEMA_ASPECTS.map((a) => a.id).join(", ")}
Resolutions: ${CINEMA_RESOLUTIONS.map((r) => r.id).join(", ")}

Rules:
- "rationale" must be ONE short Arabic sentence (under 25 words) explaining the look you chose.
- "prompt" must be a refined English scene description ready to feed to an image model. Keep it ~30-60 words. Don't repeat camera-spec language — that's appended later automatically.
- Match the genre to the user's tone (action → action, romantic → drama, dark/eerie → horror, etc.).
- If the user wants something cinematic & generic, prefer "drama" or "epic" over "general".
- Pick paletteId/lightingId/movesetId based on the genre and mood. Avoid "auto" unless the description is truly neutral.
- Default aspect: 16:9 unless a vertical/social context is implied (use 9:16 for reels/TikTok, 1:1 for IG square).
- Default resolution: 2k.`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  if (!process.env.AI_GATEWAY_API_KEY) {
    return jsonError("المخرج الذكي غير مُعدّ بعد. أضف AI_GATEWAY_API_KEY إلى البيئة.", 503);
  }

  // Try Anthropic first, fall back to OpenAI on a gateway error so the
  // user always gets picks even if a single provider is rate-limited.
  const candidates = ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"];

  for (const slug of candidates) {
    try {
      const { object } = await generateObject({
        model:   gateway(slug),
        schema:  PicksSchema,
        system:  buildSystemPrompt(),
        prompt:  `User scene description (Arabic or English): "${parsed.data.description}"\n\nReturn the picks JSON now.`,
        temperature: 0.7,
      });
      return jsonOk({ picks: object });
    } catch (err) {
      // Try the next provider
      console.error(`[cinema-director] ${slug} failed:`, err);
      continue;
    }
  }

  return jsonError("تعذّر الاتصال بنماذج الذكاء الاصطناعي. حاول مرة أخرى.", 502);
}
