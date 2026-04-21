"use client";

// ============================================================
// SpacesLivePreview — Interactive demo of Spaces on the homepage
// Uses the REAL node components from /spaces but inside a locked,
// marketing-friendly canvas (no scroll hijacking, no chrome).
// ============================================================

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Real node components (same ones used inside /spaces/canvas)
import { TextNode } from "@/components/spaces/nodes/TextNode";
import { ImageGeneratorNode } from "@/components/spaces/nodes/ImageGeneratorNode";
import { VideoGeneratorNode } from "@/components/spaces/nodes/VideoGeneratorNode";
import { StickyNoteNode } from "@/components/spaces/nodes/StickyNoteNode";
import { UpscalerNode } from "@/components/spaces/nodes/UpscalerNode";

// Real edge
import { AnimatedEdge } from "@/components/spaces/edges/AnimatedEdge";

const nodeTypes = {
  text: TextNode,
  "image-generator": ImageGeneratorNode,
  "video-generator": VideoGeneratorNode,
  "sticky-note": StickyNoteNode,
  upscaler: UpscalerNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// Pre-populated demo flow: Note → Text Prompt → Image Generator → Upscaler → Video
const INITIAL_NODES: Node[] = [
  {
    id: "note-1",
    type: "sticky-note",
    position: { x: 0, y: 0 },
    data: {
      text: "اسحب العقد، وصّلها، جرّب منصة Spaces قبل ما تسجّل دخول ✨",
      colorIdx: 0,
    },
  },
  {
    id: "text-1",
    type: "text",
    position: { x: 0, y: 260 },
    data: {
      text: "صورة سينمائية لمدينة عربية مستقبلية وقت الغروب، إضاءة ذهبية، تفاصيل عالية.",
    },
  },
  {
    id: "image-1",
    type: "image-generator",
    position: { x: 420, y: 180 },
    data: {
      model: "flux-1.1-pro",
      aspectRatio: "16:9",
      numImages: 1,
    },
  },
  {
    id: "upscaler-1",
    type: "upscaler",
    position: { x: 860, y: 200 },
    data: {},
  },
  {
    id: "video-1",
    type: "video-generator",
    position: { x: 1280, y: 180 },
    data: {
      model: "veo-2",
      duration: 5,
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "e-text-image",
    source: "text-1",
    sourceHandle: "text-out",
    target: "image-1",
    targetHandle: "prompt-in",
    type: "animated",
  },
  {
    id: "e-image-upscaler",
    source: "image-1",
    sourceHandle: "image-out",
    target: "upscaler-1",
    targetHandle: "image-in",
    type: "animated",
  },
  {
    id: "e-upscaler-video",
    source: "upscaler-1",
    sourceHandle: "image-out",
    target: "video-1",
    targetHandle: "image-in",
    type: "animated",
  },
];

function SpacesLivePreviewInner() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (conn) => setEdges((eds) => addEdge({ ...conn, type: "animated" }, eds)),
    []
  );

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.7 }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 0.85, minZoom: 0.4 }}
      defaultViewport={defaultViewport}
      minZoom={0.3}
      maxZoom={1.2}
      // Marketing-friendly interaction lock:
      // - Keep page scroll: disable zoom-on-scroll
      // - Let user drag nodes + pan on mouse drag
      // - No pinch-zoom hijacking on mobile (touches pan by default)
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      panOnScroll={false}
      panOnDrag={true}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
      proOptions={{ hideAttribution: true }}
      className="bg-transparent"
      style={{ backgroundColor: "transparent" }}
    />
  );
}

export default function SpacesLivePreview() {
  return (
    <div className="spaces-preview-theme w-full h-full">
      <ReactFlowProvider>
        <SpacesLivePreviewInner />
      </ReactFlowProvider>

      {/* Scoped theme overrides — forces every node/handle/edge to the brand yellow
          inside the preview only. The real /spaces canvas keeps its meaningful
          per-type colors (violet=text, cyan=image, amber=video, green=audio). */}
      <style jsx global>{`
        /* Node wrapper border + header gradient + icon container + body icon accents */
        .spaces-preview-theme .react-flow__node > div {
          border-color: rgba(254, 228, 64, 0.15) !important;
        }
        .spaces-preview-theme .react-flow__node.selected > div,
        .spaces-preview-theme .react-flow__node > div:hover {
          border-color: rgba(254, 228, 64, 0.45) !important;
          box-shadow: 0 0 30px rgba(254, 228, 64, 0.15) !important;
        }

        /* Header gradient — targets the inline linear-gradient the BaseNode sets */
        .spaces-preview-theme .react-flow__node > div > div:first-of-type {
          background: linear-gradient(135deg, rgba(254, 228, 64, 0.12), transparent) !important;
          border-bottom-color: rgba(254, 228, 64, 0.1) !important;
        }

        /* Icon chip inside header */
        .spaces-preview-theme .react-flow__node > div > div:first-of-type > div:first-child > div:first-child {
          background: rgba(254, 228, 64, 0.18) !important;
          color: #fee440 !important;
        }

        /* Handles (ports) — border + background + glow all yellow */
        .spaces-preview-theme .react-flow__handle {
          border-color: #fee440 !important;
          box-shadow: 0 0 8px rgba(254, 228, 64, 0.45) !important;
        }
        .spaces-preview-theme .react-flow__handle.source {
          background: #fee440 !important;
        }
        .spaces-preview-theme .react-flow__handle.target {
          background: #111116 !important;
        }

        /* Edges — default stroke and animated paths */
        .spaces-preview-theme .react-flow__edge-path,
        .spaces-preview-theme .react-flow__connection-path {
          stroke: #fee440 !important;
          filter: drop-shadow(0 0 4px rgba(254, 228, 64, 0.5));
        }

        /* Sticky note — neutralize its color variants into a soft yellow tint */
        .spaces-preview-theme .react-flow__node-sticky-note > div {
          background: rgba(254, 228, 64, 0.08) !important;
          border-color: rgba(254, 228, 64, 0.25) !important;
        }
      `}</style>
    </div>
  );
}
