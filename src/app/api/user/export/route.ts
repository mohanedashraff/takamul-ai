// ════════════════════════════════════════════════════════════════
// GET /api/user/export
// ════════════════════════════════════════════════════════════════
// GDPR data-portability — packages everything we have on the
// requesting user as a JSON download. No PII of other users is
// included; references (e.g. referrals) are anonymised.

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const userId = session.user.id;

  const [user, generations, transactions, payments, subscriptions, conversations, spaces, agentSubs, notifications, referralsGiven, referralsReceived] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, image: true, role: true, plan: true,
        emailVerified: true, creditsBalance: true, creditsLimit: true,
        planRenewsAt: true, referralCode: true, createdAt: true, updatedAt: true,
        // Note: passwordHash and stripe ids are intentionally excluded.
      },
    }),
    prisma.generation.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.space.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.agentSubscription.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.referral.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" }, select: { id: true, codeUsed: true, referrerCredits: true, refereeCredits: true, createdAt: true } }),
    prisma.referral.findMany({ where: { refereeId: userId },  orderBy: { createdAt: "desc" }, select: { id: true, codeUsed: true, referrerCredits: true, refereeCredits: true, createdAt: true } }),
  ]);

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    generations,
    creditTransactions: transactions,
    payments,
    subscriptions,
    chatConversations:  conversations,
    spaces,
    agentSubscriptions: agentSubs,
    notifications,
    referralsGiven,
    referralsReceived,
  };

  const filename = `yilow-export-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type":        "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
