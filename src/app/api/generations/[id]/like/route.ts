// ════════════════════════════════════════════════════════════════
// POST   /api/generations/[id]/like   — mark as liked / favorite
// DELETE /api/generations/[id]/like   — unmark
// ════════════════════════════════════════════════════════════════
// Idempotent. Updates a `liked` boolean on the generation row + bumps
// the cached `likeCount` (used by the Explore feed for sort).

import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuthOrApiKey } from "@/lib/api";

export const runtime = "nodejs";

async function setLiked(req: Request, id: string, liked: boolean) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  // Best-effort — if the generation isn't ours, ignore silently.
  const gen = await prisma.generation
    .updateMany({
      where: { id, userId: userId! },
      data:  liked
        ? { liked: true,  likeCount: { increment: 1 } }
        : { liked: false, likeCount: { decrement: 1 } },
    })
    .catch(() => null);

  return jsonOk({ liked, updated: gen?.count ?? 0 });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return setLiked(req, id, true);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return setLiked(req, id, false);
}
