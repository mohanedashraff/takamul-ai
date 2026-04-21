// DELETE /api/agents/subscriptions/[agentId] — cancel subscription
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { agentId } = await params;

  const sub = await prisma.agentSubscription.findUnique({
    where: { userId_agentId: { userId: session.user.id, agentId } },
  });
  if (!sub) return jsonError("Subscription not found", 404);

  const updated = await prisma.agentSubscription.update({
    where: { id: sub.id },
    data:  { status: "CANCELLED", cancelledAt: new Date() },
  });

  return jsonOk({ subscription: updated });
}
