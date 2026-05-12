// ════════════════════════════════════════════════════════════════
// POST /api/soul-id/train — start a real Flux LoRA training job
// ════════════════════════════════════════════════════════════════
// Replaces the placeholder "trained: true after 3 minutes" flow with
// a real fal.ai Flux LoRA training run. Pipeline:
//
//   1. Look up the SoulCharacter row owned by the caller.
//   2. Submit a Flux LoRA fast-training job to fal.ai with the
//      character's reference photos.
//   3. Persist the returned request_id + initial status. Polling
//      happens via /api/soul-id/[id]/status (separate route).
//
// Body : { characterId: string, triggerWord?: string, steps?: number }
// Reply: { trainingId, status, character }

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { falStartFluxLoraTraining } from "@/lib/fal";

export const runtime    = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  characterId: z.string().min(1),
  triggerWord: z.string().min(1).max(40).optional(),
  steps:       z.number().int().min(500).max(2_000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  if (!process.env.FAL_KEY) return jsonError("FAL_KEY missing on server", 503);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { characterId, triggerWord, steps } = parsed.data;

  const character = await prisma.soulCharacter.findFirst({
    where: { id: characterId, userId: session.user.id },
  });
  if (!character) return jsonError("Character not found", 404);

  // Sanity-check images: fal-ai/flux-lora-fast-training requires 4-20.
  if (!character.imageUrls || character.imageUrls.length < 4) {
    return jsonError("نحتاج 4 صور على الأقل لتدريب الشخصية", 400);
  }

  // If there's already a training in progress, return its state instead
  // of double-firing.
  if (character.trainingId && character.trainingStatus !== "ERROR" && character.trainingStatus !== "COMPLETED") {
    return jsonOk({
      trainingId: character.trainingId,
      status:     character.trainingStatus,
      character,
      reused:     true,
    });
  }

  // Trigger token defaults to a CharID-like slug derived from the
  // character's name (cleaned to ASCII a-z + digits). fal.ai's LoRA
  // requires the trigger word to be unique-ish so the model learns to
  // associate it with this identity.
  const safeName = character.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
  const finalTrigger = triggerWord ?? (safeName || "TOK");

  // Submit to fal.ai. Network failures here are surfaced verbatim.
  let submitted;
  try {
    submitted = await falStartFluxLoraTraining({
      imageUrls:   character.imageUrls.slice(0, 20),
      triggerWord: finalTrigger,
      steps:       steps ?? 1000,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "fal.ai submission failed", 502);
  }

  // Persist state so the user can navigate away during the ~5min
  // training window and we can still poll for completion.
  const updated = await prisma.soulCharacter.update({
    where: { id: character.id },
    data: {
      trainingId:    submitted.request_id,
      trainingStatus:"IN_QUEUE",
      triggerWord:   finalTrigger,
      // Reset legacy/error fields when re-running training
      trained:       false,
      loraUrl:       null,
      trainingError: null,
    },
  });

  return jsonOk({
    trainingId: submitted.request_id,
    status:     "IN_QUEUE",
    character:  updated,
  });
}
