// GET    /api/admin/users/[id]  — full user details
// PATCH  /api/admin/users/[id]  — update role / ban / plan / credits
// DELETE /api/admin/users/[id]  — SUPER_ADMIN only
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin, jsonOk, jsonError } from "@/lib/api";
import { addCredits, deductCredits } from "@/lib/credits";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          generations: true,
          chatConversations: true,
          spaces: true,
          agentSubscriptions: true,
          creditTransactions: true,
        },
      },
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      generations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, toolId: true, toolName: true, status: true,
          creditsUsed: true, createdAt: true,
        },
      },
    },
  });

  if (!user) return jsonError("User not found", 404);

  // Strip passwordHash before returning
  const { passwordHash: _pw, ...safe } = user;
  void _pw;

  return jsonOk({ user: safe });
}

const PatchSchema = z.object({
  role:        z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  plan:        z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]).optional(),
  isBanned:    z.boolean().optional(),
  bannedReason: z.string().max(500).nullable().optional(),
  creditsDelta: z.number().int().optional(),      // +grant / -revoke
  creditsLimit: z.number().int().nonnegative().optional(),
  name:         z.string().max(100).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");
  const data = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, creditsBalance: true },
  });
  if (!target) return jsonError("User not found", 404);

  // Role changes require SUPER_ADMIN. And you can't demote yourself.
  if (data.role !== undefined) {
    if (session.user.role !== "SUPER_ADMIN") {
      return jsonError("Only SUPER_ADMIN can change roles", 403);
    }
    if (target.id === session.user.id && data.role !== "SUPER_ADMIN") {
      return jsonError("لا يمكنك إزالة صلاحياتك بنفسك", 400);
    }
  }

  // Apply credit adjustment through the transactional ledger helpers
  if (data.creditsDelta && data.creditsDelta !== 0) {
    if (data.creditsDelta > 0) {
      await addCredits({
        userId: target.id,
        amount: data.creditsDelta,
        reason: "admin_grant",
        type:   "ADJUSTMENT",
        metadata: { grantedBy: session.user.id, adminEmail: session.user.email },
      });
    } else {
      // Clamp so we don't go negative
      const take = Math.min(Math.abs(data.creditsDelta), target.creditsBalance);
      if (take > 0) {
        await deductCredits({
          userId: target.id,
          amount: take,
          reason: "admin_revoke",
          type:   "ADJUSTMENT",
          metadata: { revokedBy: session.user.id, adminEmail: session.user.email },
        });
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(data.role         !== undefined && { role: data.role }),
      ...(data.plan         !== undefined && { plan: data.plan }),
      ...(data.name         !== undefined && { name: data.name }),
      ...(data.creditsLimit !== undefined && { creditsLimit: data.creditsLimit }),
      ...(data.isBanned     !== undefined && {
        isBanned: data.isBanned,
        bannedAt: data.isBanned ? new Date() : null,
        bannedReason: data.isBanned ? (data.bannedReason ?? null) : null,
      }),
    },
    select: {
      id: true, email: true, name: true, role: true, plan: true,
      isBanned: true, bannedReason: true, creditsBalance: true, creditsLimit: true,
    },
  });

  return jsonOk({ user: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSuperAdmin();
  if (response) return response;
  const { id } = await params;

  if (id === session.user.id) {
    return jsonError("لا يمكنك حذف حسابك بنفسك", 400);
  }

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return jsonError("User not found", 404);

  await prisma.user.delete({ where: { id } });
  return jsonOk({ ok: true });
}
