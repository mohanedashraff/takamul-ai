"use client";

// ============================================================
// Takamul Spaces — Main Canvas Component
// The core infinite canvas with all node types, edges, and interactions
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type Connection,
  getOutgoers,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus, Undo2, Redo2, Play, ZoomIn, ZoomOut, Maximize2, Search, ArrowRight,
  Type, ImagePlus, Film, Volume2, Bot, Upload, List, StickyNote, ZoomIn as Upscale,
  Sparkles, ArrowDownToLine, Wand2, Wrench
} from "lucide-react";

// Nodes
import { TextNode } from "../nodes/TextNode";
import { ImageGeneratorNode } from "../nodes/ImageGeneratorNode";
import { VideoGeneratorNode } from "../nodes/VideoGeneratorNode";
import { AudioGeneratorNode } from "../nodes/AudioGeneratorNode";
import { UpscalerNode } from "../nodes/UpscalerNode";
import { AssistantNode } from "../nodes/AssistantNode";
import { UploadNode } from "../nodes/UploadNode";
import { ListNode } from "../nodes/ListNode";
import { StickyNoteNode } from "../nodes/StickyNoteNode";

// Edges
import { AnimatedEdge } from "../edges/AnimatedEdge";

// Spotlight
import { SpotlightSearch } from "./SpotlightSearch";

// Registry
import { NODE_TYPES as NODE_REGISTRY, NODE_CATEGORIES, PORT_COLORS } from "../lib/nodeRegistry";

// ---- Node type mapping ----
const nodeTypes = {
  text: TextNode,
  "image-generator": ImageGeneratorNode,
  "video-generator": VideoGeneratorNode,
  "audio-generator": AudioGeneratorNode,
  upscaler: UpscalerNode,
  assistant: AssistantNode,
  upload: UploadNode,
  list: ListNode,
  "sticky-note": StickyNoteNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// ---- Icon mapping for sidebar ----
const ICON_MAP: Record<string, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  "image-generator": <ImagePlus className="w-4 h-4" />,
  "video-generator": <Film className="w-4 h-4" />,
  "audio-generator": <Volume2 className="w-4 h-4" />,
  upscaler: <Upscale className="w-4 h-4" />,
  assistant: <Bot className="w-4 h-4" />,
  upload: <Upload className="w-4 h-4" />,
  list: <List className="w-4 h-4" />,
  "sticky-note": <StickyNote className="w-4 h-4" />,
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  input: <ArrowDownToLine className="w-3.5 h-3.5" />,
  generator: <Sparkles className="w-3.5 h-3.5" />,
  transformer: <Wand2 className="w-3.5 h-3.5" />,
  utility: <Wrench className="w-3.5 h-3.5" />,
};

// ---- Local Storage ----
const STORAGE_KEY = "takamul-spaces-canvas";

