// ════════════════════════════════════════════════════════════════
// /api/marketing/ad-references — list + create inspiration videos
// ════════════════════════════════════════════════════════════════
// Backs Marketing Studio's "Ad References" panel. Each row is a
// reusable inspiration video (or image) the user can drop onto a
// new ad job to anchor the vibe / pacing / palette.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthOrApiKey } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:         z.string().min(1).max(120),
  mediaUrl:     z.string().url(),
  mediaType:    z.enum(["video", "image"]).default("video"),
  thumbnail:    z.string().url().optional(),
  source:       z.enum(["upload", "previous-job", "library"]).default("upload"),
  generationId: z.string().optional(),
  notes:        z.string().max(2_000).optional(),
});

export async function GET(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  try {
    const refs = await prisma.adReference.findMany({
      where:   { userId: userId! },
      orderBy: { createdAt: "desc" },
      take:    200,
    });
    return jsonOk({ references: refs });
  } catch (err) {
    console.warn("[ad-references] query failed", err);
    return jsonOk({ references: [] });
  }
}

export async function POST(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const ref = await prisma.adReference.create({
      data: {
        userId:       userId!,
        name:         parsed.data.name,
        mediaUrl:     parsed.data.mediaUrl,
        mediaType:    parsed.data.mediaType,
        thumbnail:    parsed.data.thumbnail,
        source:       parsed.data.source,
        generationId: parsed.data.generationId,
        notes:        parsed.data.notes,
      },
    });
    return jsonOk({ reference: ref });
  } catch (err) {
    console.warn("[ad-references] create failed", err);
    return jsonError("Schema not migrated. Run `npx prisma migrate dev` first.", 503);
  }
}
