// GET /api/admin/users — paginated list with search + filters
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(req.url);
  const query  = url.searchParams.get("q") ?? "";
  const plan   = url.searchParams.get("plan") ?? "";
  const role   = url.searchParams.get("role") ?? "";
  const banned = url.searchParams.get("banned");
  const limit  = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { name:  { contains: query, mode: "insensitive" } },
    ];
  }
  if (plan)   where.plan = plan;
  if (role)   where.role = role;
  if (banned === "true")  where.isBanned = true;
  if (banned === "false") where.isBanned = false;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      plan: true,
      role: true,
      isBanned: true,
      bannedReason: true,
      creditsBalance: true,
      creditsLimit: true,
      createdAt: true,
      _count: {
        select: { generations: true, chatConversations: true, spaces: true },
      },
    },
  });

  const hasMore = users.length > limit;
  const trimmed = hasMore ? users.slice(0, limit) : users;

  return jsonOk({
    users: trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1]!.id : null,
  });
}
