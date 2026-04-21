// ════════════════════════════════════════════════════════════════
// GET    /api/generations/[id]  — fetch single generation
// PATCH  /api/generations/[id]  — update status / outputs (from tool runner)
// DELETE /api/generations/[id]  — delete from history
// ════════════════════════════════════════════════════════════════
// PATCH is used by the tool execution flow to mark a generation as
// COMPLETED or FAILED. On FAILED we refund the credits automatically.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { addCredits } from "@/lib/credits";

const PatchSchema = z.object({
  status:       z.enum(["PROCESSING", "COMPLETED", "FAILED"]).optional(),
  outputs:      z.unknown().optional(),
  errorMessage: z.string().optional(),
  muapiJobId:   z.string().optional(),
  durationMs:   z.number().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const gen = await prisma.generation.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!gen) return jsonError("Not found", 404);
  return jsonOk({ generation: gen });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const gen = await prisma.generation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, status: true, creditsUsed: true, toolId: true, toolName: true },
  });
  if (!gen) return jsonError("Not found", 404);

  const data = parsed.data;

  // Auto-refund on failure (only once — re-transitioning to FAILED is a no-op)
  if (data.status === "FAILED" && gen.status !== "FAILED" && gen.creditsUsed > 0) {
    await addCredits({
      userId: session.user.id,
      amount: gen.creditsUsed,
      reason: `refund:${gen.toolId}`,
      type: "REFUND",
      metadata: { generationId: gen.id, toolName: gen.toolName },
    });
  }

  const updated = await prisma.generation.update({
    where: { id: gen.id },
    data: {
      ...(data.status       !== undefined && { status: data.status }),
      ...(data.outputs      !== undefined && { outputs: data.outputs as never }),
      ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
      ...(data.muapiJobId   !== undefined && { muapiJobId: data.muapiJobId }),
      ...(data.durationMs   !== undefined && { durationMs: data.durationMs }),
    },
  });

  return jsonOk({ generation: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const gen = await prisma.generation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!gen) return jsonError("Not found", 404);

  await prisma.generation.delete({ where: { id: gen.id } });
  return jsonOk({ ok: true });
}
