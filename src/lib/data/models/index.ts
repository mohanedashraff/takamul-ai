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

/** Set of payload keys that are valid for this model per its
 *  `inputs` schema. Returns an empty set if the model has no inputs
 *  declared (so callers know they can't filter against it). */
export function getModelInputKeys(model: ModelEntry): Set<string> {
  return new Set(Object.keys(model.inputs ?? {}));
}

/** Filter a built payload to keys the model actually accepts.
 *
 *  Why: each tool's `paramMap` is the UNION of params needed across
 *  every model in its dropdown (text-to-video has 14). Passing the
 *  full union to a model that doesn't accept some of them either
 *  400s on a strict MuAPI gateway or silently ignores values on a
 *  lenient one — both produce wrong / failing output the user can't
 *  diagnose.
 *
 *  Behaviour:
 *  - If the model has NO `inputs` declared (registry gap), pass the
 *    payload through unchanged. Better to over-send than block.
 *  - Otherwise keep only the keys the model lists. Common URL
 *    aliases (image / image_url / init_image) are folded into the
 *    accepted variant for the model. Returns the filtered payload
 *    plus the list of dropped keys (for logging / debugging).
 */
export function filterPayloadForModel(
  model: ModelEntry,
  payload: Record<string, unknown>,
): { filtered: Record<string, unknown>; dropped: string[]; remapped: string[] } {
  const allowed = getModelInputKeys(model);
  if (allowed.size === 0) {
    // Registry gap — be permissive.
    return { filtered: payload, dropped: [], remapped: [] };
  }

  // Models name URL fields inconsistently. Same content can land in
  // any of these depending on the model. If our paramMap targeted
  // one name but the model expects another, remap rather than drop.
  const URL_ALIASES: Record<string, string[]> = {
    image_url:    ["image",       "input_image", "init_image", "image_urls"],
    images_list:  ["images",      "image_urls"],
    video_url:    ["video",       "video_urls",  "input_video"],
    audio_url:    ["audio",       "audio_input"],
    init_image:   ["image",       "image_url"],
    start_image:  ["first_image", "first_frame", "start_image_url"],
    end_image:    ["last_image",  "last_frame",  "end_image_url"],
  };

  const filtered: Record<string, unknown> = {};
  const dropped: string[] = [];
  const remapped: string[] = [];

  for (const [k, v] of Object.entries(payload)) {
    if (allowed.has(k)) {
      filtered[k] = v;
      continue;
    }
    // Try the alias map: find a canonical key the model DOES accept.
    const alias = Object.keys(URL_ALIASES).find(
      (canonical) =>
        URL_ALIASES[canonical]!.includes(k) && allowed.has(canonical),
    );
    if (alias) {
      filtered[alias] = v;
      remapped.push(`${k} → ${alias}`);
      continue;
    }
    // Reverse alias: payload key is canonical, model accepts a variant.
    const reverseAlias = Object.entries(URL_ALIASES).find(
      ([canonical, variants]) => canonical === k && variants.some((va) => allowed.has(va)),
    );
    if (reverseAlias) {
      const target = reverseAlias[1].find((va) => allowed.has(va))!;
      filtered[target] = v;
      remapped.push(`${k} → ${target}`);
      continue;
    }
    dropped.push(k);
  }

  return { filtered, dropped, remapped };
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
