// ════════════════════════════════════════════════════════════════
// Server-side MuAPI helper: submit + poll a single prediction
// ════════════════════════════════════════════════════════════════
// Mirrors `submitAndPoll` from src/lib/muapi.ts but runs on the
// server (no auth-token shenanigans, direct calls to api.muapi.ai
// using the env-side MU_API_KEY). Used by /api/audio/* routes that
// wrap MuAPI audio/music endpoints — each route receives the tool's
// inputs from the client, kicks off a MuAPI prediction, polls until
// it completes, and returns the final result in a single response.

const MUAPI_BASE = "https://api.muapi.ai/api/v1";

export interface MuapiSubmitOpts {
  endpoint: string;
  payload:  Record<string, unknown>;
  apiKey:   string;
  /** Defaults to 5 minutes. Music gen sometimes runs ~2 min. */
  timeoutMs?: number;
  /** How often we poll for the result. Default 2 s. */
  pollMs?:    number;
}

export interface MuapiResult {
  requestId?: string;
  status?:    string;
  output?:    unknown;
  outputs?:   unknown[];
  url?:       string;
  urls?:      string[];
  error?:     string;
  detail?:    unknown;
  raw:        Record<string, unknown>;
}

export async function submitAndPollServer(opts: MuapiSubmitOpts): Promise<MuapiResult> {
  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const pollMs    = opts.pollMs    ?? 2_000;

  // 1. Submit the prediction.
  const submitRes = await fetch(`${MUAPI_BASE}/${opts.endpoint}`, {
    method:  "POST",
    headers: {
      "x-api-key":    opts.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts.payload),
  });

  const submitText = await submitRes.text();
  let submitJson: Record<string, unknown> = {};
  try { submitJson = JSON.parse(submitText); } catch { /* ignore */ }

  if (!submitRes.ok) {
    // MuAPI returns Pydantic-style validation errors as { detail: [...] }
    const message =
      typeof submitJson.detail === "string" ? submitJson.detail :
      Array.isArray(submitJson.detail)      ? submitJson.detail.map((d: unknown) => {
        if (typeof d === "object" && d !== null && "msg" in d) return String((d as { msg: unknown }).msg);
        return String(d);
      }).join("؛ ") :
      submitText.slice(0, 300) || `MuAPI error ${submitRes.status}`;
    throw new Error(message);
  }

  const requestId = String(submitJson.request_id ?? submitJson.requestId ?? "");
  if (!requestId) {
    // Some endpoints return the result inline (synchronous models).
    return { ...submitJson, raw: submitJson } as MuapiResult;
  }

  // 2. Poll for the result.
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const r = await fetch(`${MUAPI_BASE}/predictions/${requestId}/result`, {
      method:  "GET",
      headers: { "x-api-key": opts.apiKey },
    });
    const text = await r.text();
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(text); } catch { /* ignore */ }
    const status = String(body.status ?? "").toLowerCase();
    if (status === "completed" || status === "succeeded" || status === "success") {
      return { ...body, requestId, raw: body } as MuapiResult;
    }
    if (status === "failed" || status === "error") {
      const errMsg = String(body.error ?? body.detail ?? "MuAPI prediction failed");
      throw new Error(errMsg);
    }
  }
  throw new Error(`انتهت المهلة (${Math.round(timeoutMs / 1000)}s) قبل اكتمال التوليد`);
}

/**
 * Pull the first usable URL out of a MuAPI result (the shape varies by
 * model — some put it in `url`, some in `urls[0]`, some in `outputs[]`).
 */
export function pickResultUrl(r: MuapiResult): string | null {
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && typeof r.urls[0] === "string" && r.urls[0]) return r.urls[0];
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "url" in first) {
      return String((first as { url: unknown }).url ?? "") || null;
    }
  }
  if (r.output && typeof r.output === "object" && "url" in r.output) {
    return String((r.output as { url: unknown }).url ?? "") || null;
  }
  if (r.output && typeof r.output === "string") return r.output;
  return null;
}
