// GET /api/admin/tools — tool catalog + usage stats per tool
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonOk } from "@/lib/api";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  // Aggregate usage per toolId across all time
  const usage = await prisma.generation.groupBy({
    by: ["toolId"],
    _count: { toolId: true },
    _sum: { creditsUsed: true },
  });

  const usageMap = new Map<string, { count: number; creditsUsed: number }>();
  for (const u of usage) {
    usageMap.set(u.toolId, {
      count: u._count.toolId,
      creditsUsed: u._sum.creditsUsed ?? 0,
    });
  }

  // Last 7 days trend
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await prisma.generation.groupBy({
    by: ["toolId"],
    where: { createdAt: { gte: sevenDaysAgo } },
    _count: { toolId: true },
  });
  const recentMap = new Map<string, number>();
  for (const r of recent) recentMap.set(r.toolId, r._count.toolId);

  const tools = ALL_TOOLS_FLAT.map((t) => {
    const u = usageMap.get(t.id);
    return {
      id: t.id,
      title: t.title,
      desc: t.desc,
      category: t.categoryKey,
      categoryName: t.categoryName,
      credits: t.credits,
      isNew: t.isNew ?? false,
      image: t.image,
      usage: {
        total:       u?.count ?? 0,
        creditsUsed: u?.creditsUsed ?? 0,
        last7Days:   recentMap.get(t.id) ?? 0,
      },
    };
  });

  return jsonOk({ tools });
}
