// ════════════════════════════════════════════════════════════════
// GET /api/mcp/catalog — tool catalog for the MCP server
// ════════════════════════════════════════════════════════════════
// Returns a pruned, JSON-safe shape of `ALL_TOOLS_FLAT` so the
// `@yilow/mcp-server` package can translate each tool into an MCP
// tool description without pulling in our internal types.
//
// Auth: Bearer <YILOW_API_KEY>. We use the same `verifyApiKey`
// helper as the public REST surface — the key maps to a workspace
// so credit-deduction lands on the right user.

import { NextResponse } from "next/server";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";
import { verifyApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!match) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <token>" },
      { status: 401 },
    );
  }
  const userId = await verifyApiKey(match[1]!).catch(() => null);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Project each tool into a wire-safe shape. Lucide icons + functions
  // get stripped; only the fields the MCP server needs are emitted.
  const tools = ALL_TOOLS_FLAT.map((t) => ({
    id:       t.id,
    title:    t.title,
    desc:     t.desc,
    credits:  t.credits,
    category:
      t.muapi?.category ??
      (t.id.includes("video") || t.id.includes("v2v") || t.id.includes("i2v") ? "video" :
       t.id.includes("audio") || t.id.includes("tts") || t.id.includes("voice") ? "audio" :
       "image"),
    inputs:   (t.inputs ?? []).map((i) => ({
      id:           i.id,
      type:         i.type,
      label:        i.label,
      hint:         i.hint,
      required:     i.required,
      options:      i.options,
      defaultValue: i.defaultValue,
      min:          i.min,
      max:          i.max,
      step:         i.step,
      accept:       i.accept,
    })),
    customRoute: t.customRoute,
    studio:      t.studio,
    comingSoon:  t.comingSoon,
  }));

  return NextResponse.json(
    { tools, count: tools.length },
    {
      headers: {
        // Cache for an hour on edges, 5 min on browsers — the catalog
        // changes rarely and a stale read is fine for MCP listing.
        "Cache-Control": "public, s-maxage=3600, max-age=300, stale-while-revalidate=120",
      },
    },
  );
}
