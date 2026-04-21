// ════════════════════════════════════════════════════════════════
// Client-side helper: run a tool end-to-end
// ════════════════════════════════════════════════════════════════
// Flow:
//   1. POST /api/generations              → deducts credits, gets generation.id
//   2. (optional) POST to MuAPI proxy     → actual AI processing
//   3. PATCH /api/generations/{id}        → mark COMPLETED/FAILED, store outputs
//
// Step 2 is intentionally pluggable: each tool page passes its own
// `executor` fn — that's where per-tool MuAPI integration lives.
// We stay out of that mess here; this just handles the book-keeping.

import { useUserStore } from "@/stores/useUserStore";

export type RunToolStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface RunToolStartResult {
  generationId: string;
  creditsBalance: number;
}

export interface RunToolFinalizeArgs {
  generationId: string;
  status: "COMPLETED" | "FAILED";
  outputs?: unknown;
  errorMessage?: string;
  durationMs?: number;
  muapiJobId?: string;
}

/**
 * Starts a generation: deducts credits + creates a PENDING row server-side.
 * Throws on insufficient credits or any non-2xx.
 */
export async function startGeneration(params: {
  toolId: string;
  inputs: Record<string, unknown>;
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

  // Optimistically sync credits in the UI
  if (typeof data.creditsBalance === "number") {
    useUserStore.getState().setBalance(data.creditsBalance);
  }

  return {
    generationId:   data.generation.id,
    creditsBalance: data.creditsBalance,
  };
}

/** Marks a generation COMPLETED or FAILED. On FAILED credits are auto-refunded. */
export async function finalizeGeneration(args: RunToolFinalizeArgs): Promise<void> {
  const { generationId, ...rest } = args;
  await fetch(`/api/generations/${generationId}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(rest),
  });

  // If refunded, pull fresh balance
  if (rest.status === "FAILED") {
    await useUserStore.getState().fetchUser();
  }
}

/**
 * Convenience wrapper around the full flow for simple tools.
 * If the executor throws, the generation is auto-marked FAILED (refund).
 */
export async function runTool<T>(params: {
  toolId: string;
  inputs: Record<string, unknown>;
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
