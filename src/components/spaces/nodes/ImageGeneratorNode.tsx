"use client";

import React, { useState, useCallback, useEffect } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { ImagePlus, ChevronDown, Download, Maximize2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { BaseNode } from "./BaseNode";
import {
  registerExecutor, runMuapiTool, pickResultUrl, resolvePrompt,
  type NodeOutput,
} from "../lib/graph-executor";

// Curated list of MuAPI text-to-image models (subset of registry)
const MODELS = [
  { id: "nano-banana",                   label: "Nano Banana ✨"      },
  // iter 16: live slugs are `flux-*-image`; bare slugs 404 on MuAPI.
  { id: "flux-schnell-image",            label: "Flux Schnell — أسرع" },
  { id: "flux-dev-image",                label: "Flux Dev"            },
  { id: "bytedance-seedream-v4",         label: "Seedream 4"          },
  { id: "google-imagen4",                label: "Google Imagen 4"     },
  { id: "google-imagen4-ultra",          label: "Imagen 4 Ultra 🔥"   },
  { id: "gpt4o-text-to-image",           label: "GPT-4o Image"        },
  { id: "midjourney-v7-text-to-image",   label: "Midjourney v7"       },
  { id: "qwen-image",                    label: "Qwen Image"          },
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export function ImageGeneratorNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model,        setModel]        = useState((data?.model as string) || MODELS[0]!.id);
  const [aspectRatio,  setAspectRatio]  = useState((data?.aspectRatio as string) || "1:1");
  const [prompt,       setPrompt]       = useState((data?.prompt as string) || "");
  const [status,       setStatus]       = useState<"idle" | "running" | "success" | "error">((data?.status as never) ?? "idle");
  const [resultUrl,    setResultUrl]    = useState<string | null>((data?.resultUrl as string) || null);
  const [errMessage,   setErrMessage]   = useState<string>("");

  // keep node data in sync (survives Run All & persistence)
  useEffect(() => {
    updateNodeData(id, { model, aspectRatio, prompt, status, resultUrl });
  }, [id, updateNodeData, model, aspectRatio, prompt, status, resultUrl]);

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("اكتب وصفاً للصورة أو وصّل عقدة نص");
      return;
    }
    setStatus("running");
    setErrMessage("");
    try {
      const { result } = await runMuapiTool({
        toolId:   "spaces-image",
        endpoint: model,
        payload:  { prompt, aspect_ratio: aspectRatio, num_images: 1 },
        inputsForDb: { prompt, aspectRatio, model, source: "spaces" },
      });
      const url = pickResultUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");
      setResultUrl(url);
      setStatus("success");
      toast.success("تم توليد الصورة ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل التوليد";
      setErrMessage(message);
      setStatus("error");
      toast.error(message);
    }
  }, [model, aspectRatio, prompt]);

  return (
    <BaseNode
      id={id}
      type="image-generator"
      selected={selected}
      status={status === "success" ? "success" : status === "error" ? "error" : status === "running" ? "running" : "idle"}
      onRun={handleRun}
      headerIcon={<ImagePlus className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Inline prompt — also acts as fallback if no upstream text node */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="اوصف الصورة..."
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/90 placeholder-white/25 resize-none focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {/* Model */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">
            Model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111116]">{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Aspect ratio */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Aspect
          </label>
          <div className="grid grid-cols-5 gap-1">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  aspectRatio === ar
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                }`}
                type="button"
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Result preview */}
        {status === "running" && (
          <div className="flex items-center justify-center gap-2 py-6 rounded-xl bg-white/[0.03] border border-white/5">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="text-xs text-white/50">جاري التوليد…</span>
          </div>
        )}

        {status === "success" && resultUrl && (
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/20 group">
            <img src={resultUrl} alt="" className="w-full h-auto" />
            <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={resultUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-black/70 backdrop-blur border border-white/15 flex items-center justify-center"
                aria-label="تنزيل"
              >
                <Download className="w-3.5 h-3.5 text-white" />
              </a>
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-black/70 backdrop-blur border border-white/15 flex items-center justify-center"
                aria-label="فتح"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errMessage || "فشل التوليد"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

// ── Register with the graph executor ──────────────────────────────────
registerExecutor("image-generator", async (node, ctx): Promise<NodeOutput> => {
  const data = node.data ?? {};
  const promptValue = resolvePrompt(data.prompt, ctx.inputs, "prompt-in");
  if (!promptValue) throw new Error("Image generator needs a prompt");

  const model       = (data.model as string)        || MODELS[0]!.id;
  const aspectRatio = (data.aspectRatio as string)  || "1:1";

  const { result } = await runMuapiTool({
    toolId:   "spaces-image",
    endpoint: model,
    payload:  { prompt: promptValue, aspect_ratio: aspectRatio, num_images: 1 },
    inputsForDb: { prompt: promptValue, aspectRatio, model, source: "spaces" },
  });

  const url = pickResultUrl(result);
  if (!url) throw new Error("لم يتم استلام الناتج");
  ctx.setStatus("success", { output: url });
  return { type: "image", value: url };
});
