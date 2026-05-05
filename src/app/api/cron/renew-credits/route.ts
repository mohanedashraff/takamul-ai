// ════════════════════════════════════════════════════════════════
// GET /api/cron/renew-credits
// ════════════════════════════════════════════════════════════════
// Idempotent monthly job — refills FREE-tier users' credits when
// `planRenewsAt` is in the past, and rolls the renewal date forward
// by 30 days. Paid plans get refilled by the Stripe `invoice.paid`
// webhook (P1.3c) so this only handles FREE.
//
// Authentication: a shared secret (CRON_SECRET) passed as a header
// or query param. Schedule it on Vercel Cron / external scheduler.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";
import { getPlanConfig } from "@/lib/stripe";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>; manual hits
  // can use x-cron-secret or ?secret=.
  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;
  const provided = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  return provided === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const plan = "FREE";
  const cfg  = getPlanConfig(plan);

  // Eligible: free users whose renewal window has passed OR who have no
  // renewal scheduled yet (e.g. legacy accounts).
  const eligible = await prisma.user.findMany({
    where: {
      plan,
      OR: [
        { planRenewsAt: { lte: now } },
        { planRenewsAt: null },
      ],
    },
    select: { id: true, creditsBalance: true, creditsLimit: true },
    take: 500, // process in batches to keep individual runs fast
  });

  let refilled = 0;
  const next = new Date(now);
  next.setDate(next.getDate() + 30);

  for (const u of eligible) {
    const grant = Math.max(0, cfg.credits - u.creditsBalance);
    if (grant > 0) {
      await addCredits({
        userId:   u.id,
        amount:   grant,
        reason:   `monthly-free-refill`,
        type:     "SUBSCRIPTION",
        metadata: { plan } as never,
      });
      refilled++;
    }
    await prisma.user.update({
      where: { id: u.id },
      data:  { planRenewsAt: next, creditsLimit: cfg.credits },
    });
  }

  return NextResponse.json({
    ok: true,
    processed: eligible.length,
    refilled,
    nextRenewal: next.toISOString(),
  });
}
