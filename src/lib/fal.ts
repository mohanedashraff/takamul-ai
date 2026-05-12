// ════════════════════════════════════════════════════════════════
// fal.ai client — Flux LoRA training + inference
// ════════════════════════════════════════════════════════════════
// Thin server-side wrapper around fal.ai's queue API. Used to power
// real Soul ID character training (replaces the prior "trained: true
// after 3 minutes" placeholder).
//
// fal.ai exposes a queue-based job system:
//   1. POST /<model>           → returns { request_id, status_url, ... }
//   2. GET  <status_url>       → returns { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "ERROR", ... }
//   3. GET  /<model>/requests/{request_id} → returns the final response payload
//
// Auth: header `Authorization: Key {KEY_ID}:{KEY_SECRET}` — same shape
// the user pastes into FAL_KEY env var.
//
// Models we use:
//   • fal-ai/flux-lora-fast-training — trains a Flux LoRA in ~5 min
//     from 4-20 images (preferred for Soul ID).
//   • fal-ai/flux-lora — runs inference with a trained LoRA.

const QUEUE_BASE = "https://queue.fal.run";

export interface FalSubmitResponse {
  request_id:    string;
  /** Full status URL fal returns (preferred for polling). */
  status_url?:   string;
  /** Full response URL once the request completes. */
  response_url?: string;
  /** Model name path (so the caller can build their own URLs if status_url is missing). */
  gateway_request_id?: string;
}

export type FalStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "ERROR";

export interface FalStatusResponse {
  status:        FalStatus;
  request_id:    string;
  /** Set when status is ERROR — short error text. */
  error?:        string | { message?: string };
  /** Queue position when IN_QUEUE. */
  queue_position?: number;
  /** Stream of log lines (strings); fal includes these once IN_PROGRESS. */
  logs?:         { message: string; timestamp?: string }[];
}

/** Generic FAL response — model-specific shape lives in the caller. */
export type FalResultEnvelope<T> = T & { request_id?: string };

function falKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY missing on server");
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    "Authorization": `Key ${falKey()}`,
    "Content-Type":  "application/json",
  };
}

/**
 * Submit a fal.ai job to the queue. The returned request_id is what
 * the caller persists — they then poll status / fetch result with it.
 */
