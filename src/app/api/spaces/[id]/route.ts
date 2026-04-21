// GET    /api/spaces/[id]  — load full space (with nodes/edges)
// PUT    /api/spaces/[id]  — save/update canvas (auto-save from client)
// DELETE /api/spaces/[id]
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const space = await prisma.space.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!space) return jsonError("Not found", 404);

  // Touch lastOpenedAt
  await prisma.space.update({
    where: { id: space.id },
    data:  { lastOpenedAt: new Date() },
  }).catch(() => {});

  return jsonOk({ space });
}

const PutSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  nodes:       z.array(z.unknown()).optional(),
  edges:       z.array(z.unknown()).optional(),
  viewport:    z.unknown().optional(),
  thumbnail:   z.string().max(500_000).nullable().optional(),
  isPublic:    z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const existing = await prisma.space.findFirst({
    where:  { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Not found", 404);

  const d = parsed.data;
  const updated = await prisma.space.update({
    where: { id: existing.id },
    data: {
      ...(d.title       !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.nodes       !== undefined && { nodes: d.nodes as never }),
      ...(d.edges       !== undefined && { edges: d.edges as never }),
      ...(d.viewport    !== undefined && { viewport: d.viewport as never }),
      ...(d.thumbnail   !== undefined && { thumbnail: d.thumbnail }),
      ...(d.isPublic    !== undefined && { isPublic: d.isPublic }),
    },
  });

  return jsonOk({ space: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.space.findFirst({
    where:  { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Not found", 404);

  await prisma.space.delete({ where: { id: existing.id } });
  return jsonOk({ ok: true });
}
