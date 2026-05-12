// ════════════════════════════════════════════════════════════════
// GET /api/soul-id/[id]/status — poll fal.ai training status
// ════════════════════════════════════════════════════════════════
// Lightweight status checker for an in-flight Soul ID training job.
// The frontend polls this every ~5s while the user watches the
// training spinner. When status flips to COMPLETED we fetch the
// trained LoRA URL and persist it; when ERROR we persist the message.
//
// Response: { status, queuePosition?, logs?, character }

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { falTrainingStatus, falTrainingResult } from "@/lib/fal";

export const runtime    = "nodejs";
export const maxDuration = 30;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  if (!process.env.FAL_KEY) return jsonError("FAL_KEY missing on server", 503);

  const { id } = await ctx.params;
  const character = await prisma.soulCharacter.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) return jsonError("Character not found", 404);

  // Legacy / pre-fal.ai rows: nothing to poll, just report current
  // local state.
  if (!character.trainingId) {
    return jsonOk({
      status:    character.trained ? "COMPLETED" : "IN_PROGRESS",
      character,
      legacy:    true,
    });
  }

  // Already terminal — short-circuit so we don't hammer fal.ai for
  // already-resolved jobs.
  if (character.trainingStatus === "COMPLETED" && character.loraUrl) {
    return jsonOk({ status: "COMPLETED", character });
  }
  if (character.trainingStatus === "ERROR") {
    return jsonOk({ status: "ERROR", error: character.trainingError, character });
  }

  // Live poll fal.ai for the latest status.
  let falStatusResp;
  try {
    falStatusResp = await falTrainingStatus(character.trainingId);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "fal.ai status fetch failed", 502);
  }

  // Forward IN_QUEUE / IN_PROGRESS without further work.
  if (falStatusResp.status === "IN_QUEUE" || falStatusResp.status === "IN_PROGRESS") {
    // Persist the live status so subsequent polls don't re-fetch fal.
    if (character.trainingStatus !== falStatusResp.status) {
      await prisma.soulCharacter.update({
        where: { id: character.id },
        data:  { trainingStatus: falStatusResp.status },
      }).catch(() => {});
    }
    return jsonOk({
      status:        falStatusResp.status,
      queuePosition: falStatusResp.queue_position,
      logs:          falStatusResp.logs?.slice(-10),
      character:     { ...character, trainingStatus: falStatusResp.status },
    });
  }

  // ── COMPLETED ─────────────────────────────────────────────────
  if (falStatusResp.status === "COMPLETED") {
    let result;
    try {
      result = await falTrainingResult(character.trainingId);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "fal.ai result fetch failed", 502);
    }
    const loraUrl = result.diffusers_lora_file?.url;
    if (!loraUrl) {
      // Treat as ERROR — completed but no artifact.
      const updated = await prisma.soulCharacter.update({
        where: { id: character.id },
        data:  {
          trainingStatus: "ERROR",
          trainingError:  "fal.ai returned COMPLETED but no LoRA artifact",
          trained:        false,
        },
      });
      return jsonOk({ status: "ERROR", error: "Missing LoRA artifact", character: updated });
    }
    const updated = await prisma.soulCharacter.update({
      where: { id: character.id },
      data:  {
        trainingStatus: "COMPLETED",
        loraUrl,
        trained:        true,
        triggerWord:    result.trigger_word ?? character.triggerWord,
      },
    });
    return jsonOk({ status: "COMPLETED", character: updated });
  }

  // ── ERROR ─────────────────────────────────────────────────────
  const errorMsg = typeof falStatusResp.error === "string"
    ? falStatusResp.error
    : falStatusResp.error?.message ?? "Training failed";
  const updated = await prisma.soulCharacter.update({
    where: { id: character.id },
    data:  {
      trainingStatus: "ERROR",
      trainingError:  errorMsg.slice(0, 500),
      trained:        false,
    },
  });
  return jsonOk({ status: "ERROR", error: errorMsg, character: updated });
}
