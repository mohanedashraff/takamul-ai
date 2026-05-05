// ════════════════════════════════════════════════════════════════
// Replicate — generic predictions client
// ════════════════════════════════════════════════════════════════
// Replicate exposes thousands of models behind one REST API. We use
// it for tasks MuAPI doesn't cover: audio separation, audio
// enhancement, etc. Set REPLICATE_API_TOKEN in .env.

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

const BASE = "https://api.replicate.com/v1";

export interface RunOpts {
  /** Model identifier — either a `model:version` string or just the
   *  full version id (40-char hex). */
  version: string;
  /** Input payload — passed verbatim as `input` to the model. */
  input:   Record<string, unknown>;
  /** Total wait time before giving up (ms). Defaults to 5 min. */
  timeoutMs?: number;
  /** Polling interval (ms). Defaults to 1500. */
  pollMs?: number;
}

/** Submit a prediction, poll until it finishes, return its `output`. */
export async function run(opts: RunOpts): Promise<unknown> {
  if (!isReplicateConfigured()) {
    throw new Error("Replicate not configured (REPLICATE_API_TOKEN missing)");
  }
  const token   = process.env.REPLICATE_API_TOKEN!;
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000;
  const pollMs  = opts.pollMs    ?? 1_500;

  // Split "owner/model:version" into the components Replicate wants.
  // If only a 40-char hex is provided, use the /predictions endpoint.
  let createUrl = `${BASE}/predictions`;
  let bodyPayload: Record<string, unknown>;

  if (opts.version.includes(":")) {
    // Format: owner/model:version
    bodyPayload = { version: opts.version.split(":")[1], input: opts.input };
  } else if (opts.version.includes("/")) {
    // Format: owner/model — fetch latest version
    createUrl   = `${BASE}/models/${opts.version}/predictions`;
    bodyPayload = { input: opts.input };
  } else {
    bodyPayload = { version: opts.version, input: opts.input };
  }

  const create = await fetch(createUrl, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer:         "wait=0",   // return immediately, we poll
    },
    body: JSON.stringify(bodyPayload),
  });

  const created = await create.json().catch(() => ({}));
  if (!create.ok) {
    throw new Error(created.detail || created.title || `Replicate create failed (${create.status})`);
  }
  const id = created.id as string | undefined;
  if (!id) throw new Error("Replicate did not return a prediction id");

  // Poll for completion.
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await wait(pollMs);
    const r = await fetch(`${BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json().catch(() => ({}));
    const status = data.status as string | undefined;
    if (status === "succeeded") return data.output;
    if (status === "failed" || status === "canceled") {
      throw new Error(data.error || `Replicate ${status}`);
    }
    // status: starting | processing → keep polling
  }
  throw new Error("Replicate timed out");
}

function wait(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}
