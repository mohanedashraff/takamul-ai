// ════════════════════════════════════════════════════════════════
// POST /api/stripe/portal — open the Stripe customer portal
// ════════════════════════════════════════════════════════════════
// Hosted UI for managing payment methods, invoices, and cancellation.
// We just create a one-time session URL and redirect the user.

import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return jsonError("الدفع غير مُعدّ بعد.", 503);
  }

  const { session, response } = await requireAuth();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return jsonError("ليس لديك أي مدفوعات بعد.", 400);
  }

  const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:3000";

  const portal = await stripe().billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${origin}/settings?tab=billing`,
  });

  return jsonOk({ url: portal.url });
}
