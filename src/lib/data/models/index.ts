// ════════════════════════════════════════════════════════════════
// Model registry — typed wrapper around `full-registry.js`
// ════════════════════════════════════════════════════════════════
// `full-registry.js` is sourced from OpenHiggsField (it's the canonical
// list of muapi models with input schemas). We wrap it here so the rest
// of the codebase can import models with proper TypeScript types and
// without caring about the underlying JS module.

// @ts-ignore — JS module without types; we add types below.
import * as registry from "./full-registry.js";

export type ModelCategory = "t2i" | "i2i" | "t2v" | "i2v" | "v2v" | "lipsync";

export interface ModelInputSchema {
  type:        "string" | "int" | "float" | "boolean" | "file" | string;
  title?:      string;
  description?:string;
  default?:    unknown;
  enum?:       unknown[];
  minValue?:   number;
  maxValue?:   number;
  step?:       number;
  examples?:   unknown[];
  required?:   boolean;
  name?:       string;
  [k: string]: unknown;
}

export interface ModelEntry {
  id:        string;
  name?:     string;
  endpoint?: string;
  description?: string;
  family?:   string;
  category?: string; // sub-category (e.g. "image" | "video" for lipsync)
  inputs?:   Record<string, ModelInputSchema>;
  hasPrompt?: boolean;
  hasSeed?:   boolean;
  thumbnail?: string;
  [k: string]: unknown;
}

const t2iModels:    ModelEntry[] = (registry as Record<string, unknown>).t2iModels    as ModelEntry[] ?? [];
const i2iModels:    ModelEntry[] = (registry as Record<string, unknown>).i2iModels    as ModelEntry[] ?? [];
const t2vModels:    ModelEntry[] = (registry as Record<string, unknown>).t2vModels    as ModelEntry[] ?? [];
const i2vModels:    ModelEntry[] = (registry as Record<string, unknown>).i2vModels    as ModelEntry[] ?? [];
const v2vModels:    ModelEntry[] = (registry as Record<string, unknown>).v2vModels    as ModelEntry[] ?? [];
const lipsyncModels:ModelEntry[] = (registry as Record<string, unknown>).lipsyncModels as ModelEntry[] ?? [];

const REGISTRY: Record<ModelCategory, ModelEntry[]> = {
  t2i:     t2iModels,
  i2i:     i2iModels,
  t2v:     t2vModels,
  i2v:     i2vModels,
  v2v:     v2vModels,
  lipsync: lipsyncModels,
};

/** Return all models in a given category. */
export function listModels(category: ModelCategory): ModelEntry[] {
  return REGISTRY[category] ?? [];
}

/** Look up a single model by id within a category. */
export function getModel(category: ModelCategory, id: string): ModelEntry | undefined {
  return listModels(category).find((m) => m.id === id);
}

/** Search across all categories for a model id. Returns the first match. */
export function findModelAnywhere(id: string): { category: ModelCategory; model: ModelEntry } | undefined {
  for (const cat of MODEL_CATEGORIES) {
    const m = getModel(cat, id);
    if (m) return { category: cat, model: m };
  }
  return undefined;
}

/** Resolve the muapi endpoint slug for a model. */
export function resolveEndpoint(model: ModelEntry): string {
  return (typeof model.endpoint === "string" && model.endpoint) || model.id;
}

/** All categories with their counts. */
export function modelCounts(): Record<ModelCategory, number> {
  return {
    t2i:     t2iModels.length,
    i2i:     i2iModels.length,
    t2v:     t2vModels.length,
    i2v:     i2vModels.length,
    v2v:     v2vModels.length,
    lipsync: lipsyncModels.length,
  };
}

export const MODEL_CATEGORIES: ModelCategory[] = ["t2i", "i2i", "t2v", "i2v", "v2v", "lipsync"];

// Direct exports for cases where you want the full list of one category
export {
  t2iModels,
  i2iModels,
  t2vModels,
  i2vModels,
  v2vModels,
  lipsyncModels,
};
