// ════════════════════════════════════════════════════════════════
// POST /api/assistant — one-shot text completion (non-streaming)
// ════════════════════════════════════════════════════════════════
// Used by Spaces' AssistantNode + any other surface that needs a
// blocking text-in / text-out call. Streaming chat lives in /api/chat.
//
// Body: { model?: string, instruction?: string, input: string }
// Returns: { text: string }

import { z } from "zod";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { requireAuth, jsonError, jsonOk } from "@/lib/api";
import { getModelConfig, DEFAULT_MODEL_ID } from "@/lib/chat-models";

export const runtime    = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  model:       z.string().optional(),
  instruction: z.string().optional(),
  input:       z.string().min(1, "input is required").max(20_000),
});

export async function POST(req: Request) {
  const { response } = await requireAuth();
  if (response) return response;

  if (!process.env.AI_GATEWAY_API_KEY) {
    return jsonError(
      "خدمة المحادثة غير مُعدّة بعد. أضف AI_GATEWAY_API_KEY إلى متغيرات البيئة.",
      503,
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");

  const cfg = getModelConfig(parsed.data.model ?? DEFAULT_MODEL_ID);
  const system = parsed.data.instruction?.trim()
    || "أنت مساعد ذكي. رد بإيجاز ووضوح بالعربية ما لم يُطلب غير ذلك.";

  try {
    const { text } = await generateText({
      model:    gateway(cfg.gatewaySlug),
      system,
      prompt:   parsed.data.input,
    });
    return jsonOk({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في نموذج المحادثة";
    return jsonError(message, 500);
  }
}
