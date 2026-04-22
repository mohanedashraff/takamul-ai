// GET /api/admin/billing — subscriptions overview + revenue snapshot
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const [
    agentSubscriptions,
    planCounts,
    mrrRaw,
    recentSubscriptions,
    topAgents,
  ] = await Promise.all([
    prisma.agentSubscription.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
    prisma.agentSubscription.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyPriceUsd: true },
    }),
    prisma.agentSubscription.findMany({
      orderBy: { startedAt: "desc" },
      take: 15,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.agentSubscription.groupBy({
      by: ["agentId", "agentName"],
      where: { status: "ACTIVE" },
      _count: { agentId: true },
      orderBy: { _count: { agentId: "desc" } },
      take: 5,
    }),
  ]);

  // Rough MRR estimation: agent subscriptions MRR + plan-based MRR
  // (plan prices are hardcoded here for now until Stripe is wired)
  const planPrices: Record<string, number> = {
    FREE: 0, BASIC: 15, PRO: 49, ENTERPRISE: 199,
  };
  const planMrr = planCounts.reduce(
    (sum: number, p: { plan: string; _count: { plan: number } }) =>
      sum + (planPrices[p.plan] ?? 0) * p._count.plan,
    0
  );
  const agentsMrr = Number(mrrRaw._sum.monthlyPriceUsd ?? 0);

  return jsonOk({
    mrr: {
      total: planMrr + agentsMrr,
      fromPlans: planMrr,
      fromAgents: agentsMrr,
    },
    subscriptionsByStatus: agentSubscriptions.map(
      (s: { status: string; _count: { status: number } }) => ({
        status: s.status,
        count: s._count.status,
      })
    ),
    planDistribution: planCounts.map(
      (p: { plan: string; _count: { plan: number } }) => ({
        plan: p.plan,
        count: p._count.plan,
        monthlyRevenue: (planPrices[p.plan] ?? 0) * p._count.plan,
      })
    ),
    recentSubscriptions,
    topAgents: topAgents.map(
      (a: { agentId: string; agentName: string; _count: { agentId: number } }) => ({
        agentId: a.agentId,
        agentName: a.agentName,
        count: a._count.agentId,
      })
    ),
  });
}
