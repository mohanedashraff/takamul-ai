"use client";

/* ════════════════════════════════════════════════════════════════
   CanvasWorkspace — visual tool-chaining flow chart
   ════════════════════════════════════════════════════════════════
   Built on @xyflow/react. Each node is a Yilow tool; edges connect
   one tool's output URL to another tool's input. The user composes a
   pipeline (e.g. text-to-image → upscale → motion-transfer → lipsync)
   visually and clicks Run.

   The pipeline JSON persists to localStorage and (when the user is
   signed in) to /api/canvas via the dedicated endpoint. The
   underlying tool catalogue is identical to the one used in the
   dashboard — no separate registry. */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type Connection,
  addEdge, useNodesState, useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Play, Save, Trash2, Loader2 } from "lucide-react";
import { ALL_TOOLS_FLAT } from "@/lib/data/tools";
import type { Tool } from "@/lib/data/tools";

interface ToolNodeData extends Record<string, unknown> {
  tool:     Tool;
  output?:  string;            // last URL produced for this node
  inputs:   Record<string, string>;
  status:   "idle" | "queued" | "running" | "done" | "failed";
  error?:   string;
}

const STORAGE_KEY = "yilow.canvas.v1";

export function CanvasWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ToolNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [palette, setPalette]            = useState(false);
  const [running, setRunning]            = useState(false);
  const [searchQ, setSearchQ]            = useState("");

  // Hydrate from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { nodes: Node<ToolNodeData>[]; edges: Edge[] };
      // Re-link the Tool object since we don't persist the function reference.
      const rehydrated = parsed.nodes.map((n) => {
        const tool = ALL_TOOLS_FLAT.find((t) => t.id === (n.data as { toolId?: string }).toolId);
        if (!tool) return null;
        return { ...n, data: { ...n.data, tool, status: "idle" as const } };
      }).filter(Boolean) as Node<ToolNodeData>[];
      setNodes(rehydrated);
      setEdges(parsed.edges);
    } catch (e) {
      console.warn("[canvas] hydration failed", e);
    }
  }, [setNodes, setEdges]);

  // Persist on change (debounced via React batching).
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    try {
      const safe = {
        nodes: nodes.map((n) => ({
          ...n,
          data: { ...n.data, toolId: n.data.tool.id, tool: undefined },
        })),
        edges,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch { /* localStorage full / disabled — non-fatal */ }
  }, [nodes, edges]);

  const filteredTools = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return ALL_TOOLS_FLAT.filter((t) => {
      if (!q) return true;
      return t.id.includes(q) || t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    }).slice(0, 100);
  }, [searchQ]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges],
  );

  function addNode(tool: Tool) {
    const id = `n${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "default",
        position: { x: 100 + (ns.length % 3) * 280, y: 60 + Math.floor(ns.length / 3) * 160 },
        data: { tool, inputs: {}, status: "idle" },
        style: {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          color: "#fff",
          padding: 12,
          minWidth: 220,
          fontSize: 13,
        },
      },
    ]);
    setPalette(false);
  }

  async function runPipeline() {
    if (running) return;
    setRunning(true);
    try {
      // Topological order: find roots (no incoming edge), then BFS.
      const incoming = new Map<string, number>();
      nodes.forEach((n) => incoming.set(n.id, 0));
      edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1));
      const queue = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);
      const order: string[] = [];
      const seen = new Set<string>();
      while (queue.length) {
        const id = queue.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        order.push(id);
        edges.filter((e) => e.source === id).forEach((e) => {
          incoming.set(e.target, (incoming.get(e.target) ?? 0) - 1);
          if ((incoming.get(e.target) ?? 0) <= 0) queue.push(e.target);
        });
      }

      // Walk the pipeline, threading outputs into downstream inputs.
      const outputs = new Map<string, string>();
      for (const nodeId of order) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Mark running.
        setNodes((ns) => ns.map((n) => n.id === nodeId
          ? { ...n, data: { ...n.data, status: "running" } } : n));

        // Build inputs: form values + any URL piped in from a parent.
        const inputs: Record<string, unknown> = { ...node.data.inputs };
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        for (const e of incomingEdges) {
          const parentUrl = outputs.get(e.source);
          if (!parentUrl) continue;
          // Pick the first upload-style input on the child as the slot.
          const slot = node.data.tool.inputs.find(
            (i) => i.type === "upload" || i.type === "multi-upload",
          );
          if (slot) inputs[slot.id] = parentUrl;
        }

        try {
          const start = await fetch("/api/generations", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ toolId: node.data.tool.id, inputs, source: "canvas" }),
          });
          const startData = await start.json();
          if (!start.ok) throw new Error(startData.error || "submit failed");
          const genId = startData.generation.id as string;

          // Poll until done.
          const deadline = Date.now() + 5 * 60 * 1000;
          let finalUrl: string | undefined;
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 3000));
            const pr = await fetch(`/api/generations/${genId}`);
            if (!pr.ok) continue;
            const pd = await pr.json();
            const s = pd?.generation?.status;
            if (s === "COMPLETED") {
              finalUrl = pd.generation.outputs?.url;
              break;
            }
            if (s === "FAILED") throw new Error(pd.generation.errorMessage || "generation failed");
          }
          if (!finalUrl) throw new Error("timed out");
          outputs.set(nodeId, finalUrl);
          setNodes((ns) => ns.map((n) => n.id === nodeId
            ? { ...n, data: { ...n.data, status: "done", output: finalUrl } } : n));
        } catch (err) {
          setNodes((ns) => ns.map((n) => n.id === nodeId
            ? { ...n, data: { ...n.data, status: "failed", error: err instanceof Error ? err.message : "failed" } } : n));
          break; // Halt pipeline on first failure.
        }
      }
    } finally {
      setRunning(false);
    }
  }

  function clearCanvas() {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Render node body content via the node's `data` (since custom node
  // types weren't passed to ReactFlow — we use the default node and
  // mutate label via JSX in the data object).
  const nodesWithLabel = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      label: (
        <div className="text-right space-y-1">
          <div className="text-sm font-medium">{n.data.tool.title}</div>
          <div className="text-[11px] text-gray-400">{n.data.tool.id}</div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={
              n.data.status === "done"   ? "text-emerald-400" :
              n.data.status === "running" ? "text-blue-400 animate-pulse" :
              n.data.status === "failed"  ? "text-red-400" :
              "text-gray-500"
            }>
              {n.data.status === "idle"   ? "جاهز" :
               n.data.status === "running" ? "شغال…" :
               n.data.status === "done"    ? "تم ✓" :
               n.data.status === "failed"  ? `فشل: ${n.data.error}` :
               n.data.status}
            </span>
          </div>
          {n.data.output && (
            <a href={n.data.output} target="_blank" rel="noreferrer"
               className="text-[11px] text-blue-400 hover:underline">عرض الناتج</a>
          )}
        </div>
      ),
    },
  }));

  return (
    <div className="h-[calc(100vh-5rem)] relative">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={() => setPalette(true)}
          className="inline-flex items-center gap-1.5 bg-white text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/90"
        >
          <Plus className="w-3.5 h-3.5" /> أداة
        </button>
        <button
          onClick={runPipeline}
          disabled={running || nodes.length === 0}
          className="inline-flex items-center gap-1.5 bg-emerald-500 text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-emerald-400 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "جاري التشغيل" : "تشغيل الـpipeline"}
        </button>
        <button
          onClick={() => fetch("/api/canvas", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ nodes, edges }),
          }).catch(() => {})}
          className="inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.10] text-xs px-3 py-2 rounded-lg"
        >
          <Save className="w-3.5 h-3.5" /> حفظ
        </button>
        <button
          onClick={clearCanvas}
          className="inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-red-500/20 hover:text-red-400 text-xs px-3 py-2 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Flow */}
      <ReactFlow
        nodes={nodesWithLabel as never}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true, style: { stroke: "rgba(255,255,255,0.4)" } }}
      >
        <Background gap={20} color="rgba(255,255,255,0.06)" />
        <MiniMap pannable zoomable maskColor="rgba(0,0,0,0.6)"
                  nodeColor="rgba(255,255,255,0.2)" />
        <Controls position="bottom-left" />
      </ReactFlow>

      {/* Palette modal */}
      {palette && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setPalette(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث عن أداة…"
                autoFocus
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => addNode(t)}
                    className="text-right p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">{t.desc}</div>
                    <div className="text-[10px] text-gray-600 mt-1">{t.id} · {t.credits}c</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
