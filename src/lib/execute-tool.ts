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
  // ── Custom runner path (ElevenLabs TTS, Replicate audio, FFmpeg, …)
  // Tools wired to an internal API route bypass the MuAPI submit/poll
  // flow and just call the endpoint directly. We still go through
  // /api/generations for credit-deduction + history logging.
  if (tool.customRunner) {
    return runCustomTool(tool, values, opts);
  }

  const binding = tool.muapi;
  if (!binding) {
    throw new Error(`Tool "${tool.id}" is not yet wired to a backend`);
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

// ── Custom-runner path ──────────────────────────────────────────────
// Used by tools wired to internal endpoints (TTS, audio split,
// audio enhance, video resize). One POST → final result. No polling.

async function runCustomTool(
  tool:   Tool,
  values: Record<string, unknown>,
  opts:   ExecuteToolOptions,
): Promise<ExecuteToolResult> {
  const cfg = tool.customRunner!;
  const paramMap = cfg.paramMap ?? {};

  // Build the payload using the same conventions as MuAPI tools.
  const payload: Record<string, unknown> = { ...(cfg.staticPayload ?? {}) };
  for (const [key, raw] of Object.entries(values)) {
    if (key === "model") continue;
    if (raw === "" || raw === undefined || raw === null) continue;
    if (raw === "auto") continue;
    payload[paramMap[key] ?? key] = raw;
  }

  // Step 1 — book-keeping: deduct credits + create a PENDING generation row.
  const startRes = await fetch("/api/generations", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ toolId: tool.id, inputs: values }),
  });
  const startData = await startRes.json().catch(() => ({}));
  if (!startRes.ok) {
    throw new Error(startData.error || "فشل بدء العملية");
  }
  const generationId = startData.generation.id as string;

  // Step 2 — call the actual provider.
  opts.onStatus?.("processing");
  const started = performance.now();
  let resultUrl: string | undefined;
  try {
    const res = await fetch(cfg.endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  opts.signal,
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { /* HTML / empty */ }
    if (!res.ok) {
      const msg = (data.error as string) || (data.detail as string) || `فشلت العملية (${res.status})`;
      throw new Error(msg);
    }

    // Pick the first usable URL from the response. Different endpoints
    // return slightly different shapes (TTS → { url }, separate →
    // { vocals, drums, … }).
    resultUrl = (data.url as string)
      || (data.vocals as string)
      || (data.audio as string);
    if (!resultUrl) {
      // For multi-stem outputs, surface the entire object as outputs.
      if (Object.keys(data).length === 0) throw new Error("لم يتم استلام الناتج");
    }

    // Step 3 — mark COMPLETED, store outputs.
    await fetch(`/api/generations/${generationId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        status:     "COMPLETED",
        outputs:    data,
        durationMs: Math.round(performance.now() - started),
      }),
    }).catch(() => {});

    return {
      result: data as never,
      generationId,
      endpoint: cfg.endpoint,
      modelId:  tool.id,
      credits:  tool.credits,
    };
  } catch (err) {
    // FAILED → server-side auto-refund.
    const message = err instanceof Error ? err.message : String(err);
    await fetch(`/api/generations/${generationId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        status:       "FAILED",
        errorMessage: message,
        durationMs:   Math.round(performance.now() - started),
      }),
    }).catch(() => {});
    throw err;
  }
}

// ── helpers ─────────────────────────────────────────────────────────────

/** MuAPI fields that are documented as `string[]`. When the form sends
 *  a single string we wrap it in an array so the model accepts it.
 *  (Some Flux Kontext / nano-banana edit endpoints reject `image_url`
 *  and only take `images_list`. Same goes for seedance-v2.0-video-edit
 *  which expects `video_urls`.) */
const ARRAY_FIELDS = new Set([
  "images_list",
  "image_urls",
  "video_files",
  "video_urls",
  "audio_files",
  "reference_images",
]);

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

    // Array-typed targets (images_list / video_files / …) auto-wrap
    // single strings AND merge multiple inputs that map to the same
    // target. e.g. Edit Image's tool maps both `image` and `ref` to
    // `images_list`, so a final payload becomes
    //   { images_list: [<image>, <ref>] }
    // rather than just the second one overwriting the first.
    if (ARRAY_FIELDS.has(muapiKey)) {
      const existing = out[muapiKey];
      const incoming = Array.isArray(raw) ? raw : [raw];
      if (Array.isArray(existing)) {
        out[muapiKey] = [...existing, ...incoming];
      } else {
        out[muapiKey] = incoming;
      }
    } else {
      out[muapiKey] = raw;
    }
  }

  return out;
}

/** Does this tool have a working backend (MuAPI OR custom)? */
export function isExecutable(tool: Tool): boolean {
  if (tool.customRunner?.endpoint) return true;
  return Boolean(tool.muapi && tool.muapi.models.length > 0);
}
