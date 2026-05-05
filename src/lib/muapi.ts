// ════════════════════════════════════════════════════════════════
// Client-side MuAPI helper
// ════════════════════════════════════════════════════════════════
// All requests go through our /api/v1/* and /api/app/* proxies — they
// inject the server-side MU_API_KEY so it never leaks to the browser.
//
// Public surface:
//   submitTask({ endpoint, payload })        → kicks off a generation
//   pollResult(requestId, opts)              → waits until completed/failed
//   submitAndPoll({ endpoint, payload }, …)  → both, with timeout
//   uploadFile(file, onProgress)             → upload binary, get URL back
//   calculateCost(taskName, payload)         → live credit price

export interface SubmitTaskParams {
  /** muapi endpoint slug, e.g. "flux-schnell-image", "kling-v2-1-i2v" */
  endpoint: string;
  payload:  Record<string, unknown>;
}

export interface SubmitTaskResult {
  request_id: string;
  // muapi may also echo back status / cost — we ignore those here.
  [k: string]: unknown;
}

export interface PollOptions {
  /** ms between polls. Defaults to 2000. */
  intervalMs?:    number;
  /** total time to wait before throwing. Defaults to 30 min. */
  timeoutMs?:     number;
  /** notify caller of intermediate status (PENDING → PROCESSING → …) */
  onStatus?:      (status: string, raw: unknown) => void;
  /** abort signal */
  signal?:        AbortSignal;
}

export interface MuapiResult {
  status:  "completed" | "failed" | string;
  outputs?: unknown;
  url?:    string;
  urls?:   string[];
  error?:  string;
  [k: string]: unknown;
}

/** Submit a generation task. Returns the muapi `request_id`. */
export async function submitTask(params: SubmitTaskParams): Promise<SubmitTaskResult> {
  const res = await fetch(`/api/v1/${params.endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(params.payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.error || data.detail)) || `Task submit failed (${res.status})`);
  }
  if (!data.request_id) {
    throw new Error("Upstream did not return a request_id");
  }
  return data as SubmitTaskResult;
}

/** Poll muapi for a result until completed/failed/timeout. */
export async function pollResult(
  requestId: string,
  opts: PollOptions = {},
): Promise<MuapiResult> {
  const intervalMs = opts.intervalMs ?? 2000;
  const timeoutMs  = opts.timeoutMs  ?? 30 * 60 * 1000;
  const deadline   = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (opts.signal?.aborted) throw new Error("Aborted");

    const res = await fetch(`/api/v1/predictions/${requestId}/result`, { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as MuapiResult;

    if (res.ok) {
      const status = String(data.status ?? "").toLowerCase();
      opts.onStatus?.(status, data);

      if (status === "completed" || status === "success" || status === "succeeded") {
        return { ...data, status: "completed" };
      }
      if (status === "failed" || status === "error") {
        throw new Error(data.error || "Generation failed");
      }
      // else: queued | processing | pending → keep polling
    } else if (res.status !== 202 && res.status !== 425 && res.status !== 404) {
      // 404 may legitimately mean "not yet visible" right after submit, so don't throw immediately
      const message = (data && (data.error as string)) || `Polling error (${res.status})`;
      if (Date.now() + intervalMs >= deadline) {
        throw new Error(message);
      }
    }

    await wait(intervalMs, opts.signal);
  }

  throw new Error("Polling timed out");
}

/** Submit a task and wait for its result. */
export async function submitAndPoll(
  task: SubmitTaskParams,
  opts: PollOptions & { onRequestId?: (id: string) => void } = {},
): Promise<MuapiResult & { requestId: string }> {
  const submitted = await submitTask(task);
  opts.onRequestId?.(submitted.request_id);
  const result = await pollResult(submitted.request_id, opts);
  return { ...result, requestId: submitted.request_id };
}

/** Upload a file to muapi storage. Returns the hosted URL. */
export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/upload_file");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = data.url || data.file_url || data.fileUrl;
          if (!url) return reject(new Error("Upload succeeded but no URL was returned"));
          resolve({ url });
        } else {
          reject(new Error(data.error || data.detail || `Upload failed (${xhr.status})`));
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Upload response parse error"));
      }
    };

    xhr.onerror   = () => reject(new Error("Upload network error"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** Live-pricing helper. Returns `{ credits, cost }` (credits = our internal currency). */
export async function calculateCost(
  taskName: string,
  payload:  Record<string, unknown>,
): Promise<{ credits: number; cost: number }> {
  const res = await fetch("/api/calculate-cost", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ task_name: taskName, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Cost calculation failed (${res.status})`);
  }
  return { credits: data.credits ?? 0, cost: data.cost ?? 0 };
}

// ── internals ─────────────────────────────────────────────────────────

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("Aborted"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Aborted"));
    }, { once: true });
  });
}
