// GET  /api/spaces — list user's spaces
// POST /api/spaces — create new space
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const spaces = await prisma.space.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      lastOpenedAt: true,
    },
  });

  return jsonOk({ spaces });
}

const CreateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  nodes:       z.array(z.unknown()).optional(),
  edges:       z.array(z.unknown()).optional(),
  viewport:    z.unknown().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown = {};
  try { body = await req.json(); } catch {}
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid");

  const space = await prisma.space.create({
    data: {
      userId:      session.user.id,
      title:       parsed.data.title ?? "مساحة جديدة",
      description: parsed.data.description,
      nodes:       (parsed.data.nodes ?? []) as never,
      edges:       (parsed.data.edges ?? []) as never,
      viewport:    parsed.data.viewport as never,
      shareToken:  randomBytes(16).toString("hex"),
    },
  });

  return jsonOk({ space });
}
