// ════════════════════════════════════════════════════════════════
// Chat model registry — UI ids → OpenRouter slugs
// ════════════════════════════════════════════════════════════════
// Every model goes through OpenRouter (https://openrouter.ai). One
// `OPENROUTER_API_KEY` reaches every frontier provider — Anthropic,
// OpenAI, Google, Meta, etc. See lib/ai-provider.ts for the wrapper.

export interface ChatModelConfig {
  id: string;              // UI id (stable, also stored in DB)
  label: string;           // display name in Arabic
  provider: string;        // "anthropic" | "openai" | "google" | "meta" | ...
  openrouterSlug: string;  // what we pass to aiModel(...)
  contextWindow: number;
  supportsVision: boolean;
}

export const CHAT_MODELS: ChatModelConfig[] = [
  {
    id: "claude-3-5-sonnet",
    label: "Claude Sonnet 4.5",
    provider: "anthropic",
    openrouterSlug: "anthropic/claude-sonnet-4.5",
    contextWindow: 200000,
    supportsVision: true,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    openrouterSlug: "openai/gpt-4o",
    contextWindow: 128000,
    supportsVision: true,
  },
  {
    id: "gemini-1-5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    openrouterSlug: "google/gemini-2.5-pro",
    contextWindow: 2000000,
    supportsVision: true,
  },
  {
    id: "llama-3-70b",
    label: "Llama 3.3 70B",
    provider: "meta",
    openrouterSlug: "meta-llama/llama-3.3-70b-instruct",
    contextWindow: 128000,
    supportsVision: false,
  },
];

export const DEFAULT_MODEL_ID = "claude-3-5-sonnet";

export function getModelConfig(id: string): ChatModelConfig {
  return CHAT_MODELS.find((m) => m.id === id) ?? CHAT_MODELS[0]!;
}
