// ════════════════════════════════════════════════════════════════
// POST /api/spaces/from-template/[id]
// ════════════════════════════════════════════════════════════════
// Takes a MuAPI workflow template id, fetches its full definition,
// converts the nodes/edges into our Spaces canvas format, and creates
// a brand-new Space record for the current user. Returns the new
// space id so the client can redirect to /spaces/canvas?space=<id>.

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";
import { workflowToSpace } from "@/lib/spaces/from-workflow";
import { tTemplate } from "@/lib/data/muapi-translations";

const MU_API_KEY = process.env.MU_API_KEY;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  if (!id) return jsonError("Missing template id", 400);
  if (!MU_API_KEY) return jsonError("MuAPI not configured", 503);

  // Pull the full workflow definition straight from MuAPI — we don't
  // cache it because templates can update upstream.
  let def: unknown;
  try {
    const r = await fetch(`https://api.muapi.ai/workflow/get-workflow-def/${id}`, {
      headers: { "x-api-key": MU_API_KEY },
      cache:   "no-store",
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return jsonError(`MuAPI returned ${r.status}: ${text.slice(0, 200)}`, r.status);
    }
    def = await r.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch template";
    return jsonError(msg, 502);
  }

  const { nodes, edges, title } = workflowToSpace(def as never);
  const ar = tTemplate(id, { name: title });

  // Persist as a new space owned by the user.
  const space = await prisma.space.create({
    data: {
      userId:      session.user.id,
      title:       ar.name,
      description: ar.description ?? null,
      nodes:       nodes as never,
      edges:       edges as never,
      shareToken:  randomBytes(16).toString("hex"),
    },
  });

  return jsonOk({ spaceId: space.id, title: ar.name });
}
