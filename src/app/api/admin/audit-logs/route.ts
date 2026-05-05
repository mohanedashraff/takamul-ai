// ════════════════════════════════════════════════════════════════
// GET /api/admin/audit-logs — paginated audit-log feed (admins only)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url    = new URL(req.url);
  const limit  = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;
  const actorId = url.searchParams.get("actorId") ?? undefined;
  const targetId = url.searchParams.get("targetId") ?? undefined;

  const where = {
    ...(action   ? { action } : {}),
    ...(actorId  ? { actorId } : {}),
    ...(targetId ? { targetId } : {}),
  };

  const items = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take:    limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;

  return jsonOk({
    items:      trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1]!.id : null,
  });
}
