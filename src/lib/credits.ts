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
export async function deductCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  type?: TransactionType;
}): Promise<{ balanceAfter: number; transactionId: string }> {
  const { userId, amount, reason, metadata, type = "DEDUCTION" } = params;
  if (amount <= 0) throw new Error("deductCredits: amount must be > 0");

  return prisma.$transaction(async (tx: Tx) => {
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

    return { balanceAfter, transactionId: txn.id };
  });
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
