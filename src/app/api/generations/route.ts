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
import { coerceAspectRatio } from "@/lib/aspect-ratio";

const CreateSchema = z.object({
  toolId: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).default({}),
  /** if set, overrides the static cost from tools.ts (must be ≥ 1) — used for
   *  dynamic-pricing tools where the cost varies with payload */
  overrideCredits: z.number().int().min(1).max(100_000).optional(),
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

  const { toolId, inputs, overrideCredits } = parsed.data;

  const tool = ALL_TOOLS_FLAT.find((t) => t.id === toolId);
  if (!tool) return jsonError("Tool not found", 404);

  // ── Aspect-ratio coercion ───────────────────────────────────────
  // SDK / MCP / Canvas callers occasionally pass shapes like "1.78",
  // "16x9", "4:3 landscape". Snap to the closest supported ratio for
  // this tool (or COMMON_RATIOS if the tool doesn't constrain), and
  // surface any adjustments so the response can show "we used 16:9".
  const aspectInputId = tool.inputs?.find(
    (i) => i.id === "ratio" || i.id === "aspect_ratio" || i.id === "aspectRatio",
  )?.id;
  const ratioAdjustments: { from: string; to: string; method: string }[] = [];
  if (aspectInputId && inputs[aspectInputId] !== undefined) {
    const aspectInput = tool.inputs?.find((i) => i.id === aspectInputId);
    const supportedRatios =
      aspectInput?.options
        ?.map((o) => o.value)
        .filter((v) => /^\d+:\d+$/.test(v)) ?? undefined;
    const coerced = coerceAspectRatio(inputs[aspectInputId], supportedRatios);
    if (coerced.changed) {
      inputs[aspectInputId] = coerced.ratio;
      ratioAdjustments.push(...coerced.adjustments);
    }
  }

  // Dynamic pricing wins when provided (e.g. derived from /api/calculate-cost
  // before submitting). Fall back to the static cost in tools.ts otherwise.
  const credits = overrideCredits ?? tool.credits;

  try {
    const { balanceAfter, transactionId } = await deductCredits({
      userId: session.user.id,
      amount: credits,
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
        creditsUsed: credits,
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
      // Surface any adjustments the coercer made so the client can
      // show "we used 16:9 instead of 1.85:1".
      ...(ratioAdjustments.length > 0 ? { adjustments: ratioAdjustments } : {}),
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return jsonError("رصيد الكريديت غير كافٍ", 402);
    }
    console.error("generations POST", err);
    return jsonError("خطأ في السيرفر", 500);
  }
}
