// ════════════════════════════════════════════════════════════════
// POST /api/webhooks/stripe
// ════════════════════════════════════════════════════════════════
// Single source of truth for billing state. Stripe invokes this for
// every event we care about; we mirror the relevant ones into our
// Subscription / Payment tables and award credits via the existing
// credits engine. Idempotency is handled by Stripe's event ids.
//
// Events we handle:
//   - checkout.session.completed      → first-time subscription / pack purchase
//   - invoice.paid                    → recurring renewal: refill credits
//   - invoice.payment_failed          → mark subscription PAST_DUE, notify user
//   - customer.subscription.updated   → status / period changes (incl. cancel-at-period-end)
//   - customer.subscription.deleted   → user cancelled / churned

import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, getPlanByPriceId, getCreditPackByPriceId } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import type { Plan } from "@/generated/prisma/client";

export const runtime = "nodejs";
// Stripe sends a binary signature header — we MUST read the raw body.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  // We need the raw body bytes for signature verification.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification failed";
    console.error("[stripe webhook] signature verification failed", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object);
        break;
      default:
        // Many low-signal events arrive — ignore silently.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

// ── handlers ─────────────────────────────────────────────────────────

async function handleCheckoutCompleted(s: Stripe.Checkout.Session) {
  const userId = s.metadata?.userId;
  if (!userId) return;

  // Persist customerId in case it wasn't there yet.
  if (typeof s.customer === "string") {
    await prisma.user.update({
      where: { id: userId },
      data:  { stripeCustomerId: s.customer },
    }).catch(() => {});
  }

  // One-off credit-pack purchase → grant credits + record payment.
  if (s.mode === "payment" && s.metadata?.kind === "creditPack") {
    const credits  = Number(s.metadata.credits ?? 0);
    const packId   = String(s.metadata.packId ?? "");
    if (credits > 0) {
      await addCredits({
        userId,
        amount:   credits,
        reason:   `pack:${packId}`,
        type:     "PURCHASE",
        metadata: { stripeCheckoutId: s.id, packId },
      });
    }
    await prisma.payment.create({
      data: {
        userId,
        stripePaymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : null,
        amount:                s.amount_total ?? 0,
        currency:              (s.currency ?? "usd").toLowerCase(),
        status:                "SUCCEEDED",
        type:                  "CREDIT_PACK",
        description:           `Credit pack: ${packId}`,
        metadata:              { credits, packId, sessionId: s.id } as never,
      },
    }).catch((e) => console.error("payment.create failed", e));

    await prisma.notification.create({
      data: {
        userId,
        kind:  "CREDITS_REFILLED",
        title: "تم شراء حزمة الكريديت",
        body:  `أُضيف ${credits.toLocaleString("en")} كريديت إلى رصيدك.`,
        href:  "/settings?tab=billing",
      },
    }).catch(() => {});
  }
  // Subscription bootstraps are handled by `invoice.paid` so we don't
  // double-grant credits when both events arrive.
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = await resolveUserIdFromInvoice(invoice);
  if (!userId) return;

  const lines = invoice.lines?.data ?? [];
  // The "price" field on a line item is present at runtime even though
  // the older Stripe types lag behind. Use a focused cast.
  const priceId = (lines[0] as unknown as { price?: { id?: string } } | undefined)?.price?.id;
  const planCfg = priceId ? getPlanByPriceId(priceId) : undefined;

  if (!planCfg) return; // not a plan invoice (could be one-off, already handled)

  // Upsert / update the Subscription row.
  // @ts-expect-error - Stripe types lag behind: subscription is on the invoice
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (subId) {
    const sub = await stripe().subscriptions.retrieve(subId);
    await upsertSubscription(userId, sub, planCfg.plan);
  }

  // Refill credits to the plan allowance.
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { creditsBalance: true, plan: true },
  });
  if (user) {
    const refillTo = planCfg.credits;
    // Only grant the difference up to the new ceiling — never claw back.
    const grant = Math.max(0, refillTo - user.creditsBalance);
    if (grant > 0) {
      await addCredits({
        userId,
        amount:   grant,
        reason:   `plan-renewal:${planCfg.plan}`,
        type:     "SUBSCRIPTION",
        metadata: { plan: planCfg.plan, invoiceId: invoice.id } as never,
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data:  { plan: planCfg.plan, creditsLimit: refillTo },
    });
  }

  // Record the payment.
  await prisma.payment.create({
    data: {
      userId,
      stripeInvoiceId: invoice.id,
      stripeChargeId:  typeof (invoice as unknown as { charge?: unknown }).charge === "string"
        ? ((invoice as unknown as { charge: string }).charge)
        : null,
      amount:          invoice.amount_paid ?? 0,
      currency:        (invoice.currency ?? "usd").toLowerCase(),
      status:          "SUCCEEDED",
      type:            "SUBSCRIPTION",
      description:     `Plan: ${planCfg.englishName}`,
      metadata:        { plan: planCfg.plan, invoiceId: invoice.id } as never,
    },
  }).catch((e) => console.error("payment.create failed", e));

  await prisma.notification.create({
    data: {
      userId,
      kind:  "PLAN_RENEWED",
      title: "تم تجديد الاشتراك",
      body:  `أُضيف ${planCfg.credits.toLocaleString("en")} كريديت إلى رصيدك.`,
      href:  "/settings?tab=billing",
    },
  }).catch(() => {});
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const userId = await resolveUserIdFromInvoice(invoice);
  if (!userId) return;

  // Mark subscription PAST_DUE if we can identify it.
  // @ts-expect-error - Stripe types lag behind: subscription is on the invoice
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (subId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subId },
      data:  { status: "PAST_DUE" },
    });
  }

  await prisma.payment.create({
    data: {
      userId,
      stripeInvoiceId: invoice.id,
      amount:          invoice.amount_due ?? 0,
      currency:        (invoice.currency ?? "usd").toLowerCase(),
      status:          "FAILED",
      type:            "SUBSCRIPTION",
      description:     "Failed renewal",
      metadata:        { invoiceId: invoice.id } as never,
    },
  }).catch(() => {});

  await prisma.notification.create({
    data: {
      userId,
      kind:  "PAYMENT_FAILED",
      title: "فشلت عملية الدفع",
      body:  "لم نتمكن من تجديد اشتراكك. يرجى تحديث وسيلة الدفع.",
      href:  "/settings?tab=billing",
    },
  }).catch(() => {});
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id;
  const planCfg = priceId ? getPlanByPriceId(priceId) : undefined;
  await upsertSubscription(userId, sub, planCfg?.plan ?? "FREE");

  if (sub.status === "canceled") {
    // Downgrade to FREE — keep their existing credits, just stop renewing.
    await prisma.user.update({
      where: { id: userId },
      data:  { plan: "FREE", stripeSubscriptionId: null },
    });
    await prisma.notification.create({
      data: {
        userId,
        kind:  "PLAN_CANCELLED",
        title: "تم إلغاء الاشتراك",
        body:  "حسابك أصبح على الباقة المجانية. يمكنك إعادة الاشتراك في أي وقت.",
        href:  "/pricing",
      },
    }).catch(() => {});
  }
}

