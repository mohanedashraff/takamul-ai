// ════════════════════════════════════════════════════════════════
// POST /api/tools/soul/generate
// ════════════════════════════════════════════════════════════════
// The Soul 2.0 generator. Composes a final prompt from:
//   • user prompt
//   • selected curated Mood Board OR a saved user moodboard (its
//     reference URLs get passed to the model + descriptor)
//   • selected curated Color Palette OR an uploaded palette (HEX
//     values get pasted into the prompt)
//   • optional Soul ID (character reference URLs from a saved
//     SoulCharacter)
// ...and submits to MuAPI's `nano-banana-pro` (or `-edit` when refs
// are present). Submit + poll happens server-side, single response
// back to the client.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { submitAndPollServer, pickResultUrl } from "@/lib/muapi-server";
import { buildSoulPrompt } from "@/lib/data/soul";

export const runtime    = "nodejs";
export const maxDuration = 240;

const Schema = z.object({
  prompt:           z.string().min(1).max(3_000),
  // Curated moodboard id, OR a SoulMoodboard row id (we tell them
  // apart by checking the DB first).
  moodboardId:      z.string().optional(),
  paletteId:        z.string().optional(),
  // SoulCharacter row id — when present we pull its imageUrls + hint.
  characterId:      z.string().optional(),
  // Aspect / quality / count / enhancement flag.
  aspect_ratio:     z.enum(["1:1", "3:4", "4:3", "9:16", "16:9", "4:5", "2:3", "21:9"]).default("3:4"),
  quality:          z.enum(["1.5k", "2k", "4k"]).default("2k"),
  num_outputs:      z.number().int().min(1).max(4).default(1),
  enhance_prompt:   z.boolean().default(true),
  // When the user uploaded a one-off color reference (Soul HEX
  // "Upload & Create" path), we pass the extracted HEX strings here.
  custom_palette_hexes: z.array(z.string()).max(20).optional(),
  // When the user attached a one-off Soul Reference image (the inline
  // [+] button on the prompt bar), we pass it as `images_list[0]`.
  reference_url:    z.string().url().optional(),
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

  const {
    prompt, moodboardId, paletteId, characterId,
    aspect_ratio, quality, num_outputs, enhance_prompt,
    custom_palette_hexes, reference_url,
  } = parsed.data;

  // ── Resolve user-built moodboard (when the id matches a DB row) ──
  let customMoodboardDescriptor: string | undefined;
  let userMoodboardImages: string[] = [];
  if (moodboardId) {
    const userMb = await prisma.soulMoodboard.findFirst({
      where: { id: moodboardId, userId: session.user.id },
      select: { descriptor: true, imageUrls: true },
    });
    if (userMb) {
      customMoodboardDescriptor = userMb.descriptor || undefined;
      userMoodboardImages = userMb.imageUrls.slice(0, 4); // top 4 references
    }
  }

  // ── Resolve Soul ID (character) ──
  let characterHint: string | undefined;
  let characterImages: string[] = [];
  if (characterId) {
    const ch = await prisma.soulCharacter.findFirst({
      where: { id: characterId, userId: session.user.id },
      select: { hintText: true, imageUrls: true, name: true },
    });
    if (ch) {
      characterHint = ch.hintText ?? `consistent appearance of "${ch.name}" matching the reference photos`;
      characterImages = ch.imageUrls.slice(0, 5); // 5 angles is plenty
    }
  }

  // ── Compose final prompt ──
  const finalPrompt = buildSoulPrompt({
    basePrompt:                prompt,
    moodboardId,
    paletteId,
    characterHint,
    customMoodboardDescriptor,
    customPaletteHexes:        custom_palette_hexes,
  });

  // ── Build images_list — character + moodboard + one-off reference ──
  const imagesList = [
    reference_url,
    ...characterImages,
    ...userMoodboardImages,
  ].filter((u): u is string => !!u);

  const negative_prompt =
    "blurry, low quality, low resolution, plastic skin, distorted face, bad anatomy, watermark, text, logo, signature, jpeg artifacts, oversaturated";

  const payload: Record<string, unknown> = {
    prompt:         finalPrompt,
    aspect_ratio,
    resolution:     quality,
    num_images:     num_outputs,
    negative_prompt,
  };
  if (imagesList.length > 0) payload.images_list = imagesList;

  // Edit endpoint when we have references, vanilla otherwise.
  const endpoint = imagesList.length > 0 ? "nano-banana-pro-edit" : "nano-banana-pro";

  if (!enhance_prompt) {
    // The "Off" toggle on the shoot bar means: skip the universal
    // Soul finishing cues at the end of the prompt. We still keep
    // the moodboard + palette descriptors — just lighter touch.
    payload.prompt = [
      prompt.trim(),
      characterHint?.trim(),
      customMoodboardDescriptor || undefined,
    ].filter(Boolean).join(", ");
  }

  try {
    const result = await submitAndPollServer({
      endpoint,
      apiKey:    muKey,
      payload,
      timeoutMs: 4 * 60 * 1000,
    });
    const url  = pickResultUrl(result);
    const urls = Array.isArray(result.urls)    ? result.urls
              : Array.isArray(result.outputs)  ? (result.outputs as string[])
              : undefined;
    if (!url) return jsonError("لم يتم استلام الناتج من Soul 2.0", 502);
    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: result.requestId,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Soul generation failed", 500);
  }
}
