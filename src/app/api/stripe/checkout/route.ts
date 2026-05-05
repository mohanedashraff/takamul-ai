// ════════════════════════════════════════════════════════════════
// POST /api/stripe/checkout
// ════════════════════════════════════════════════════════════════
// Creates a Stripe Checkout Session for either:
//   - a recurring plan subscription   (kind: "plan",      planId: "PRO" | "BASIC" | …)
//   - a one-off credit pack purchase  (kind: "creditPack", packId: "pack-1500" | …)
//
// On success the user is sent to Stripe's hosted checkout. The webhook
// (api/webhooks/stripe) is what actually grants credits / records the
// subscription — never rely on the redirect.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import {
  isStripeConfigured, stripe,
  PLAN_CATALOG, CREDIT_PACKS, getPlanConfig,
} from "@/lib/stripe";

export const runtime = "nodejs";

const Schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan"),       planId: z.enum(["BASIC", "PRO", "ENTERPRISE"]) }),
  z.object({ kind: z.literal("creditPack"), packId: z.string().min(1) }),
]);

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return jsonError("الدفع غير مُعدّ بعد. أضف STRIPE_SECRET_KEY إلى متغيرات البيئة.", 503);
  }

  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  // ── Resolve the Stripe price ───────────────────────────────────────
  let priceId: string | undefined;
  let mode:    "subscription" | "payment";
  let kindMeta: Record<string, string> = {};

  const data = parsed.data;
  if (data.kind === "plan") {
    const cfg = PLAN_CATALOG.find((p) => p.plan === data.planId);
    priceId = cfg?.priceId;
    mode    = "subscription";
    kindMeta = { kind: "plan", plan: data.planId };
  } else {
    const pack = CREDIT_PACKS.find((p) => p.id === data.packId);
    priceId = pack?.priceId;
    mode    = "payment";
    kindMeta = { kind: "creditPack", packId: data.packId, credits: String(pack?.credits ?? 0) };
  }

  if (!priceId) {
    return jsonError("لم يتم تكوين السعر بعد. يرجى المحاولة لاحقاً.", 503);
  }

  // ── Resolve / create the Stripe customer ──────────────────────────
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) return jsonError("User not found", 404);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email:    user.email,
      name:     user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data:  { stripeCustomerId: customerId },
    });
  }

  // ── Create the checkout session ───────────────────────────────────
  const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:3000";

  const checkout = await stripe().checkout.sessions.create({
    customer:               customerId,
    mode,
    line_items:             [{ price: priceId, quantity: 1 }],
    success_url:            `${origin}/settings?tab=billing&checkout=success`,
    cancel_url:             `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes:  true,
    automatic_tax:          { enabled: false },
    metadata: {
      userId: user.id,
      ...kindMeta,
    },
    ...(mode === "subscription"
      ? { subscription_data: { metadata: { userId: user.id, plan: kindMeta.plan ?? "" } } }
      : { payment_intent_data: { metadata: { userId: user.id, packId: kindMeta.packId ?? "", credits: kindMeta.credits ?? "0" } } }),
  });

  if (!checkout.url) return jsonError("Failed to create checkout session", 500);

  return jsonOk({ url: checkout.url });
}

// Convenience: keep the catalog readable by the client without
// exposing secret price ids.
export async function GET() {
  return jsonOk({
    plans: PLAN_CATALOG.map((p) => ({
      plan:        p.plan,
      name:        p.name,
      englishName: p.englishName,
      monthlyUsd:  p.monthlyUsd,
      credits:     p.credits,
      features:    p.features,
      popular:     p.popular ?? false,
      buyable:     Boolean(p.priceId),
    })),
    creditPacks: CREDIT_PACKS.map((p) => ({
      id:      p.id,
      name:    p.name,
      credits: p.credits,
      usd:     p.usd,
      bonus:   p.bonus ?? 0,
      buyable: Boolean(p.priceId),
    })),
    currentPlan: PLAN_CATALOG[0]!.plan, // overridden by client from session
  });
}

// keep the function reachable so the linter doesn't drop the import
void getPlanConfig;
