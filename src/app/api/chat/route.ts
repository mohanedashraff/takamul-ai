// ════════════════════════════════════════════════════════════════
// POST /api/chat — stream a chat completion + persist messages
// ════════════════════════════════════════════════════════════════
// Uses Vercel AI SDK v6 + AI Gateway so a single AI_GATEWAY_API_KEY
// routes to Anthropic/OpenAI/Google/etc.
//
// Body: { conversationId?, model, messages: [{role,content}], attachments? }
//  - If conversationId is missing we create a new conversation.
//  - User message is saved BEFORE streaming.
//  - Assistant message is saved in the onFinish callback.

import { z } from "zod";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError } from "@/lib/api";
import { getModelConfig, DEFAULT_MODEL_ID } from "@/lib/chat-models";

export const runtime = "nodejs";
export const maxDuration = 60;

const ChatSchema = z.object({
  conversationId: z.string().optional(),
  model: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(z.unknown()).optional(),
      content: z.string().optional(),
    })
  ).min(1),
});

const SYSTEM_PROMPT = `أنت مساعد Yilow الذكي — منصة عربية للذكاء الاصطناعي. رد بالعربية بشكل واضح وودود إلا إذا طلب المستخدم غير ذلك. كن موجزاً ومفيداً.`;

export async function POST(req: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const { conversationId, model: modelId, messages } = parsed.data;
  const cfg = getModelConfig(modelId ?? DEFAULT_MODEL_ID);

  // Ensure conversation exists & belongs to user
  let conversation = conversationId
    ? await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
      })
    : null;

  if (!conversation) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const title = extractTitle(lastUser);
    conversation = await prisma.chatConversation.create({
      data: { userId: session.user.id, model: cfg.id, title },
    });
  }

  // Persist the latest user message (the one that just arrived)
  const latest = messages[messages.length - 1]!;
  if (latest.role === "user") {
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role:           "USER",
        content:        extractText(latest),
      },
    });
  }

  // If no API key configured, return a friendly error up-front
  if (!process.env.AI_GATEWAY_API_KEY) {
    return jsonError(
      "خدمة المحادثة غير مُعدّة بعد. أضف AI_GATEWAY_API_KEY إلى متغيرات البيئة.",
      503
    );
  }

  const convId = conversation.id;

  try {
    const modelMessages = await convertToModelMessages(messages as UIMessage[]);
    const result = streamText({
      model: gateway(cfg.gatewaySlug),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      onFinish: async ({ text, usage }) => {
        try {
          await prisma.chatMessage.create({
            data: {
              conversationId: convId,
              role:    "ASSISTANT",
              content: text,
              metadata: {
                model: cfg.id,
                usage: usage as never,
              } as never,
            },
          });
          await prisma.chatConversation.update({
            where: { id: convId },
            data: { updatedAt: new Date() },
          });
        } catch (err) {
          console.error("Chat onFinish persist failed", err);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: { "x-conversation-id": convId },
    });
  } catch (err) {
    console.error("Chat streamText error", err);
    return jsonError("خطأ في نموذج المحادثة", 500);
  }
}

function extractText(m: { content?: string; parts?: unknown[] }): string {
  if (m.content) return m.content;
  if (!m.parts) return "";
  return m.parts
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object" && "text" in p) return String((p as { text: unknown }).text ?? "");
      return "";
    })
    .join("");
}

function extractTitle(m?: { content?: string; parts?: unknown[] }): string {
  if (!m) return "محادثة جديدة";
  const text = extractText(m).trim();
  if (!text) return "محادثة جديدة";
  return text.length > 60 ? text.slice(0, 60) + "…" : text;
}
