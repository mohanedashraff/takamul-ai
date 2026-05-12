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
import { deductCredits, addCredits, InsufficientCreditsError } from "@/lib/credits";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";

export const runtime    = "nodejs";
export const maxDuration = 240;

// Soul tool entry — used to look up canonical credit cost.
const SOUL_TOOL = ALL_TOOLS_FLAT.find((t) => t.id === "soul");

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
  // Two-tier quality (1.5K / 2K) matches the picker. We still accept
  // legacy "4k" silently so old localStorage shoots don't 422 — it
  // just gets clamped to "2k" before the muapi payload is built.
  quality:          z.enum(["1.5k", "2k", "4k"]).default("2k").transform((q) => q === "4k" ? "2k" : q),
  num_outputs:      z.number().int().min(1).max(4).default(1),
  enhance_prompt:   z.boolean().default(true),
  // the reference-parity advanced controls.
  negative_prompt:  z.string().max(2_000).optional(),
  seed:             z.number().int().min(0).max(2_147_483_647).nullable().optional(),
  /** 0..100 — how aggressively to inject Soul style descriptors. */
  style_strength:   z.number().int().min(0).max(100).default(100),
  /** 0..100 — how strongly the picked Soul ID character locks identity.
   *  At 100 we send all 5 character thumbs; at 0 we drop them entirely. */
  custom_reference_strength: z.number().int().min(0).max(100).default(100),
  /** When true, append a "refiner pass" descriptor so the model adds a
   *  finishing detail pass on the result (skin texture, fabric, etc). */
  use_refiner:      z.boolean().default(false),
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
    negative_prompt: userNegativePrompt, seed, style_strength,
    custom_reference_strength, use_refiner,
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
  // Three identity-preservation modes ranked by quality:
  //   (1) Real fal.ai LoRA — character.loraUrl is set when the user
  //       trained the character via /api/soul-id/train. We route the
  //       generation through fal-ai/flux-lora with the trained LoRA
  //       loaded (BEST identity preservation).
  //   (2) References pass-through — fall back when no LoRA available;
  //       we send the character's photos as `images_list` to the
  //       image-edit endpoint and inject a "consistent appearance" hint.
  //   (3) Prompt-only — when custom_reference_strength is very low,
  //       we drop the reference photos and use just the hint.
  //
  // Custom reference strength applies to all 3 modes:
  //   • 100 → full identity lock (LoRA scale 1.0 OR 5 reference thumbs)
  //   • 80-99 → strong (LoRA scale 0.85 OR 5 thumbs)
  //   • 60-79 → moderate (LoRA scale 0.65 OR 3 thumbs)
  //   • 30-59 → loose (LoRA scale 0.40 OR 1 thumb + softened hint)
  //   • 0-29  → free interpretation (no LoRA / no thumbs)
  let characterHint: string | undefined;
  let characterImages: string[] = [];
  let characterLoraUrl: string | null = null;
  let characterTriggerWord: string | null = null;
  let characterName: string | null = null;
  if (characterId) {
    const ch = await prisma.soulCharacter.findFirst({
      where: { id: characterId, userId: session.user.id },
      select: { hintText: true, imageUrls: true, name: true, loraUrl: true, triggerWord: true, trainingStatus: true },
    });
    if (ch) {
      characterName = ch.name;
      const strict = custom_reference_strength >= 30;
      characterHint = strict
        ? (ch.hintText ?? `consistent appearance of "${ch.name}" matching the reference photos`)
        : `inspired by the look of "${ch.name}" — free interpretation, not a literal match`;
      // Prefer the trained LoRA when available + strength >= 30
      if (ch.loraUrl && ch.trainingStatus === "COMPLETED" && strict) {
        characterLoraUrl     = ch.loraUrl;
        characterTriggerWord = ch.triggerWord ?? "TOK";
      } else {
        // Fall back to references pass-through
        const thumbCount =
          custom_reference_strength >= 80 ? 5 :
          custom_reference_strength >= 60 ? 3 :
          custom_reference_strength >= 30 ? 1 :
          0;
        characterImages = ch.imageUrls.slice(0, thumbCount);
      }
    }
  }

  // ── Compose final prompt ──
  // The Refiner pass appends a fine-detail tail that nudges the model
  // to output cleaner skin texture, fabric weave, and edge detail.
  // It's the prompt-level equivalent of the reference platform's
  // `use_refiner: true` flag — we don't have a separate refiner model
  // online, but the descriptor reliably improves perceived sharpness.
  const REFINER_TAIL =
    "post-process refiner pass: ultra-fine pore-level skin texture, " +
    "crisp fabric weave detail, micro-contrast on edges, " +
    "magazine-print retouch quality, no smoothing";
  const baseComposed = buildSoulPrompt({
    basePrompt:                prompt,
    moodboardId,
    paletteId,
    characterHint,
    customMoodboardDescriptor,
    customPaletteHexes:        custom_palette_hexes,
  });
  const finalPrompt = use_refiner
    ? `${baseComposed}, ${REFINER_TAIL}`
    : baseComposed;

  // ── Build images_list — character + moodboard + one-off reference ──
  const imagesList = [
    reference_url,
    ...characterImages,
    ...userMoodboardImages,
  ].filter((u): u is string => !!u);

  // Default Soul negative prompt — user can override or extend via the
  // advanced settings (we concatenate so user additions stack on top).
  const DEFAULT_NEGATIVE =
    "blurry, low quality, low resolution, plastic skin, distorted face, bad anatomy, watermark, text, logo, signature, jpeg artifacts, oversaturated";
  const negative_prompt = userNegativePrompt?.trim()
    ? `${DEFAULT_NEGATIVE}, ${userNegativePrompt.trim()}`
    : DEFAULT_NEGATIVE;

  const payload: Record<string, unknown> = {
    prompt:         finalPrompt,
    aspect_ratio,
    resolution:     quality,
    num_images:     num_outputs,
    negative_prompt,
  };
  if (imagesList.length > 0) payload.images_list = imagesList;
  if (typeof seed === "number") payload.seed = seed;

  // Edit endpoint when we have references, vanilla otherwise.
  const endpoint = imagesList.length > 0 ? "nano-banana-pro-edit" : "nano-banana-pro";

  // Style strength rewires the prompt composition:
  //   100% → full Soul descriptor + finishing cues (default)
  //    50% → moodboard + palette descriptors only, no finishing cues
  //   ≤25% → user prompt + character hint only (raw-ish)
  // This replaces the older binary `enhance_prompt` toggle. We keep
  // the toggle alive for back-compat: enhance_prompt=false ≈ strength 0.
  const effectiveStrength = enhance_prompt ? style_strength : 0;
  if (effectiveStrength <= 25) {
    payload.prompt = [
      prompt.trim(),
      characterHint?.trim(),
    ].filter(Boolean).join(", ");
  } else if (effectiveStrength <= 75) {
    // Mid-strength: include style descriptors but drop the heavy
    // "8K finishing, magazine-quality" cues at the end.
    const noFinish = finalPrompt.replace(
      /,\s*ultra-realistic editorial photograph.*$/i,
      "",
    );
    payload.prompt = noFinish;
  }
  // else: leave finalPrompt as-is (full strength)

  // ── Credit accounting (was previously bypassed — fixed in audit) ──
  // Soul costs `num_outputs × tool.credits` so users pay per image.
  const baseCost = SOUL_TOOL?.credits ?? 8;
  const credits  = baseCost * num_outputs;

  let balanceAfter: number;
  let transactionId: string;
  try {
    const r = await deductCredits({
      userId:   session.user.id,
      amount:   credits,
      reason:   "tool:soul",
      metadata: { toolId: "soul", num_outputs, aspect_ratio, quality },
    });
    balanceAfter  = r.balanceAfter;
    transactionId = r.transactionId;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    throw err;
  }

  // Create the generation row so it shows in user history.
  const generation = await prisma.generation.create({
    data: {
      userId:      session.user.id,
      toolId:      "soul",
      toolName:    SOUL_TOOL?.title ?? "Soul",
      category:    SOUL_TOOL?.categoryKey ?? "image",
      status:      "PENDING",
      creditsUsed: credits,
      inputs:      { prompt, moodboardId, paletteId, characterId, aspect_ratio, quality, num_outputs } as never,
    },
    select: { id: true },
  });

  // Best-effort link of the credit ledger entry → this generation.
  prisma.creditTransaction.update({
    where: { id: transactionId },
    data: { metadata: { toolId: "soul", generationId: generation.id } as never },
  }).catch(() => {});

  try {
    let url: string | null = null;
    let urls: string[] | undefined;
    let providerRequestId: string | undefined;

    // ── BRANCH A: Real fal.ai LoRA inference (when character has a
    //    trained LoRA + strength is high enough). Best identity
    //    preservation — uses the LoRA we trained for this character.
    if (characterLoraUrl && process.env.FAL_KEY) {
      // LoRA scale rises with custom_reference_strength
      const loraScale =
        custom_reference_strength >= 80 ? 1.0 :
        custom_reference_strength >= 60 ? 0.85 :
        custom_reference_strength >= 30 ? 0.6  :
        0.3;
      // Inject the trigger word at the head of the prompt — flux-lora
      // associates the LoRA's identity with the trigger token.
      const triggeredPrompt = characterTriggerWord
        ? `${characterTriggerWord} ${typeof payload.prompt === "string" ? payload.prompt : ""}`.trim()
        : (typeof payload.prompt === "string" ? payload.prompt : "");
      // Map our aspect ratio enum → fal's image_size enum.
      const falImageSize = aspectToFalImageSize(aspect_ratio);
      const { falSubmitAndWait } = await import("@/lib/fal");
      type FalImg = { images: { url: string }[]; seed?: number };
      const falResult = await falSubmitAndWait<FalImg>(
        "fal-ai/flux-lora",
        {
          prompt:           triggeredPrompt,
          loras:            [{ path: characterLoraUrl, scale: loraScale }],
          image_size:       falImageSize,
          num_images:       num_outputs,
          guidance_scale:   3.5,
          num_inference_steps: 28,
          ...(typeof seed === "number" ? { seed } : {}),
          ...(negative_prompt ? { negative_prompt } : {}),
        },
        { intervalMs: 1500, maxWaitMs: 4 * 60 * 1000 },
      );
      const falUrls = (falResult.images ?? []).map((i) => i.url).filter(Boolean);
      url  = falUrls[0] ?? null;
      urls = falUrls.length > 0 ? falUrls : undefined;
      providerRequestId = falResult.request_id;
    } else {
      // ── BRANCH B: existing nano-banana / nano-banana-edit flow
      const result = await submitAndPollServer({
        endpoint,
        apiKey:    muKey,
        payload,
        timeoutMs: 4 * 60 * 1000,
      });
      url  = pickResultUrl(result);
      urls = Array.isArray(result.urls)   ? result.urls
           : Array.isArray(result.outputs) ? (result.outputs as string[])
           : undefined;
      providerRequestId = result.requestId;
    }

    if (!url) {
      // Refund — the API call returned nothing usable.
      await refundOnFailure(session.user.id, credits, generation.id, "no result url");
      return jsonError("لم يتم استلام الناتج من Soul 2.0", 502);
    }

    // Mark COMPLETED with outputs.
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status:    "COMPLETED",
        outputs:   { url, urls } as never,
        muapiJobId: providerRequestId,
      },
    }).catch(() => {});

    return jsonOk({
      url,
      urls,
      mimeType:  "image/png",
      requestId: providerRequestId,
      creditsBalance: balanceAfter,
      generationId:   generation.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Soul generation failed";
    await refundOnFailure(session.user.id, credits, generation.id, message);
    return jsonError(message, 500);
  }
}

/** Refund credits + mark Generation FAILED. Best-effort, never throws. */
async function refundOnFailure(
  userId: string,
  amount: number,
  generationId: string,
  errorMessage: string,
): Promise<void> {
  await Promise.allSettled([
    addCredits({
      userId,
      amount,
      reason: "refund:soul-failed",
      metadata: { generationId, errorMessage: errorMessage.slice(0, 200) },
      type: "REFUND",
    }),
    prisma.generation.update({
      where: { id: generationId },
      data:  { status: "FAILED", errorMessage: errorMessage.slice(0, 500) },
    }),
  ]);
}
