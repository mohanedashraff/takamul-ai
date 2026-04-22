// GET /api/admin/stats — platform-wide metrics
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeUsersLast7d,
    bannedUsers,
    totalGenerations,
    monthlyGenerations,
    totalSpaces,
    totalConversations,
    creditsInCirculation,
    totalCreditsDeducted,
    planCounts,
    topTools,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
    prisma.generation.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }).then((rows: { userId: string }[]) => rows.length),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.generation.count(),
    prisma.generation.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.space.count(),
    prisma.chatConversation.count(),
    prisma.user.aggregate({ _sum: { creditsBalance: true } }).then((r: { _sum: { creditsBalance: number | null } }) => r._sum.creditsBalance ?? 0),
    prisma.creditTransaction.aggregate({
      where: { type: "DEDUCTION" },
      _sum: { amount: true },
    }).then((r: { _sum: { amount: number | null } }) => Math.abs(r._sum.amount ?? 0)),
    prisma.user.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
    prisma.generation.groupBy({
      by: ["toolId", "toolName"],
      _count: { toolId: true },
      orderBy: { _count: { toolId: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, email: true, name: true, image: true, plan: true, role: true,
        creditsBalance: true, createdAt: true,
      },
    }),
  ]);

  const userGrowthPct =
    newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0;

  return jsonOk({
    stats: {
      totalUsers,
      newUsersThisMonth,
      userGrowthPct,
      activeUsersLast7d,
      bannedUsers,
      totalGenerations,
      monthlyGenerations,
      totalSpaces,
      totalConversations,
      creditsInCirculation,
      totalCreditsDeducted,
    },
    planDistribution: planCounts.map((p: { plan: string; _count: { plan: number } }) => ({
      plan: p.plan,
      count: p._count.plan,
    })),
    topTools: topTools.map((t: { toolId: string; toolName: string; _count: { toolId: number } }) => ({
      toolId: t.toolId,
      toolName: t.toolName,
      count: t._count.toolId,
    })),
    recentSignups,
  });
}
