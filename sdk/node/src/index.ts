/**
 * @yilow/client — Yilow.ai Node SDK
 * --------------------------------------------------------------
 * Programmatic access to every tool in the Yilow workspace.
 *
 *   import { Yilow } from "@yilow/client";
 *   const yilow = new Yilow({ apiKey: process.env.YILOW_API_KEY! });
 *   const job = await yilow.generate("cinema-studio", { prompt: "…" });
 *   const result = await yilow.waitForResult(job.generationId);
 *
 * The SDK is intentionally thin — every method is one fetch + a
 * helper. No magic, no hidden retries. Use `pollUntil` if you want
 * full control over the polling loop.
 */

export interface YilowOptions {
  apiKey:   string;
  baseUrl?: string;   // defaults to https://yilow.ai
  fetchImpl?: typeof fetch;
}

export interface GenerateResponse {
  generationId: string;
  status:       string;
  outputs?:     Record<string, unknown>;
}

export interface ToolDescriptor {
  id:          string;
  title:       string;
  desc:        string;
  credits:     number;
  category:    string;
  inputs:      ToolInputDescriptor[];
  customRoute?: string;
}

export interface ToolInputDescriptor {
  id:           string;
  type:         string;
  label?:       string;
  required?:    boolean;
  options?:     Array<{ value: string; label: string }>;
  defaultValue?: unknown;
  min?:         number;
  max?:         number;
}

export class YilowError extends Error {
  status: number;
  body:   unknown;
  constructor(status: number, body: unknown) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Yilow API error (${status})`;
    super(msg);
    this.status = status;
    this.body   = body;
  }
}

export class Yilow {
  private apiKey:    string;
  private baseUrl:   string;
  private fetchImpl: typeof fetch;

  constructor(opts: YilowOptions) {
    if (!opts.apiKey) throw new Error("Yilow: apiKey is required");
    this.apiKey    = opts.apiKey;
    this.baseUrl   = (opts.baseUrl || "https://yilow.ai").replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /** List all tools available to your workspace. */
  async tools(): Promise<ToolDescriptor[]> {
    const r = await this.fetchImpl(`${this.baseUrl}/api/mcp/catalog`, {
      headers: this.headers(),
    });
    const data = await this.unwrap<{ tools: ToolDescriptor[] }>(r);
    return data.tools;
  }

  /** Submit a tool job. Returns the generation id — call
   *  `waitForResult` to block until it completes, or poll yourself. */
  async generate(toolId: string, inputs: Record<string, unknown>): Promise<GenerateResponse> {
    const r = await this.fetchImpl(`${this.baseUrl}/api/generations`, {
      method:  "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body:    JSON.stringify({ toolId, inputs, source: "sdk-node" }),
    });
    const data = await this.unwrap<{ generation: { id: string; status: string; outputs?: Record<string, unknown> } }>(r);
    return {
      generationId: data.generation.id,
      status:       data.generation.status,
      outputs:      data.generation.outputs,
    };
  }

  /** Fetch the current state of a generation. */
  async generation(id: string): Promise<GenerateResponse> {
    const r = await this.fetchImpl(`${this.baseUrl}/api/generations/${encodeURIComponent(id)}`, {
      headers: this.headers(),
    });
    const data = await this.unwrap<{ generation: { id: string; status: string; outputs?: Record<string, unknown> } }>(r);
    return {
      generationId: data.generation.id,
      status:       data.generation.status,
      outputs:      data.generation.outputs,
    };
  }

  /** Poll until the generation finishes (COMPLETED / FAILED) or a
   *  timeout is hit. Default 5 min cap, 3-sec poll interval. */
  async waitForResult(
    id: string,
    opts?: { timeoutMs?: number; pollMs?: number; onTick?: (state: GenerateResponse) => void },
  ): Promise<GenerateResponse> {
    const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000;
    const pollMs    = opts?.pollMs    ?? 3_000;
    const deadline  = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const state = await this.generation(id);
      opts?.onTick?.(state);
      if (state.status === "COMPLETED" || state.status === "FAILED") return state;
      await new Promise((res) => setTimeout(res, pollMs));
    }
    throw new YilowError(408, { error: `Timed out after ${Math.round(timeoutMs / 1000)}s` });
  }

  /** Convenience: generate + wait for result in one call. */
  async run(toolId: string, inputs: Record<string, unknown>): Promise<GenerateResponse> {
    const job = await this.generate(toolId, inputs);
    return this.waitForResult(job.generationId);
  }

  /** Account / credit balance. */
  async me(): Promise<{ email: string; plan: string; creditsBalance: number }> {
    const r = await this.fetchImpl(`${this.baseUrl}/api/me`, { headers: this.headers() });
    return this.unwrap(r);
  }

  // ── private ───────────────────────────────────────────────────
  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async unwrap<T>(r: Response): Promise<T> {
    const text = await r.text();
    let body: unknown;
    try { body = text ? JSON.parse(text) : {}; } catch { body = text; }
    if (!r.ok) throw new YilowError(r.status, body);
    return body as T;
  }
}

export default Yilow;
