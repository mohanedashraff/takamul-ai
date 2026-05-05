// ════════════════════════════════════════════════════════════════
// Referrals — codes + bonuses + claim flow
// ════════════════════════════════════════════════════════════════
// Bonus configuration: 200 credits to the new user, 300 to the
// referrer (paid only if the referrer is on a non-free plan, to
// discourage trivial farming). Tunable via env later if needed.

import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

// Friendly, no-look-alike characters.
const codeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode      = customAlphabet(codeAlphabet, 8);

export const REFERRAL_BONUSES = {
  refereeCredits:  200,   // new user
  referrerCredits: 300,   // person who invited
} as const;

/** Get (or lazily create) the user's referral code. Idempotent. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where:  { id: userId },
    select: { referralCode: true },
  });
  if (u?.referralCode) return u.referralCode;

  // Loop in the unlikely case of collision.
  for (let i = 0; i < 5; i++) {
    const candidate = newCode();
    try {
      await prisma.user.update({
        where: { id: userId },
        data:  { referralCode: candidate },
      });
      return candidate;
    } catch {
      // unique violation — try again
    }
  }
  throw new Error("Failed to allocate referral code");
}

export interface ClaimResult {
  ok:           true;
  refereeCredits: number;
  referrerCredits: number;
}

/** Apply a referral code on a freshly-registered user.
 *  - Cannot self-refer.
 *  - Each user can only be referred ONCE (Referral.refereeId is unique). */
export async function claimReferral(args: {
  refereeId: string;
  code:      string;
}): Promise<ClaimResult | { ok: false; reason: string }> {
  const code = args.code.trim().toUpperCase();
  if (!code) return { ok: false, reason: "empty code" };

  const referrer = await prisma.user.findUnique({
    where:  { referralCode: code },
    select: { id: true, plan: true },
  });
  if (!referrer)                         return { ok: false, reason: "code not found" };
  if (referrer.id === args.refereeId)    return { ok: false, reason: "cannot refer yourself" };

  // Already claimed?
  const existing = await prisma.referral.findUnique({
    where:  { refereeId: args.refereeId },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already used a referral" };

  const refereeBonus  = REFERRAL_BONUSES.refereeCredits;
  // Anti-abuse: only paid plans get the referrer kickback. Free users
  // still grow their network but don't earn credits.
  const referrerBonus = referrer.plan === "FREE" ? 0 : REFERRAL_BONUSES.referrerCredits;

  await prisma.referral.create({
    data: {
      referrerId:      referrer.id,
      refereeId:       args.refereeId,
      codeUsed:        code,
      referrerCredits: referrerBonus,
      refereeCredits:  refereeBonus,
    },
  });

  if (refereeBonus > 0) {
    await addCredits({
      userId:   args.refereeId,
      amount:   refereeBonus,
      reason:   `referral-bonus:joined-via-${code}`,
      type:     "BONUS",
      metadata: { code, role: "referee" } as never,
    });
  }

  if (referrerBonus > 0) {
    await addCredits({
      userId:   referrer.id,
      amount:   referrerBonus,
      reason:   `referral-bonus:invited-${args.refereeId}`,
      type:     "BONUS",
      metadata: { code, role: "referrer" } as never,
    });
    await prisma.notification.create({
      data: {
        userId: referrer.id,
        kind:   "REFERRAL_BONUS",
        title:  "صديق جديد انضم بفضلك ✨",
        body:   `أُضيف ${referrerBonus} كريديت إلى رصيدك.`,
        href:   "/settings?tab=billing",
      },
    }).catch(() => {});
  }

  return { ok: true, refereeCredits: refereeBonus, referrerCredits: referrerBonus };
}