function loadCanvas(): { nodes: Node[]; edges: Edge[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveCanvas(nodes: Node[], edges: Edge[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
}

// ============================================================
// Inner Canvas (needs ReactFlowProvider to be above it)
// ============================================================
function SpacesCanvasInner() {
  const router = useRouter();
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, getNodes, getEdges } = useReactFlow();

  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // History for Undo/Redo
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef(-1);

  // Load from localStorage
  useEffect(() => {
    const stored = loadCanvas();
    if (stored) {
      setNodes(stored.nodes);
      setEdges(stored.edges);
    }
    setLoaded(true);
  }, []);

  // Auto-save on changes (debounced)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCanvas(nodes, edges);
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [nodes, edges, loaded]);

  // Push history snapshot
  const pushHistory = useCallback(() => {
    const snapshot = { nodes: [...nodes], edges: [...edges] };
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      setNodes(prev.nodes);
      setEdges(prev.edges);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, []);

  // Node changes handler
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // Edge changes handler
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  // Connect handler
  const onConnect: OnConnect = useCallback(
    (connection) => {
      pushHistory();
      const edge: Edge = {
        ...connection,
        id: `e-${Date.now()}`,
        type: "animated",
        data: { portType: "text" }, // Will be enhanced with actual port type detection
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [pushHistory]
  );

  // Validate connections (no cycles, type safety)
  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const target = currentNodes.find((n) => n.id === connection.target);

      if (!target || target.id === connection.source) return false;

      // Prevent cycles
      const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);
        for (const outgoer of getOutgoers(node, currentNodes, currentEdges)) {
          if (outgoer.id === connection.source || hasCycle(outgoer, visited)) return true;
        }
        return false;
      };

      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  // Add node
  const addNode = useCallback(
    (type: string, position?: { x: number; y: number }) => {
      pushHistory();
      const pos = position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 };
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: pos,
        data: {},
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [pushHistory]
  );

  // Double-click to add node via spotlight
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      setSpotlightOpen(true);
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "/") {
        e.preventDefault();
        setSpotlightOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  if (!loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-neon-pink rounded-full border-t-transparent animate-spin" />
          <span className="text-white/40 ">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden text-white font-sans">
      {/* ====== FLOATING RIGHT SIDEBAR (Nodes) ====== */}
      <div
        className={`
          absolute top-4 bottom-4 z-40 w-[260px]
          bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]
          flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
          ${sidebarOpen ? "right-4 translate-x-0 opacity-100" : "right-[-300px] translate-x-8 opacity-0 pointer-events-none"}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between shrink-0 border-b border-white/[0.04]">
          <span className="text-sm font-semibold tracking-wide text-white/90">أدوات العقد</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-xl bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.1] transition-all"
            title="إخفاء الأدوات"
          >
             <Plus className="w-4 h-4 rotate-45" />
          </button>
        </div>

        {/* Nodes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {NODE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium uppercase tracking-widest px-1">
                {CAT_ICONS[cat.id]}
                <span>{cat.labelAr}</span>
              </div>
              <div className="space-y-1.5">
                {cat.nodes.map((nodeType) => {
                  const node = NODE_REGISTRY[nodeType];
                  if (!node) return null;
                  return (
                    <button
                      key={nodeType}
                      onClick={() => addNode(nodeType)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner"
                        style={{ background: `linear-gradient(135deg, ${node.color}20, ${node.color}05)`, color: node.color, border: `1px solid ${node.color}20` }}
                      >
                        {ICON_MAP[nodeType]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-white/90 font-semibold truncate group-hover:text-white transition-colors">
                          {node.labelAr}
                        </div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          {node.descriptionAr}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== MAIN CANVAS WRAPPER ====== */}
      <div className="absolute inset-0 z-0">
        {/* Top Floating Toolbar */}
        <div 
          className="absolute top-4 left-4 z-20 flex justify-between items-start pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" 
          style={{ right: sidebarOpen ? '290px' : '20px' }}
        >
          {/* Left Side (Project Title & Back Button) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/spaces")}
              className="p-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all pointer-events-auto group"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center gap-3 px-5 py-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-pink shadow-[0_0_12px_rgba(241,91,181,0.8)]" />
                <span className="text-sm font-bold text-white/90 tracking-wide">Spaces Studio</span>
              </div>
              <div className="w-px h-5 bg-white/[0.08] mx-2" />
              <span className="text-[11px] text-white/40">مسودة</span>
            </div>
          </div>

          {/* Right Side (Actions) */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl pointer-events-auto">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-white transition-all text-xs font-semibold"
                title="إظهار أدوات العقد"
              >
                <Plus className="w-4 h-4" />
                <span>أدوات العقد</span>
              </button>
            )}
            
            {!sidebarOpen && <div className="w-px h-6 bg-white/[0.08] mx-1" />}

            <button
              onClick={undo}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
              title="تراجع (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
              title="إعادة (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/[0.08] mx-1" />
            <button
              onClick={() => setSpotlightOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink hover:bg-neon-pink/20 hover:text-white transition-all text-xs font-semibold group"
            >
              <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>بحث سريع</span>
              <kbd className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded ml-1 opacity-70 group-hover:opacity-100 font-mono">Space</kbd>
            </button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "animated" }}
          onDoubleClick={handleDoubleClick}
          fitView
          snapToGrid
          snapGrid={[24, 24]}
          minZoom={0.1}
          maxZoom={2}
          className="!bg-transparent"
          proOptions={{ hideAttribution: true }}
        >
          {/* Subtle custom grid */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={2.5}
            color="rgba(255,255,255,0.09)"
          />

          {/* Floating Minimap */}
          <MiniMap
            nodeColor={(n) => {
              const def = NODE_REGISTRY[n.type || ''];
              return def?.color || '#333';
            }}
            maskColor="rgba(10,10,15,0.7)"
            className="!bg-[#111118]/80 !backdrop-blur-3xl !border-white/[0.04] !shadow-2xl !rounded-2xl !m-4"
            position="bottom-right"
            style={{ right: sidebarOpen ? '290px' : '90px', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}
          />

          {/* Floating Controls */}
          <Panel position="bottom-left" className="flex flex-col gap-2 !m-4 pointer-events-auto">
            <div className="flex flex-col bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] rounded-2xl shadow-2xl p-1">
              <button
                onClick={() => zoomIn()}
                className="p-3 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="h-px w-full bg-white/[0.06]" />
              <button
                onClick={() => zoomOut()}
                className="p-3 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => fitView({ padding: 0.3 })}
              className="p-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] rounded-2xl shadow-2xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* ====== SPOTLIGHT SEARCH ====== */}
      <SpotlightSearch
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onAddNode={addNode}
      />
    </div>
  );
}

// ============================================================
// Exported wrapper with ReactFlowProvider
// ============================================================
export function SpacesCanvas() {
  return (
    <ReactFlowProvider>
      <SpacesCanvasInner />
    </ReactFlowProvider>
  );
}
