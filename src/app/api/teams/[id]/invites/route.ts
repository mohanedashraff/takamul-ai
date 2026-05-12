// ════════════════════════════════════════════════════════════════
// /api/teams/[id]/invites — list + send invites
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email().max(200),
  role:  z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

async function assertMember(teamId: string, userId: string, requireAdmin = false) {
  const m = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!m) return false;
  if (requireAdmin && m.role === "MEMBER") return false;
  return true;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await ctx.params;

  try {
    if (!(await assertMember(id, session.user.id))) {
      return jsonError("مش عضو في الفريق ده", 403);
    }
    const invites = await prisma.teamInvite.findMany({
      where:   { teamId: id, revokedAt: null, acceptedAt: null },
      orderBy: { sentAt: "desc" },
      select: { id: true, email: true, role: true, sentAt: true },
    });
    return jsonOk({
      invites: invites.map((i) => ({
        ...i,
        sentAt: i.sentAt.toISOString(),
      })),
    });
  } catch (err) {
    console.warn("[invites] query failed", err);
    return jsonOk({ invites: [] });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    if (!(await assertMember(id, session.user.id, true))) {
      return jsonError("لازم تكون OWNER أو ADMIN عشان تعزم حد", 403);
    }
    const token = randomBytes(24).toString("base64url");
    const invite = await prisma.teamInvite.create({
      data: {
        teamId: id,
        email:  parsed.data.email,
        role:   parsed.data.role,
        token,
      },
    });
    // TODO: send transactional email via Resend with /api/teams/accept?token=…
    return jsonOk({
      invite: {
        id:     invite.id,
        email:  invite.email,
        role:   invite.role,
        sentAt: invite.sentAt.toISOString(),
      },
    });
  } catch (err) {
    console.warn("[invites] create failed", err);
    return jsonError("Schema not migrated. Run `npx prisma migrate dev` first.", 503);
  }
}