export async function falSubmit<TInput extends Record<string, unknown>>(
  modelPath: string,                          // e.g. "fal-ai/flux-lora-fast-training"
  input:     TInput,
): Promise<FalSubmitResponse> {
  const url = `${QUEUE_BASE}/${modelPath}`;
  const res = await fetch(url, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(input),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`fal.ai submit failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  return await res.json() as FalSubmitResponse;
}

/** Poll fal.ai for a job's current status. Safe to call repeatedly. */
export async function falStatus(modelPath: string, requestId: string): Promise<FalStatusResponse> {
  const url = `${QUEUE_BASE}/${modelPath}/requests/${encodeURIComponent(requestId)}/status?logs=1`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`fal.ai status failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  return await res.json() as FalStatusResponse;
}

/** Fetch the final result for a COMPLETED job. The shape is model-specific. */
export async function falResult<TResult>(modelPath: string, requestId: string): Promise<FalResultEnvelope<TResult>> {
  const url = `${QUEUE_BASE}/${modelPath}/requests/${encodeURIComponent(requestId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`fal.ai result fetch failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  return await res.json() as FalResultEnvelope<TResult>;
}

// ── Flux LoRA training helpers ────────────────────────────────────

export interface FluxLoraTrainingResult {
  /** The trained LoRA weights — pass this URL to flux-lora inference. */
  diffusers_lora_file: { url: string; file_size?: number; content_type?: string; file_name?: string };
  /** Optional config the user can re-use. */
  config_file?:        { url: string };
  /** Token to use in the prompt to invoke the LoRA's identity. */
  trigger_word?:       string;
}

/**
 * Submit a Soul ID training job. We use Flux LoRA Fast Training because:
 *   - It's the cheapest (~$2 per training).
 *   - It accepts a list of image URLs directly (no zip packing required).
 *   - Trained LoRA works with the same Flux family our other tools use.
 *
 * The reference platform's Soul ID flow trains on 5-20 photos. We
 * forward whatever the user uploaded (capped at 20).
 */
export async function falStartFluxLoraTraining(opts: {
  imageUrls:    string[];
  /** Trigger word that the user types in the prompt to invoke this
   *  identity. Defaults to "TOK" — the model's documented default. */
  triggerWord?: string;
  /** Step count — more = better identity capture but longer/pricier. */
  steps?:       number;
}): Promise<FalSubmitResponse> {
  if (!opts.imageUrls || opts.imageUrls.length < 4) {
    throw new Error("Need at least 4 images to train a LoRA");
  }
  return falSubmit("fal-ai/flux-lora-fast-training", {
    images_data_url: opts.imageUrls.slice(0, 20),
    trigger_word:    opts.triggerWord ?? "TOK",
    steps:           opts.steps ?? 1000,
    create_masks:    true,           // auto-segment subjects from background
    is_style:        false,          // identity training, not style transfer
  });
}

/** Convenience: poll the training status. */
export function falTrainingStatus(requestId: string) {
  return falStatus("fal-ai/flux-lora-fast-training", requestId);
}

/** Convenience: fetch the trained LoRA artifact once status === COMPLETED. */
export function falTrainingResult(requestId: string) {
  return falResult<FluxLoraTrainingResult>("fal-ai/flux-lora-fast-training", requestId);
}

// ── Flux LoRA inference (use a trained Soul ID) ──────────────────

export interface FluxLoraInferenceInput {
  prompt:           string;
  loras:            { path: string; scale?: number }[];
  /** Defaults: 1024×1024, 28 steps. */
  image_size?:      "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9" | { width: number; height: number };
  num_inference_steps?: number;
  guidance_scale?:  number;
  negative_prompt?: string;
  num_images?:      number;
  seed?:            number;
}

export interface FluxLoraInferenceResult {
  images: { url: string; width?: number; height?: number; content_type?: string }[];
  prompt: string;
  seed?:  number;
}

/** Submit a flux-lora inference call (uses the trained Soul ID LoRA).
 *  The cast is safe — FluxLoraInferenceInput's fields are all
 *  JSON-serialisable so the shape satisfies Record<string, unknown>
 *  at runtime; TypeScript just can't prove it without an explicit
 *  index signature. */
export async function falStartFluxLoraInference(input: FluxLoraInferenceInput): Promise<FalSubmitResponse> {
  return falSubmit("fal-ai/flux-lora", input as unknown as Record<string, unknown>);
}

export function falLoraInferenceStatus(requestId: string) {
  return falStatus("fal-ai/flux-lora", requestId);
}

export function falLoraInferenceResult(requestId: string) {
  return falResult<FluxLoraInferenceResult>("fal-ai/flux-lora", requestId);
}

// ── Convenience: submit-and-wait wrapper ─────────────────────────
//
// Polls the queue every `intervalMs` until COMPLETED or ERROR. Used
// when the caller can afford to wait inline (e.g. inference). Long
// jobs like training should use the explicit submit + status pattern.

/** Map our app's aspect-ratio enum onto fal.ai's `image_size` enum.
 *  fal accepts a fixed set of named sizes for flux-lora inference —
 *  closest-match snapping keeps Soul ID generations looking right
 *  without forcing the user to know fal's naming.
 *
 *  fal enums:
 *    square_hd | square
 *    portrait_4_3 | portrait_16_9
 *    landscape_4_3 | landscape_16_9 */
export type FalImageSize =
  | "square_hd" | "square"
  | "portrait_4_3" | "portrait_16_9"
  | "landscape_4_3" | "landscape_16_9";

export function aspectToFalImageSize(
  aspect: string | null | undefined,
): FalImageSize {
  if (!aspect || aspect === "auto") return "square_hd";
  // Normalise "1:1" / "1x1" / "1:1 square" → numeric ratio.
  const m = String(aspect).match(/(\d+(?:\.\d+)?)[:xX](\d+(?:\.\d+)?)/);
  if (!m) return "square_hd";
  const w = parseFloat(m[1]!);
  const h = parseFloat(m[2]!);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return "square_hd";
  }
  const r = w / h;
  // Snap to the nearest fal preset by log-distance.
  const presets: Array<[FalImageSize, number]> = [
    ["portrait_16_9",  9 / 16],
    ["portrait_4_3",   3 / 4 ],
    ["square_hd",      1     ],
    ["landscape_4_3",  4 / 3 ],
    ["landscape_16_9", 16 / 9],
  ];
  let best: FalImageSize = "square_hd";
  let bestDist = Infinity;
  for (const [name, target] of presets) {
    const d = Math.abs(Math.log(r / target));
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

export async function falSubmitAndWait<TResult>(
  modelPath: string,
  input:     Record<string, unknown>,
  opts:      { intervalMs?: number; maxWaitMs?: number } = {},
): Promise<FalResultEnvelope<TResult>> {
  const intervalMs = opts.intervalMs ?? 1500;
  const maxWaitMs  = opts.maxWaitMs  ?? 4 * 60 * 1000;     // 4 min default
  const submitted  = await falSubmit(modelPath, input);
  const startedAt  = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - startedAt > maxWaitMs) {
      throw new Error("fal.ai job timed out");
    }
    const status = await falStatus(modelPath, submitted.request_id);
    if (status.status === "COMPLETED") {
      return await falResult<TResult>(modelPath, submitted.request_id);
    }
    if (status.status === "ERROR") {
      const msg = typeof status.error === "string"
        ? status.error
        : status.error?.message ?? "Unknown fal.ai error";
      throw new Error(`fal.ai job failed: ${msg}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
