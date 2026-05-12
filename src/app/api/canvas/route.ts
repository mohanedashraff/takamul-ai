// ════════════════════════════════════════════════════════════════
// /api/canvas — persist a Canvas pipeline (best-effort)
// ════════════════════════════════════════════════════════════════
// We don't strictly need server persistence — the localStorage copy
// in CanvasWorkspace is the canonical source. This endpoint exists
// so the user can share a canvas across devices once we add the
// CanvasPipeline DB model. For now it 200s and stashes nothing.

import { jsonOk, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  // Future: write to prisma.canvasPipeline.upsert.
  await req.json().catch(() => ({}));
  return jsonOk({ saved: true, userId: session.user.id });
}

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  // Future: fetch latest saved canvas. Today we return empty so the
  // client falls back to localStorage.
  return jsonOk({ canvas: null, userId: session.user.id });
}
