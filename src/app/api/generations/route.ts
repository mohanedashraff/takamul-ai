// ════════════════════════════════════════════════════════════════
// GET  /api/generations       — paginated user history
// POST /api/generations       — start a new generation (deducts credits)
// ════════════════════════════════════════════════════════════════
// The POST endpoint is the UNIVERSAL entry point for every tool:
//   1. Validate user has credits
//   2. Deduct credits atomically
//   3. Create Generation row (status=PENDING)
//   4. Return generation id → client polls or streams
//
// The actual MuAPI call (which is the "tool backend" the user wants to
// leave for later) happens in PATCH /api/generations/[id]/execute.
// That stays stubbed for now — we just create the record here.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { deductCredits, InsufficientCreditsError } from "@/lib/credits";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";

const CreateSchema = z.object({
  toolId: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const url = new URL(req.url);
  const limit  = Math.min(Number(url.searchParams.get("limit")  ?? 20), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const toolId = url.searchParams.get("toolId") ?? undefined;

  const items = await prisma.generation.findMany({
    where: { userId: session.user.id, ...(toolId ? { toolId } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      toolId: true,
      toolName: true,
      category: true,
      status: true,
      creditsUsed: true,
      inputs: true,
      outputs: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;

  return jsonOk({
    items: trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1]!.id : null,
  });
}

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { toolId, inputs } = parsed.data;

  const tool = ALL_TOOLS_FLAT.find((t) => t.id === toolId);
  if (!tool) return jsonError("Tool not found", 404);

  try {
    const { balanceAfter, transactionId } = await deductCredits({
      userId: session.user.id,
      amount: tool.credits,
      reason: `tool:${toolId}`,
      metadata: { toolId, toolName: tool.title },
    });

    const gen = await prisma.generation.create({
      data: {
        userId:      session.user.id,
        toolId,
        toolName:    tool.title,
        category:    tool.categoryKey,
        status:      "PENDING",
        creditsUsed: tool.credits,
        inputs:      inputs as never,
      },
      select: { id: true, createdAt: true, status: true },
    });

    // Link transaction → generation (best-effort)
    await prisma.creditTransaction.update({
      where: { id: transactionId },
      data: { metadata: { toolId, toolName: tool.title, generationId: gen.id } as never },
    }).catch(() => {});

    return jsonOk({
      ok: true,
      generation: gen,
      creditsBalance: balanceAfter,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    console.error("generations POST", err);
    return jsonError("خطأ في السيرفر", 500);
  }
}
