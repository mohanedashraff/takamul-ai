// GET  /api/conversations — list user's conversations
// POST /api/conversations — create blank conversation (title/model)
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonOk, jsonError } from "@/lib/api";
import { DEFAULT_MODEL_ID } from "@/lib/chat-models";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const conversations = await prisma.chatConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      model: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return jsonOk({ conversations });
}

const CreateSchema = z.object({
  title: z.string().max(200).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown = {};
  try { body = await req.json(); } catch {}

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid");

  const conv = await prisma.chatConversation.create({
    data: {
      userId: session.user.id,
      title:  parsed.data.title ?? "محادثة جديدة",
      model:  parsed.data.model ?? DEFAULT_MODEL_ID,
    },
  });

  return jsonOk({ conversation: conv });
}
