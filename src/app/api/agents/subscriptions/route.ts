// GET  /api/agents/subscriptions — list user's subscribed agents
// POST /api/agents/subscriptions — subscribe to an agent (stub — Stripe comes later)
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";
import { AGENTS_LIST } from "@/lib/data/agents";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const subs = await prisma.agentSubscription.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
  });

  return jsonOk({ subscriptions: subs });
}

const SubscribeSchema = z.object({
  agentId: z.string().min(1),
});

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid");

  const agent = AGENTS_LIST.find((a) => a.id === parsed.data.agentId);
  if (!agent) return jsonError("Agent not found", 404);

  // Check for existing active subscription
  const existing = await prisma.agentSubscription.findUnique({
    where: { userId_agentId: { userId: session.user.id, agentId: agent.id } },
  });
  if (existing && existing.status === "ACTIVE") {
    return jsonError("مشترك بالفعل في هذا الوكيل", 409);
  }

  // TODO: create Stripe subscription here, hook to webhook for status updates.
  // For now we create an ACTIVE subscription directly — replace once Stripe wires in.
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  const sub = existing
    ? await prisma.agentSubscription.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          renewalDate,
          cancelledAt: null,
        },
      })
    : await prisma.agentSubscription.create({
        data: {
          userId:          session.user.id,
          agentId:         agent.id,
          agentName:       agent.title,
          monthlyPriceUsd: agent.price,
          status:          "ACTIVE",
          renewalDate,
        },
      });

  return jsonOk({ subscription: sub });
}
