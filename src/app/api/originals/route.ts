// ════════════════════════════════════════════════════════════════
// GET /api/originals — curated featured generations
// ════════════════════════════════════════════════════════════════
// Returns up to 60 generations marked `isFeatured: true`. Public —
// no auth required. Output URLs come straight from the generation's
// `outputs.url` field.
//
// Future: a `/admin/originals` page can pin/unpin curated entries.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime  = "nodejs";
export const revalidate = 300;  // 5-min cache

export async function GET() {
  // We fan out gracefully if the `featured` flag doesn't exist yet.
  try {
    const rows = await prisma.generation.findMany({
      where: {
        status:     "COMPLETED",
        isFeatured: true,
        isPublic:   true,
      },
      orderBy: { createdAt: "desc" },
      take:    60,
      select: {
        id:        true,
        toolId:    true,
        prompt:    true,
        outputs:   true,
        createdAt: true,
        user:      { select: { name: true, image: true } },
      },
    });

    const items = rows.map((r) => {
      const o = (r.outputs ?? {}) as Record<string, unknown>;
      const url = String(o.url ?? "");
      const mediaType: "image" | "video" = /\.(mp4|webm|mov)(\?|$)/i.test(url)
        ? "video" : "image";
      return {
        id:        r.id,
        title:     (r.prompt ?? "").slice(0, 80) || "بدون عنوان",
        toolId:    r.toolId,
        toolName:  r.toolId,
        url,
        mediaType,
        prompt:    r.prompt ?? undefined,
        author:    r.user?.name ? { name: r.user.name } : undefined,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=300, max-age=60, stale-while-revalidate=600" } },
    );
  } catch (err) {
    // Schema flags might not exist yet — return empty rather than 5xx.
    console.warn("[originals] query failed (probably schema not migrated)", err);
    return NextResponse.json({ items: [] });
  }
}
