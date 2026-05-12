// ════════════════════════════════════════════════════════════════
// /api/folders — list + create folders for asset organisation
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthOrApiKey } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:     z.string().min(1).max(80),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  parentId: z.string().optional(),
});

export async function GET(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  try {
    const folders = await prisma.folder.findMany({
      where:   { userId: userId! },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { generations: true, children: true } } },
    });
    return jsonOk({
      folders: folders.map((f) => ({
        id:       f.id,
        name:     f.name,
        color:    f.color,
        parentId: f.parentId,
        count:    f._count.generations,
        children: f._count.children,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.warn("[folders] query failed (schema not migrated yet)", err);
    return jsonOk({ folders: [] });
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
    const folder = await prisma.folder.create({
      data: {
        userId:   userId!,
        name:     parsed.data.name,
        color:    parsed.data.color,
        parentId: parsed.data.parentId,
      },
    });
    return jsonOk({ folder });
  } catch (err) {
    console.warn("[folders] create failed (schema not migrated yet)", err);
    return jsonError("Schema not migrated. Run `npx prisma migrate dev` first.", 503);
  }
}