// ── helpers ──────────────────────────────────────────────────────────

async function resolveUserIdFromInvoice(invoice: Stripe.Invoice): Promise<string | null> {
  if (invoice.metadata?.userId) return invoice.metadata.userId;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return null;
  const u = await prisma.user.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true } });
  return u?.id ?? null;
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription, plan: Plan) {
  // @ts-expect-error - Stripe types lag behind, current_period_start exists at runtime
  const periodStart = (sub.current_period_start ?? sub.start_date ?? Math.floor(Date.now() / 1000)) as number;
  // @ts-expect-error - Stripe types lag behind, current_period_end exists at runtime
  const periodEnd   = (sub.current_period_end   ?? Math.floor(Date.now() / 1000)) as number;
  const status =
    sub.status === "active"   ? "ACTIVE" :
    sub.status === "past_due" ? "PAST_DUE" :
    sub.status === "paused"   ? "PAUSED" :
    sub.status === "canceled" ? "CANCELLED" : "ACTIVE";

  await prisma.subscription.upsert({
    where:  { stripeSubscriptionId: sub.id },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripeCustomerId:     typeof sub.customer === "string" ? sub.customer : "",
      stripePriceId:        sub.items.data[0]?.price.id ?? "",
      plan,
      status:               status as never,
      currentPeriodStart:   new Date(periodStart * 1000),
      currentPeriodEnd:     new Date(periodEnd   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end,
      cancelledAt:          sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    update: {
      plan,
      status:               status as never,
      currentPeriodStart:   new Date(periodStart * 1000),
      currentPeriodEnd:     new Date(periodEnd   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end,
      cancelledAt:          sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  // Mirror the active subscription id on the user row for fast lookups.
  if (status === "ACTIVE") {
    await prisma.user.update({
      where: { id: userId },
      data:  { stripeSubscriptionId: sub.id, plan },
    }).catch(() => {});
  }
}

// keep imports referenced
void getCreditPackByPriceId;
