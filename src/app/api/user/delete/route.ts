// ════════════════════════════════════════════════════════════════
// POST /api/user/delete
// ════════════════════════════════════════════════════════════════
// GDPR right-to-erasure. Requires the user to confirm by typing their
// email AND (for credentials accounts) their password. Then:
//   1. Cancel any active Stripe subscription (best-effort).
//   2. Delete all related Prisma rows via cascading FKs.
//   3. Sign-out happens client-side after this returns 200.

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Schema = z.object({
  confirmEmail: z.string().email(),
  password:     z.string().optional(), // required for credentials-only users
});

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 400);

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true, email: true, passwordHash: true,
      stripeCustomerId: true, stripeSubscriptionId: true,
    },
  });
  if (!user) return jsonError("User not found", 404);

  if (parsed.data.confirmEmail.toLowerCase().trim() !== user.email.toLowerCase()) {
    return jsonError("الرجاء كتابة بريدك بالضبط للتأكيد", 400);
  }

  // For users with a password, require it. OAuth-only users skip this.
  if (user.passwordHash) {
    if (!parsed.data.password) return jsonError("كلمة المرور مطلوبة للتأكيد", 400);
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return jsonError("كلمة المرور غير صحيحة", 400);
  }

  // Cancel Stripe subscription up-front (best-effort; we don't block on this).
  if (isStripeConfigured() && user.stripeSubscriptionId) {
    try {
      await stripe().subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      console.error("[user/delete] Stripe cancel failed", err);
    }
  }

  // Wipe — onDelete: Cascade on related models takes care of the rest.
  await prisma.user.delete({ where: { id: user.id } });

  return jsonOk({ ok: true });
}
