// ════════════════════════════════════════════════════════════════
// GET /api/cron/cleanup
// ════════════════════════════════════════════════════════════════
// Housekeeping job — runs daily. Deletes:
//   - VerificationToken rows that have expired (used or not).
//   - Read Notification rows older than 90 days.
//   - PENDING Generation rows older than 1 hour (orphaned uploads).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
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
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
  const oneHourAgo    = new Date(now.getTime() - 60 * 60 * 1000);

  const [tokens, notifications, generations] = await Promise.all([
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
    prisma.notification.deleteMany({
      where: { readAt: { lt: ninetyDaysAgo, not: null } },
    }),
    prisma.generation.deleteMany({
      where: { status: "PENDING", createdAt: { lt: oneHourAgo } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    expiredTokensDeleted:  tokens.count,
    oldNotificationsDeleted: notifications.count,
    orphanedGenerationsDeleted: generations.count,
  });
}
