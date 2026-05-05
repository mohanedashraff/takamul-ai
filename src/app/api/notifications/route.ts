// ════════════════════════════════════════════════════════════════
// GET   /api/notifications        — list latest notifications
// POST  /api/notifications/read   — mark all (or selected) as read
// PATCH /api/notifications        — same as POST/read for legacy clients
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const url   = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
  const onlyUnread = url.searchParams.get("unread") === "1";

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(onlyUnread ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take:    limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return jsonOk({ notifications: items, unreadCount });
}

const ReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown = {};
  try { body = await req.json(); } catch { /* empty is fine — defaults to mark-all */ }
  const parsed = ReadSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid");

  const where = parsed.data.ids?.length
    ? { userId: session.user.id, id: { in: parsed.data.ids } }
    : { userId: session.user.id };

  const result = await prisma.notification.updateMany({
    where:  { ...where, readAt: null },
    data:   { readAt: new Date() },
  });

  return jsonOk({ updated: result.count });
}
