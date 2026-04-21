// GET /api/credits/balance
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { creditsBalance: true, creditsLimit: true, plan: true, planRenewsAt: true },
  });

  return jsonOk({
    balance: user?.creditsBalance ?? 0,
    limit: user?.creditsLimit ?? 0,
    plan: user?.plan ?? "FREE",
    renewsAt: user?.planRenewsAt ?? null,
  });
}
