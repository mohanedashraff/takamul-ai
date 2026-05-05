// ════════════════════════════════════════════════════════════════
// executeTool — the main client-side entry point
// ════════════════════════════════════════════════════════════════
// Given a Tool definition + the user's form values, this helper:
//   1. Picks the right muapi model (from the `model` form field, or
//      falls back to the first option in tool.muapi.models)
//   2. Translates form values → muapi payload via tool.muapi.paramMap
//   3. Optionally calls calculate-cost first (if dynamicCost is on)
//   4. Submits + polls + records via runMuapiTool
//
// Tool authors don't need to think about polling, refunds, or auth —
// just `await executeTool(tool, values)`.

import { runMuapiTool } from "@/lib/run-tool";
import { calculateCost } from "@/lib/muapi";
import type { MuapiResult, PollOptions } from "@/lib/muapi";
import type { Tool, ToolMuapiBinding } from "@/lib/data/tools";
import { findModelAnywhere, resolveEndpoint } from "@/lib/data/models";

export interface ExecuteToolOptions {
  /** signal allows the caller to cancel a running generation */
  signal?: AbortSignal;
  /** progress callback — receives muapi status strings (queued, processing, …) */
  onStatus?: (status: string) => void;
  /** force this muapi endpoint, ignoring any selected model */
  endpointOverride?: string;
}

export interface ExecuteToolResult {
  result:        MuapiResult;
  generationId:  string;
  endpoint:      string;
  modelId:       string;
  /** the credits actually charged */
  credits:       number;
}

export async function executeTool(
  tool:   Tool,
  values: Record<string, unknown>,
  opts:   ExecuteToolOptions = {},
): Promise<ExecuteToolResult> {
  const binding = tool.muapi;
  if (!binding) {
    throw new Error(`Tool "${tool.id}" is not yet wired to MuAPI`);
  }

  // 1. Resolve which model to use
  const modelId = String(values.model ?? binding.models[0]?.id ?? "");
  if (!modelId) throw new Error("لم يتم اختيار نموذج");

  const lookup = findModelAnywhere(modelId);
  if (!lookup) {
    throw new Error(`الموديل غير معروف: ${modelId}`);
  }
  const endpoint = opts.endpointOverride ?? resolveEndpoint(lookup.model);

  // 2. Build muapi payload (apply paramMap; drop empty fields; drop "model")
  const payload = buildPayload(values, binding);

  // 3. Optional dynamic cost lookup → override the static credit cost
  let overrideCredits: number | undefined;
  if (binding.dynamicCost) {
    try {
      const { credits } = await calculateCost(endpoint, payload);
      if (credits > 0) overrideCredits = credits;
    } catch {
      // soft-fail: fall back to static cost
    }
  }

  // 4. Run with full book-keeping
  const pollOptions: PollOptions = {
    signal:   opts.signal,
    onStatus: (s) => opts.onStatus?.(s),
  };

  const { result, generationId } = await runMuapiTool({
    toolId:      tool.id,
    endpoint,
    payload,
    inputsForDb: values,           // store raw user inputs in DB
    pollOptions,
    overrideCredits,
  });

  return {
    result,
    generationId,
    endpoint,
    modelId,
    credits: overrideCredits ?? tool.credits,
  };
}

// ── helpers ─────────────────────────────────────────────────────────────

function buildPayload(
  values:  Record<string, unknown>,
  binding: ToolMuapiBinding,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(binding.staticPayload ?? {}) };
  const paramMap = binding.paramMap ?? {};

  for (const [key, raw] of Object.entries(values)) {
    if (key === "model") continue;             // model selection isn't part of the payload
    if (raw === "" || raw === undefined || raw === null) continue;
    if (raw === "auto") continue;               // "auto" is our sentinel, not a muapi value

    const muapiKey = paramMap[key] ?? key;
    out[muapiKey] = raw;
  }

  return out;
}

/** Does this tool have a complete muapi binding? */
export function isExecutable(tool: Tool): boolean {
  return Boolean(tool.muapi && tool.muapi.models.length > 0);
}
