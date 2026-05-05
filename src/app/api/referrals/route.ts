// ════════════════════════════════════════════════════════════════
// GET  /api/referrals — fetch my code + stats (referrals I've made)
// POST /api/referrals — claim a referral code (called from /register)
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";
import { ensureReferralCode, claimReferral, REFERRAL_BONUSES } from "@/lib/referrals";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const code = await ensureReferralCode(session.user.id);

  const [count, totalCredits, recent] = await Promise.all([
    prisma.referral.count({ where: { referrerId: session.user.id } }),
    prisma.referral.aggregate({
      where: { referrerId: session.user.id },
      _sum:  { referrerCredits: true },
    }),
    prisma.referral.findMany({
      where:   { referrerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take:    10,
      include: {
        referee: { select: { id: true, name: true, email: true, createdAt: true } },
      },
    }),
  ]);

  return jsonOk({
    code,
    stats: {
      totalReferrals:        count,
      totalEarnedCredits:    totalCredits._sum.referrerCredits ?? 0,
      bonuses:               REFERRAL_BONUSES,
    },
    recent: recent.map((r) => ({
      id:        r.id,
      createdAt: r.createdAt,
      credits:   r.referrerCredits,
      referee: {
        // Don't expose the email if it's not theirs — show only the local-part.
        name:  r.referee.name ?? r.referee.email.split("@")[0],
        joinedAt: r.referee.createdAt,
      },
    })),
  });
}

const PostSchema = z.object({ code: z.string().min(4).max(16) });

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid code");

  const result = await claimReferral({
    refereeId: session.user.id,
    code:      parsed.data.code,
  });

  if (!result.ok) return jsonError(referralErrorAr(result.reason), 400);
  return jsonOk(result);
}

function referralErrorAr(reason: string): string {
  switch (reason) {
    case "code not found":          return "الرمز غير صحيح";
    case "cannot refer yourself":   return "لا يمكنك استخدام رمزك الخاص";
    case "already used a referral": return "تم استخدام رمز إحالة من قبل";
    case "empty code":              return "أدخل رمز إحالة";
    default:                        return "تعذّر تطبيق الإحالة";
  }
}
