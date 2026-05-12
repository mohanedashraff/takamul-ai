// ════════════════════════════════════════════════════════════════
// /api/marketing/products — list + create saved products
// ════════════════════════════════════════════════════════════════

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthOrApiKey } from "@/lib/api";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name:        z.string().min(1).max(120),
  description: z.string().max(2_000).optional(),
  url:         z.string().url().optional(),
  imageUrl:    z.string().url(),
  screenshots: z.array(z.string().url()).max(10).optional(),
  source:      z.enum(["manual", "url-fetch", "app-store"]).default("manual"),
  category:    z.string().max(80).optional(),
});

export async function GET(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  try {
    const products = await prisma.product.findMany({
      where:   { userId: userId! },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ products });
  } catch (err) {
    console.warn("[products] query failed", err);
    return jsonOk({ products: [] });
  }
}

export async function POST(req: Request) {
  const { userId, response } = await requireAuthOrApiKey(req);
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  try {
    const product = await prisma.product.create({
      data: {
        userId:      userId!,
        name:        parsed.data.name,
        description: parsed.data.description,
        url:         parsed.data.url,
        imageUrl:    parsed.data.imageUrl,
        screenshots: parsed.data.screenshots ?? [],
        source:      parsed.data.source,
        category:    parsed.data.category,
      },
    });
    return jsonOk({ product });
  } catch (err) {
    console.warn("[products] create failed", err);
    return jsonError("Schema not migrated. Run `npx prisma migrate dev` first.", 503);
  }
}
