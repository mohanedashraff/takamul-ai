// ════════════════════════════════════════════════════════════════
// /api/teams — list + create teams
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: { include: { _count: { select: { members: true } } } },
      },
      orderBy: { joinedAt: "desc" },
    });
    const teams = memberships.map((m) => ({
      id:          m.team.id,
      name:        m.team.name,
      role:        m.role,
      memberCount: m.team._count.members,
      createdAt:   m.team.createdAt.toISOString(),
    }));
    return jsonOk({ teams });
  } catch (err) {
    console.warn("[teams] query failed (schema not migrated yet)", err);
    return jsonOk({ teams: [] });
  }
}

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const team = await prisma.team.create({
      data: {
        name:    parsed.data.name,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: "OWNER" },
        },
      },
    });
    return jsonOk({
      team: {
        id:          team.id,
        name:        team.name,
        role:        "OWNER",
        memberCount: 1,
        createdAt:   team.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.warn("[teams] create failed (schema not migrated yet)", err);
    return jsonError("Schema not migrated. Run `npx prisma migrate dev` first.", 503);
  }
}
