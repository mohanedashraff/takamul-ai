// ════════════════════════════════════════════════════════════════
// GET /api/explore?filter=image|video|audio|all
// ════════════════════════════════════════════════════════════════
// Reverse-chronological feed of public generations.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime  = "nodejs";
export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "all";

  // Map mediaType → toolId prefix is fragile; the cleanest approach
  // is to derive from the output URL extension.
  try {
    const rows = await prisma.generation.findMany({
      where: { status: "COMPLETED", isPublic: true },
      orderBy: { createdAt: "desc" },
      take:    120,
      select: {
        id:        true,
        toolId:    true,
        prompt:    true,
        outputs:   true,
        createdAt: true,
        likeCount: true,
        user:      { select: { name: true, image: true } },
      },
    });

    const mapped = rows
      .map((r) => {
        const o = (r.outputs ?? {}) as Record<string, unknown>;
        const u = String(o.url ?? "");
        if (!u) return null;
        const mediaType: "image" | "video" | "audio" =
          /\.(mp4|webm|mov)(\?|$)/i.test(u) ? "video" :
          /\.(mp3|wav|ogg|flac)(\?|$)/i.test(u) ? "audio" :
          "image";
        return {
          id:        r.id,
          toolId:    r.toolId,
          toolName:  r.toolId,
          prompt:    r.prompt ?? "",
          url:       u,
          mediaType,
          likes:     r.likeCount ?? 0,
          author:    r.user?.name ? { name: r.user.name, image: r.user.image ?? undefined } : undefined,
          createdAt: r.createdAt.toISOString(),
        };
      })
      .filter(Boolean) as Array<{
        id: string; toolId: string; toolName: string; prompt: string;
        url: string; mediaType: "image" | "video" | "audio"; likes: number;
        author?: { name: string; image?: string }; createdAt: string;
      }>;

    const items = filter === "all" ? mapped : mapped.filter((m) => m.mediaType === filter);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=60, max-age=30, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.warn("[explore] query failed (schema not migrated yet)", err);
    return NextResponse.json({ items: [] });
  }
}
