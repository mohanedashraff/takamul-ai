// ════════════════════════════════════════════════════════════════
// Spaces / Workflow — graph executor
// ════════════════════════════════════════════════════════════════
// Walks a Spaces graph in topological order, executes each node
// (image / video / upscaler / assistant / upload / text), and pipes
// the output of upstream nodes into the inputs of downstream nodes
// based on edges.
//
// Each node type has a registered "executor" that:
//   1. reads the node's own form values + any inputs piped from
//      upstream
//   2. calls the right MuAPI endpoint (or chat API, or upload API)
//   3. returns its primary output URL/text — which then becomes
//      available to downstream nodes
//
// Errors short-circuit the path that depends on the failed node, but
// other independent branches keep running.

import type { Node, Edge } from "@xyflow/react";
import { runMuapiTool } from "@/lib/run-tool";
import { uploadFile, type MuapiResult } from "@/lib/muapi";

export type NodeStatus = "idle" | "running" | "success" | "error";

/** Output emitted by a node, ready to be piped into inputs of downstream nodes. */
export interface NodeOutput {
  /** "text" | "image" | "video" | "audio" — matches the port type */
  type: "text" | "image" | "video" | "audio" | "any";
  /** primary value (string for text, URL for media) */
  value: string;
}

export interface ExecCtx {
  /** Resolved inputs piped from upstream nodes (keyed by INPUT handle id). */
  inputs: Record<string, NodeOutput>;
  /** Notify status changes upstream so the canvas can repaint. */
  setStatus: (status: NodeStatus, extra?: { output?: string; error?: string }) => void;
}

export type NodeExecutor = (
  node: Node<Record<string, unknown>>,
  ctx: ExecCtx,
) => Promise<NodeOutput>;

const REGISTRY = new Map<string, NodeExecutor>();

/** Register a node executor for a given node type. */
export function registerExecutor(nodeType: string, exec: NodeExecutor) {
  REGISTRY.set(nodeType, exec);
}

export function hasExecutor(nodeType: string): boolean {
  return REGISTRY.has(nodeType);
}

// ── Graph walking ────────────────────────────────────────────────────

interface RunNodesParams {
  nodes:    Node<Record<string, unknown>>[];
  edges:    Edge[];
  /** When provided, only the named node + its dependencies are executed.
   *  Used by the per-node "Run" button on each card. */
  startId?: string;
  /** Hook fired right before a node starts (so the canvas can mark "running"). */
  onNodeStart?:  (nodeId: string) => void;
  /** Hook fired when a node finishes successfully. */
  onNodeDone?:   (nodeId: string, output: NodeOutput) => void;
  /** Hook fired when a node fails. */
  onNodeError?:  (nodeId: string, message: string) => void;
}

/**
 * Run the graph (or a subgraph rooted at startId).
 * Returns a map of nodeId → final output (only for nodes that ran successfully).
 */
export async function runGraph(params: RunNodesParams): Promise<Map<string, NodeOutput>> {
  const { nodes, edges } = params;
  const order = topologicalOrder(nodes, edges, params.startId);
  const outputs = new Map<string, NodeOutput>();
  const failed  = new Set<string>();

  for (const node of order) {
    const exec = REGISTRY.get(node.type ?? "");
    if (!exec) continue; // skip nodes without an executor (sticky notes, etc.)

    // Skip if any upstream dependency failed
    const upstream = edges.filter((e) => e.target === node.id);
    if (upstream.some((e) => failed.has(e.source))) {
      failed.add(node.id);
      continue;
    }

    // Build the inputs object: handleId → upstream output
    const inputs: Record<string, NodeOutput> = {};
    for (const edge of upstream) {
      const out = outputs.get(edge.source);
      const handle = edge.targetHandle ?? "in";
      if (out) inputs[handle] = out;
    }

    params.onNodeStart?.(node.id);
    try {
      const out = await exec(node, {
        inputs,
        setStatus: (status, extra) => {
          if (status === "success" && extra?.output) {
            params.onNodeDone?.(node.id, { type: "any", value: extra.output });
          } else if (status === "error" && extra?.error) {
            params.onNodeError?.(node.id, extra.error);
          }
        },
      });
      outputs.set(node.id, out);
      params.onNodeDone?.(node.id, out);
    } catch (err) {
      failed.add(node.id);
      const message = err instanceof Error ? err.message : "خطأ غير متوقع";
      params.onNodeError?.(node.id, message);
    }
  }

  return outputs;
}

// ── Topological sort ─────────────────────────────────────────────────

function topologicalOrder(
  nodes: Node[],
  edges: Edge[],
  startId?: string,
): Node[] {
  // If startId is given, restrict to its dependency closure.
  const wanted = startId ? closure(startId, edges) : new Set(nodes.map((n) => n.id));
  const restricted = nodes.filter((n) => wanted.has(n.id));
  const indeg = new Map<string, number>();
  for (const n of restricted) indeg.set(n.id, 0);
  for (const e of edges) {
    if (wanted.has(e.source) && wanted.has(e.target)) {
      indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
    }
  }
  const queue: Node[] = restricted.filter((n) => (indeg.get(n.id) ?? 0) === 0);
  const out: Node[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    out.push(n);
    for (const e of edges) {
      if (e.source !== n.id || !wanted.has(e.target)) continue;
      const next = (indeg.get(e.target) ?? 0) - 1;
      indeg.set(e.target, next);
      if (next === 0) {
        const target = restricted.find((x) => x.id === e.target);
        if (target) queue.push(target);
      }
    }
  }
  return out;
}

/** All nodes that the target depends on (transitively), including the target itself. */
function closure(targetId: string, edges: Edge[]): Set<string> {
  const visited = new Set<string>([targetId]);
  const stack   = [targetId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const e of edges) {
      if (e.target === cur && !visited.has(e.source)) {
        visited.add(e.source);
        stack.push(e.source);
      }
    }
  }
  return visited;
}

// ── Helpers exposed to executors ─────────────────────────────────────

/** Resolve a "prompt" input by combining node's own prompt with upstream text inputs. */
export function resolvePrompt(
  ownValue: unknown,
  inputs: Record<string, NodeOutput>,
  ...handleIds: string[]
): string {
  const parts: string[] = [];
  if (typeof ownValue === "string" && ownValue.trim()) parts.push(ownValue.trim());
  for (const id of handleIds) {
    const v = inputs[id];
    if (v?.type === "text" && v.value) parts.push(v.value);
  }
  return parts.join(" — ");
}

/** Extract the first usable URL from a MuAPI result. */
export function pickResultUrl(r: MuapiResult): string | null {
  if (typeof r.url === "string" && r.url) return r.url;
  if (Array.isArray(r.urls) && r.urls[0]) return r.urls[0];
  if (Array.isArray(r.outputs) && r.outputs.length) {
    const first = r.outputs[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "url" in first) {
      return (first as { url: string }).url;
    }
  }
  return null;
}

// re-export so node executors don't have to import from two places
export { runMuapiTool, uploadFile };
