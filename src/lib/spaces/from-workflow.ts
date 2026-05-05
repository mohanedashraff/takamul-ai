// ════════════════════════════════════════════════════════════════
// Convert a MuAPI workflow definition into Yilow Spaces nodes/edges
// ════════════════════════════════════════════════════════════════
// MuAPI's workflow format:
//   nodes: [{ id, category: "text"|"image"|"video"|"audio"|"api",
//             model:    "text-passthrough"|"image-passthrough"|<modelSlug>,
//             input_params:  { … },
//             output_params: { … },
//             params:        { … },
//             position: { x, y } }]
//   edges: [{ id, source, sourceHandle, target, targetHandle, style }]
//
// Yilow Spaces format (matches @xyflow/react Node/Edge shape):
//   Node: { id, type, position, data }
//   Edge: { id, source, target, sourceHandle?, targetHandle?, type:"animated", data:{ portType } }
//
// Mapping rules
// ─────────────
// • text   + text-passthrough     → "text" node  (data.text seeded with input_params.prompt)
// • image  + image-passthrough    → "upload" node accepting images
// • video  + video-passthrough    → "upload" node accepting videos
// • audio  + audio-passthrough    → "upload" node accepting audio
// • image  + <real model>         → "image-generator" node, model preset baked in data.model
// • video  + <real model>         → "video-generator"
// • audio  + <real model>         → "audio-generator"
// • api    + <real model>         → "image-generator" (best-effort fallback, surfaces model)
// • anything else                 → "sticky-note"  with the model name so the user knows
//
// We also rewrite the MuAPI handle ids ("textOutput"/"imageInput") to
// the handles our nodes expose ("text-out", "prompt-in", etc.) so edges
// connect to the correct ports.

interface MuNode {
  id:            string;
  category?:     string;
  model?:        string;
  input_params?: Record<string, unknown>;
  position?:     { x?: number; y?: number };
  params?:       Record<string, unknown>;
}

interface MuEdge {
  id?:           string;
  source:        string;
  sourceHandle?: string;
  target:        string;
  targetHandle?: string;
}

export interface SpaceNode {
  id:       string;
  type:     string;
  position: { x: number; y: number };
  data:     Record<string, unknown>;
}

export interface SpaceEdge {
  id:           string;
  source:       string;
  sourceHandle?: string;
  target:       string;
  targetHandle?: string;
  type:         "animated";
  data:         { portType: "text" | "image" | "video" | "audio" | "any" };
}

// Map MuAPI output handle id → our source handle id (per node type).
// (handle parameter is intentionally unused — we always emit a single
// "primary" output port per node, so the source side is determined
// purely by the node type.)
function mapSourceHandle(nodeType: string): string | undefined {
  switch (nodeType) {
    case "text":              return "text-out";
    case "image-generator":   return "image-out";
    case "video-generator":   return "video-out";
    case "audio-generator":   return "audio-out";
    case "upscaler":          return "image-out";
    case "assistant":         return "text-out";
    case "upload":            return "file-out";
    case "list":              return "items-out";
    default:                  return undefined;
  }
}

// Map MuAPI input handle id → our target handle id.
function mapTargetHandle(nodeType: string, handle?: string): string | undefined {
  // Heuristic: MuAPI uses "imageInput", "imageInput2", "textInput" etc.
  const h = (handle ?? "").toLowerCase();
  switch (nodeType) {
    case "image-generator":
      // MuAPI sends prompts on "imageInput" (text→image); reference images
      // on "imageInput2".
      if (h.includes("text"))   return "prompt-in";
      if (h.includes("image"))  return h.endsWith("2") || h.endsWith("3") ? "reference-in" : "prompt-in";
      return "prompt-in";
    case "video-generator":
      if (h.includes("text"))   return "prompt-in";
      if (h.includes("image"))  return "image-in";
      return "prompt-in";
    case "audio-generator":
      return "text-in";
    case "upscaler":
      return "image-in";
    case "assistant":
      return "text-in";
    case "list":
      return "items-in";
    default:
      return undefined;
  }
}

