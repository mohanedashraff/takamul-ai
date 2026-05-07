// /api/tools/soul/moodboards/[id] — DELETE a user moodboard
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const existing = await prisma.soulMoodboard.findFirst({
    where:  { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Moodboard not found", 404);

  await prisma.soulMoodboard.delete({ where: { id: existing.id } });
  return jsonOk({ ok: true });
}
