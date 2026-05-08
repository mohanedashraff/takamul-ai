// ════════════════════════════════════════════════════════════════
// AI Provider — OpenRouter (single OpenAI-compatible gateway)
// ════════════════════════════════════════════════════════════════
// We route every chat / generateText / generateObject call through
// OpenRouter (https://openrouter.ai). One API key reaches every
// frontier model — Claude, GPT, Gemini, Llama, etc.
//
// Usage:
//   import { aiModel } from "@/lib/ai-provider";
//   streamText({ model: aiModel("anthropic/claude-sonnet-4.5"), ... })
//
// Replaces the previous `@ai-sdk/gateway` integration; same semantics.

import { createOpenAI } from "@ai-sdk/openai";

/** True when an OPENROUTER_API_KEY is available. Endpoints should
 *  return 503 with a friendly message when this is false. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

let _provider: ReturnType<typeof createOpenAI> | null = null;
function provider() {
  if (_provider) return _provider;
  _provider = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey:  process.env.OPENROUTER_API_KEY ?? "",
    // OpenRouter recommends these headers — Referer for analytics +
    // X-Title so requests show the calling app in their dashboard.
    headers: {
      "HTTP-Referer": "https://yilow.ai",
      "X-Title":      "Yilow.ai",
    },
  });
  return _provider;
}

/**
 * Resolve a model slug (e.g. "anthropic/claude-sonnet-4.5") into a
 * LanguageModel instance the AI SDK can stream/generate against.
 *
 * Pass OpenRouter slugs directly — they look like
 *   anthropic/claude-sonnet-4.5
 *   openai/gpt-4o
 *   google/gemini-2.5-pro
 *   meta-llama/llama-3.3-70b-instruct
 *
 * Find the full list at https://openrouter.ai/models.
 */
export function aiModel(slug: string) {
  return provider()(slug);
}
