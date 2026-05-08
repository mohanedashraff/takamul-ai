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
import { sendGenerationReadyEmail } from "@/lib/email";

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

  // Drop a notification when a long-running generation finishes — useful
  // mostly for video/audio jobs that take minutes. We deliberately skip
  // re-transitions and lightning-fast image jobs to avoid spam.
  const justCompleted = data.status === "COMPLETED" && gen.status !== "COMPLETED";
  const justFailed    = data.status === "FAILED"    && gen.status !== "FAILED";
  if (justCompleted || justFailed) {
    const slow = (data.durationMs ?? 0) >= 8_000; // ≥ 8s ⇒ background-y
    if (slow || justFailed) {
      await prisma.notification.create({
        data: {
          userId:   session.user.id,
          kind:     justFailed ? "GENERATION_FAILED" : "GENERATION_DONE",
          title:    justFailed ? `فشل: ${gen.toolName}` : `جاهز: ${gen.toolName}`,
          body:     justFailed ? (data.errorMessage ?? "حدث خطأ في التوليد") : "اضغط للعرض والتحميل.",
          href:     `/dashboard?gen=${gen.id}`,
          metadata: { generationId: gen.id, toolId: gen.toolId } as never,
        },
      }).catch(() => {});
    }

    // Send a "your generation is ready" email for jobs that took ≥ 30s
    // — those are the ones the user has likely tabbed away from. We
    // don't email every fast image, only the long-running video/audio.
    const emailWorthy = (data.durationMs ?? 0) >= 30_000 && justCompleted;
    if (emailWorthy && data.outputs) {
      const resultUrl = pickResultUrl(data.outputs);
      if (resultUrl) {
        const user = await prisma.user.findUnique({
          where:  { id: session.user.id },
          select: { email: true, name: true },
        });
        if (user?.email) {
          const appUrl = process.env.AUTH_URL || req.headers.get("origin") || "https://yilow.ai";
          sendGenerationReadyEmail({
            to:           user.email,
            name:         user.name,
            appUrl,
            toolName:     gen.toolName,
            resultUrl,
            generationId: gen.id,
            durationMs:   data.durationMs,
          }).catch((err) => console.error("[generations PATCH] email failed", err));
        }
      }
    }
  }

  return jsonOk({ generation: updated });
}

/** Best-effort URL extraction from a tool result object. Mirrors the
 *  shape of MuapiResult / runMuapiTool's outputs. */
function pickResultUrl(r: unknown): string | null {
  if (typeof r !== "object" || !r) return null;
  const o = r as Record<string, unknown>;
  if (typeof o.url === "string" && o.url) return o.url;
  if (Array.isArray(o.urls) && typeof o.urls[0] === "string") return o.urls[0];
  if (Array.isArray(o.outputs) && o.outputs.length) {
    const first = o.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "url" in first) {
      const url = (first as { url: unknown }).url;
      if (typeof url === "string") return url;
    }
  }
  return null;
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
