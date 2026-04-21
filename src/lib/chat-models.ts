// ════════════════════════════════════════════════════════════════
// Chat model registry — maps UI model ids → Vercel AI Gateway slugs
// ════════════════════════════════════════════════════════════════
// We use @ai-sdk/gateway so the whole chat can run on a single
// AI_GATEWAY_API_KEY env var. Set that on Vercel or locally to
// enable the chat endpoint.

export interface ChatModelConfig {
  id: string;              // UI id
  label: string;           // display name in Arabic
  provider: string;        // "anthropic" | "openai" | "google" | "xai" | ...
  gatewaySlug: string;     // what we pass to gateway(...)
  contextWindow: number;
  supportsVision: boolean;
}

export const CHAT_MODELS: ChatModelConfig[] = [
  {
    id: "claude-3-5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
    gatewaySlug: "anthropic/claude-sonnet-4-5",
    contextWindow: 200000,
    supportsVision: true,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    gatewaySlug: "openai/gpt-4o",
    contextWindow: 128000,
    supportsVision: true,
  },
  {
    id: "gemini-1-5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google",
    gatewaySlug: "google/gemini-2.5-pro",
    contextWindow: 2000000,
    supportsVision: true,
  },
  {
    id: "llama-3-70b",
    label: "Llama 3 70B",
    provider: "meta",
    gatewaySlug: "meta/llama-3.3-70b",
    contextWindow: 128000,
    supportsVision: false,
  },
];

export const DEFAULT_MODEL_ID = "claude-3-5-sonnet";

export function getModelConfig(id: string): ChatModelConfig {
  return CHAT_MODELS.find((m) => m.id === id) ?? CHAT_MODELS[0]!;
}