function portTypeFor(nodeType: string): SpaceEdge["data"]["portType"] {
  switch (nodeType) {
    case "text":            return "text";
    case "image-generator": return "image";
    case "video-generator": return "video";
    case "audio-generator": return "audio";
    case "upscaler":        return "image";
    case "assistant":       return "text";
    case "upload":          return "any";
    default:                return "any";
  }
}

/**
 * Convert a MuAPI workflow definition into Spaces nodes/edges.
 * Idempotent and pure — never touches the network.
 */
export function workflowToSpace(workflow: {
  workflow_id?: string;
  name?:        string;
  data?:        { nodes?: MuNode[] };
  edges?:       MuEdge[];
}): { nodes: SpaceNode[]; edges: SpaceEdge[]; title: string } {
  const muNodes = workflow.data?.nodes ?? [];
  const muEdges = workflow.edges ?? [];

  const nodeTypeById: Record<string, string> = {};
  const nodes: SpaceNode[] = [];

  for (const n of muNodes) {
    const cat = (n.category ?? "").toLowerCase();
    const model = (n.model ?? "").toLowerCase();
    const isPassthrough = model.endsWith("-passthrough") || model === "passthrough";

    let type = "sticky-note";
    const data: Record<string, unknown> = {};

    if (cat === "text" && isPassthrough) {
      type = "text";
      const prompt = n.input_params?.prompt;
      if (typeof prompt === "string") data.text = prompt;
    } else if (cat === "image" && isPassthrough) {
      type = "upload";
      data.acceptType = "image";
      const url = n.input_params?.image_url;
      if (typeof url === "string" && url) {
        data.fileUrl = url;
        data.preview = url;
        data.fileName = url.split("/").pop() ?? "image";
      }
    } else if (cat === "video" && isPassthrough) {
      type = "upload";
      data.acceptType = "video";
      const url = (n.input_params?.video_url ?? n.input_params?.url) as string | undefined;
      if (typeof url === "string" && url) {
        data.fileUrl = url;
        data.preview = url;
        data.fileName = url.split("/").pop() ?? "video";
      }
    } else if (cat === "audio" && isPassthrough) {
      type = "upload";
      data.acceptType = "audio";
      const url = (n.input_params?.audio_url ?? n.input_params?.url) as string | undefined;
      if (typeof url === "string" && url) {
        data.fileUrl = url;
        data.preview = url;
        data.fileName = url.split("/").pop() ?? "audio";
      }
    } else if (cat === "image") {
      type = "image-generator";
      data.model  = model || "auto";
      data.prompt = (n.input_params?.prompt as string) ?? "";
      // Surface every input param so the user can see the recipe even if
      // we don't have a UI for each one yet.
      data.params = { ...(n.input_params ?? {}) };
    } else if (cat === "video") {
      type = "video-generator";
      data.model  = model || "auto";
      data.prompt = (n.input_params?.prompt as string) ?? "";
      data.params = { ...(n.input_params ?? {}) };
    } else if (cat === "audio") {
      type = "audio-generator";
      data.model = model || "auto";
      data.text  = (n.input_params?.text ?? n.input_params?.prompt ?? "") as string;
      data.params = { ...(n.input_params ?? {}) };
    } else {
      // Unknown — leave a sticky note so the user can see what was here.
      type = "sticky-note";
      data.text = `[${cat || "node"}] ${model || "(unknown model)"}\n${
        n.input_params ? Object.keys(n.input_params).join(", ") : ""
      }`;
    }

    nodeTypeById[n.id] = type;
    nodes.push({
      id:       n.id,
      type,
      position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
      data,
    });
  }

  // Edges — translate handle ids and stamp the port type.
  const edges: SpaceEdge[] = [];
  for (const e of muEdges) {
    const srcType = nodeTypeById[e.source] ?? "";
    const tgtType = nodeTypeById[e.target] ?? "";
    if (!srcType || !tgtType) continue;

    edges.push({
      id:           e.id ?? `e-${e.source}-${e.target}-${edges.length}`,
      source:       e.source,
      target:       e.target,
      sourceHandle: mapSourceHandle(srcType),
      targetHandle: mapTargetHandle(tgtType, e.targetHandle),
      type:         "animated",
      data:         { portType: portTypeFor(srcType) },
    });
  }

  return {
    nodes,
    edges,
    title: workflow.name ?? "قالب",
  };
}
