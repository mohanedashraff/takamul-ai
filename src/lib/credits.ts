// ════════════════════════════════════════════════════════════════
// Credits — deduction / refund / purchase helpers
// ════════════════════════════════════════════════════════════════
// All mutations go through a transaction so balance + ledger stay
// in sync. Never UPDATE user.creditsBalance outside these helpers.

import { prisma } from "@/lib/prisma";
import { Prisma, type TransactionType } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class InsufficientCreditsError extends Error {
  constructor(public balance: number, public required: number) {
    super(`Insufficient credits: have ${balance}, need ${required}`);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Atomically deducts credits from a user, recording a ledger entry.
 * Throws InsufficientCreditsError if balance would go negative.
 */
/** Email gets sent ONCE when the user crosses below this threshold. */
const CREDITS_LOW_THRESHOLD = 20;

export async function deductCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  type?: TransactionType;
}): Promise<{ balanceAfter: number; transactionId: string }> {
  const { userId, amount, reason, metadata, type = "DEDUCTION" } = params;
  if (amount <= 0) throw new Error("deductCredits: amount must be > 0");

  const result = await prisma.$transaction(async (tx: Tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true },
    });
    if (!user) throw new Error("User not found");

    if (user.creditsBalance < amount) {
      throw new InsufficientCreditsError(user.creditsBalance, amount);
    }

    const balanceAfter = user.creditsBalance - amount;

    await tx.user.update({
      where: { id: userId },
      data: { creditsBalance: balanceAfter },
    });

    const txn = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount: -amount,
        balanceAfter,
        reason,
        metadata: metadata as never,
      },
      select: { id: true },
    });

    return {
      balanceAfter,
      balanceBefore: user.creditsBalance,
      transactionId: txn.id,
    };
  });

  // Fire the credits-low email when this deduction crossed the threshold
  // (was above, now below or equal). Best-effort and runs after the
  // transaction so it can't slow the deduction itself.
  if (result.balanceBefore > CREDITS_LOW_THRESHOLD && result.balanceAfter <= CREDITS_LOW_THRESHOLD) {
    void notifyCreditsLow(userId, result.balanceAfter);
  }

  return { balanceAfter: result.balanceAfter, transactionId: result.transactionId };
}

/** Side-effect: dispatches a credits-low email + in-app notification.
 *  Imported lazily to avoid circular deps with email.ts. */
async function notifyCreditsLow(userId: string, balance: number): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { email: true, name: true, planRenewsAt: true },
    });
    if (!user?.email) return;

    const appUrl = process.env.AUTH_URL || "https://yilow.ai";
    const { sendCreditsLowEmail } = await import("./email");
    await sendCreditsLowEmail({
      to:       user.email,
      name:     user.name,
      appUrl,
      balance,
      renewsAt: user.planRenewsAt,
    });

    // In-app notification too — surfaces in the bell dropdown.
    await prisma.notification.create({
      data: {
        userId,
        kind:  "CREDITS_LOW",
        title: "رصيد الكريديت قارب على الانتهاء",
        body:  `رصيدك دلوقتي ${balance} كريديت — اشحن لتفادي توقّف الأدوات.`,
        href:  "/pricing",
      },
    });
  } catch (err) {
    console.error("[credits] notifyCreditsLow failed", err);
  }
}

/** Adds credits back (refund on failed generation, monthly renewal, bonus). */
export async function addCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  type?: TransactionType;
}): Promise<{ balanceAfter: number; transactionId: string }> {
  const { userId, amount, reason, metadata, type = "BONUS" } = params;
  if (amount <= 0) throw new Error("addCredits: amount must be > 0");

  return prisma.$transaction(async (tx: Tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true },
    });
    if (!user) throw new Error("User not found");

    const balanceAfter = user.creditsBalance + amount;

    await tx.user.update({
      where: { id: userId },
      data: { creditsBalance: balanceAfter },
    });

    const txn = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter,
        reason,
        metadata: metadata as never,
      },
      select: { id: true },
    });

    return { balanceAfter, transactionId: txn.id };
  });
}
