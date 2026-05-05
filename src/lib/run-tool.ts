// ════════════════════════════════════════════════════════════════
// Client-side helper: run a tool end-to-end
// ════════════════════════════════════════════════════════════════
// Three modes are supported:
//
//   • runTool({toolId, inputs, executor})        — fully custom executor
//                                                  (you call MuAPI yourself)
//
//   • runMuapiTool({toolId, endpoint, payload})  — submit to muapi + poll
//                                                  + book-keeping in one call
//
//   • startGeneration / finalizeGeneration       — low-level primitives
//                                                  for advanced flows
//
// Book-keeping flow (always the same):
//   1. POST /api/generations              → deducts credits, returns generation.id
//   2. (caller handles AI work)
//   3. PATCH /api/generations/{id}        → mark COMPLETED/FAILED, store outputs
//                                           — auto-refund on FAILED.

import { useUserStore }   from "@/stores/useUserStore";
import { submitAndPoll }  from "@/lib/muapi";
import type { MuapiResult, PollOptions } from "@/lib/muapi";

export type RunToolStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface RunToolStartResult {
  generationId:   string;
  creditsBalance: number;
}

export interface RunToolFinalizeArgs {
  generationId:  string;
  status:        "COMPLETED" | "FAILED" | "PROCESSING";
  outputs?:      unknown;
  errorMessage?: string;
  durationMs?:   number;
  muapiJobId?:   string;
}

/**
 * Starts a generation: deducts credits + creates a PENDING row server-side.
 * Throws on insufficient credits or any non-2xx.
 */
export async function startGeneration(params: {
  toolId:    string;
  inputs:    Record<string, unknown>;
  /** optional override of the default credit cost (when known up-front via cost calc) */
  overrideCredits?: number;
}): Promise<RunToolStartResult> {
  const res = await fetch("/api/generations", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "فشل بدء العملية");
  }

  if (typeof data.creditsBalance === "number") {
    useUserStore.getState().setBalance(data.creditsBalance);
  }

  return {
    generationId:   data.generation.id,
    creditsBalance: data.creditsBalance,
  };
}

/** Marks a generation COMPLETED/FAILED/PROCESSING. On FAILED credits are auto-refunded. */
export async function finalizeGeneration(args: RunToolFinalizeArgs): Promise<void> {
  const { generationId, ...rest } = args;
  await fetch(`/api/generations/${generationId}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(rest),
  });

  if (rest.status === "FAILED") {
    await useUserStore.getState().fetchUser();
  }
}

/**
 * Run a tool with a custom executor. If the executor throws, the
 * generation is marked FAILED (credits refunded).
 */
export async function runTool<T>(params: {
  toolId:   string;
  inputs:   Record<string, unknown>;
  executor: (generationId: string) => Promise<T>;
}): Promise<{ result: T; generationId: string }> {
  const started = performance.now();
  const { generationId } = await startGeneration(params);

  try {
    const result = await params.executor(generationId);
    await finalizeGeneration({
      generationId,
      status:     "COMPLETED",
      outputs:    result as unknown,
      durationMs: Math.round(performance.now() - started),
    });
    return { result, generationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finalizeGeneration({
      generationId,
      status:       "FAILED",
      errorMessage: message,
      durationMs:   Math.round(performance.now() - started),
    }).catch(() => {});
    throw err;
  }
}

/**
 * Run a tool that just calls a muapi endpoint and waits for the result.
 * This is the path 90% of tools should use.
 */
export async function runMuapiTool(params: {
  toolId:   string;
  /** muapi task slug, e.g. "flux-schnell-image" */
  endpoint: string;
  /** form values, must match the model's input schema */
  payload:  Record<string, unknown>;
  /** what we save in the DB as `inputs` (defaults to payload) */
  inputsForDb?: Record<string, unknown>;
  /** when supplied, overrides the static credit cost from tools.ts */
  overrideCredits?: number;
  pollOptions?: PollOptions;
}): Promise<{ result: MuapiResult; generationId: string }> {
  const started = performance.now();
  const { generationId } = await startGeneration({
    toolId: params.toolId,
    inputs: params.inputsForDb ?? params.payload,
    overrideCredits: params.overrideCredits,
  });

  try {
    let muapiJobId: string | undefined;
    const result = await submitAndPoll(
      { endpoint: params.endpoint, payload: params.payload },
      {
        ...params.pollOptions,
        onRequestId: (id) => { muapiJobId = id; },
        onStatus:    (status, raw) => {
          // First "processing" tick → mark our row as PROCESSING (best-effort)
          if (status === "processing" || status === "running") {
            void finalizeGeneration({
              generationId,
              status:     "PROCESSING",
              muapiJobId,
            }).catch(() => {});
          }
          params.pollOptions?.onStatus?.(status, raw);
        },
      },
    );

    await finalizeGeneration({
      generationId,
      status:     "COMPLETED",
      outputs:    result as unknown,
      durationMs: Math.round(performance.now() - started),
      muapiJobId: result.requestId ?? muapiJobId,
    });

    return { result, generationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finalizeGeneration({
      generationId,
      status:       "FAILED",
      errorMessage: message,
      durationMs:   Math.round(performance.now() - started),
    }).catch(() => {});
    throw err;
  }
}
