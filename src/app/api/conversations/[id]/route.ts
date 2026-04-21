// GET    /api/conversations/[id]  — load with messages
// PATCH  /api/conversations/[id]  — rename / change model
// DELETE /api/conversations/[id]
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

  const conv = await prisma.chatConversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, attachments: true, createdAt: true },
      },
    },
  });
  if (!conv) return jsonError("Not found", 404);
  return jsonOk({ conversation: conv });
}

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid");

  const existing = await prisma.chatConversation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Not found", 404);

  const updated = await prisma.chatConversation.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  return jsonOk({ conversation: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.chatConversation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Not found", 404);

  await prisma.chatConversation.delete({ where: { id: existing.id } });
  return jsonOk({ ok: true });
}
