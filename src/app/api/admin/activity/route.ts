// GET /api/admin/activity — unified platform activity feed
// Combines recent generations + credit transactions + signups + bans
// into a single chronological stream for admin monitoring.

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const type  = url.searchParams.get("type") ?? "all";

  const [generations, transactions, signups] = await Promise.all([
    type === "all" || type === "generations"
      ? prisma.generation.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true, toolId: true, toolName: true, category: true, status: true,
            creditsUsed: true, createdAt: true, errorMessage: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        })
      : Promise.resolve([]),
    type === "all" || type === "credits"
      ? prisma.creditTransaction.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true, type: true, amount: true, balanceAfter: true, reason: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        })
      : Promise.resolve([]),
    type === "all" || type === "signups"
      ? prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true, name: true, email: true, image: true, plan: true, createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  type Event = { id: string; kind: "generation" | "credit" | "signup"; at: string; data: unknown };
  const events: Event[] = [
    ...generations.map((g) => ({ id: `gen_${g.id}`, kind: "generation" as const, at: g.createdAt.toISOString(), data: g })),
    ...transactions.map((t) => ({ id: `tx_${t.id}`,  kind: "credit"     as const, at: t.createdAt.toISOString(), data: t })),
    ...signups.map((u) => ({ id: `usr_${u.id}`,      kind: "signup"     as const, at: u.createdAt.toISOString(), data: u })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);

  return jsonOk({ events });
}
