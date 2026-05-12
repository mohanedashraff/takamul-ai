// ════════════════════════════════════════════════════════════════
// /api/tools/soul/characters — list + create Soul ID characters
// ════════════════════════════════════════════════════════════════
//
//   GET  → list all the user's Soul IDs (filterable by ?variant=)
//   POST → create one. Body: { name, imageUrls[], variant? }
//          Hard minimum is 20 photos (matches the reference platform's training
//          requirement). We don't actually fine-tune a model — we
//          flag it as "trained" after a short delay and pass the
//          best subset of references at generation time.

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:      z.string().min(1).max(100),
  variant:   z.enum(["soul", "soul-cinema"]).default("soul"),
  imageUrls: z.array(z.string().url()).min(20, "نحتاج ٢٠ صورة على الأقل لتدريب الشخصية").max(40),
  hintText:  z.string().max(280).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const url = new URL(req.url);
  const variant = url.searchParams.get("variant"); // "soul-2.0" / "soul-cinema" / "soul" / null=all

  const characters = await prisma.soulCharacter.findMany({
    where: {
      userId: session.user.id,
      ...(variant ? { variant } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, variant: true, hintText: true,
      imageUrls: true, thumbnail: true, trained: true,
      createdAt: true, updatedAt: true,
    },
  });

  return jsonOk({ characters });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { name, variant, imageUrls, hintText } = parsed.data;

  const character = await prisma.soulCharacter.create({
    data: {
      userId:    session.user.id,
      name,
      variant,
      imageUrls,
      thumbnail: imageUrls[0],
      hintText:  hintText ?? `consistent appearance of "${name}", matching every reference photo (face, hair, build, vibe)`,
      trained:   false,
    },
  });

  // ── Real fal.ai Flux LoRA training (replaces the prior fake
  // setTimeout flip). When FAL_KEY is configured AND the user
  // uploaded enough images, dispatch a queued training job. The
  // returned trainingId + status get persisted; the frontend polls
  // /api/soul-id/[id]/status to track progress.
  //
  // When FAL_KEY is NOT set we leave the legacy "trained: false"
  // state — the references still work via the standard images_list
  // pass-through, just without the LoRA boost.
  let trainingDispatched = false;
  if (process.env.FAL_KEY && character.imageUrls.length >= 4) {
    try {
      // Dynamic import so the fal helper isn't pulled in for envs
      // that don't have the key configured.
      const { falStartFluxLoraTraining } = await import("@/lib/fal");
      const safeName = character.name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 12);
      const triggerWord = safeName || "TOK";
      const submitted = await falStartFluxLoraTraining({
        imageUrls:   character.imageUrls.slice(0, 20),
        triggerWord,
        steps:       1000,
      });
      await prisma.soulCharacter.update({
        where: { id: character.id },
        data: {
          trainingId:    submitted.request_id,
          trainingStatus:"IN_QUEUE",
          triggerWord,
        },
      });
      trainingDispatched = true;
    } catch (err) {
      // Training dispatch failure is non-fatal — the character row
      // still works as a references-only Soul ID. Surface the error
      // so the UI can show a "training unavailable" hint.
      console.error("[soul-id] fal.ai training dispatch failed:", err);
      await prisma.soulCharacter.update({
        where: { id: character.id },
        data: {
          trainingStatus: "ERROR",
          trainingError:  err instanceof Error ? err.message.slice(0, 500) : "Training dispatch failed",
        },
      }).catch(() => {});
    }
  }

  // Re-fetch so the response reflects the dispatched-training state.
  const final = await prisma.soulCharacter.findUnique({ where: { id: character.id } });
  return jsonOk({ character: final ?? character, trainingDispatched });
}
