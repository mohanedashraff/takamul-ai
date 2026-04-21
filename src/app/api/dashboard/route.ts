// GET /api/dashboard — aggregate stats for the dashboard page
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const userId = session.user.id;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [user, monthlyGenerations, totalGenerations, recent, topTools, lastMonthGenerations] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          plan: true,
          creditsBalance: true,
          creditsLimit: true,
          planRenewsAt: true,
          createdAt: true,
        },
      }),
      prisma.generation.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      }),
      prisma.generation.count({ where: { userId } }),
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          toolId: true,
          toolName: true,
          category: true,
          status: true,
          outputs: true,
          createdAt: true,
        },
      }),
      prisma.generation.groupBy({
        by: ["toolId", "toolName"],
        where: { userId },
        _count: { toolId: true },
        orderBy: { _count: { toolId: "desc" } },
        take: 4,
      }),
      (async () => {
        const lastMonthStart = new Date(startOfMonth);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        return prisma.generation.count({
          where: {
            userId,
            createdAt: { gte: lastMonthStart, lt: startOfMonth },
          },
        });
      })(),
    ]);

  const growthPct =
    lastMonthGenerations > 0
      ? Math.round(((monthlyGenerations - lastMonthGenerations) / lastMonthGenerations) * 100)
      : monthlyGenerations > 0 ? 100 : 0;

  return jsonOk({
    user,
    stats: {
      monthlyGenerations,
      totalGenerations,
      growthPct,
      creditsUsedThisMonth: Math.max(0, (user?.creditsLimit ?? 0) - (user?.creditsBalance ?? 0)),
    },
    recent,
    topTools: topTools.map((t: { toolId: string; toolName: string; _count: { toolId: number } }) => ({
      toolId: t.toolId,
      toolName: t.toolName,
      count: t._count.toolId,
    })),
  });
}
