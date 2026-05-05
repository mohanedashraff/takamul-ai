"use client";

import React, { useState, useCallback, useEffect } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { ZoomIn, ChevronDown, Loader2, Download, Maximize2 } from "lucide-react";
import toast from "react-hot-toast";
import { BaseNode } from "./BaseNode";
import {
  registerExecutor, runMuapiTool, pickResultUrl,
  type NodeOutput,
} from "../lib/graph-executor";

const MODELS = [
  { id: "ai-image-upscaler",    label: "AI Upscaler — السريع"  },
  { id: "topaz-image-upscale",  label: "Topaz — أعلى جودة 🔥" },
  { id: "seedvr2-image-upscale",label: "SeedVR2 — متقدم"       },
];

export function UpscalerNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model,     setModel]     = useState((data?.model as string) || MODELS[0]!.id);
  const [imageUrl,  setImageUrl]  = useState((data?.imageUrl as string) || "");
  const [status,    setStatus]    = useState<"idle" | "running" | "success" | "error">((data?.status as never) ?? "idle");
  const [resultUrl, setResultUrl] = useState<string | null>((data?.resultUrl as string) || null);
  const [errMessage, setErrMessage] = useState<string>("");

  useEffect(() => {
    updateNodeData(id, { model, imageUrl, status, resultUrl });
  }, [id, updateNodeData, model, imageUrl, status, resultUrl]);

  const handleRun = useCallback(async () => {
    if (!imageUrl) {
      toast.error("وصّل عقدة صورة أو الصق رابط");
      return;
    }
    setStatus("running");
    setErrMessage("");
    try {
      const { result } = await runMuapiTool({
        toolId:      "spaces-upscale",
        endpoint:    model,
        payload:     { image_url: imageUrl },
        inputsForDb: { imageUrl, model, source: "spaces" },
      });
      const url = pickResultUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");
      setResultUrl(url);
      setStatus("success");
      toast.success("تم تحسين الصورة ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل التحسين";
      setErrMessage(message);
      setStatus("error");
      toast.error(message);
    }
  }, [model, imageUrl]);

  return (
    <BaseNode
      id={id}
      type="upscaler"
      selected={selected}
      status={status === "success" ? "success" : status === "error" ? "error" : status === "running" ? "running" : "idle"}
      onRun={handleRun}
      headerIcon={<ZoomIn className="w-4 h-4" />}
    >
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Model</label>
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

        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (أو اربط بعقدة صورة)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/90 placeholder-white/25 focus:outline-none focus:border-cyan-500/40"
          />
          <p className="text-[10px] text-white/30 mt-1">يُملأ تلقائياً عند ربط مدخل صورة من عقدة أخرى.</p>
        </div>

        {status === "running" && (
          <div className="flex items-center justify-center gap-2 py-6 rounded-xl bg-white/[0.03] border border-white/5">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="text-xs text-white/50">جاري التحسين…</span>
          </div>
        )}

        {status === "success" && resultUrl && (
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/20 group">
            <img src={resultUrl} alt="" className="w-full h-auto" />
            <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={resultUrl} download target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-black/70 backdrop-blur border border-white/15 flex items-center justify-center"><Download className="w-3.5 h-3.5 text-white" /></a>
              <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-black/70 backdrop-blur border border-white/15 flex items-center justify-center"><Maximize2 className="w-3.5 h-3.5 text-white" /></a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errMessage || "فشل التحسين"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

// ── Graph executor ────────────────────────────────────────────────────
registerExecutor("upscaler", async (node, ctx): Promise<NodeOutput> => {
  const data = node.data ?? {};
  const upstreamImage = ctx.inputs["image-in"]?.value;
  const imageUrl = upstreamImage || (data.imageUrl as string) || "";
  if (!imageUrl) throw new Error("Upscaler needs an image input");

  const model = (data.model as string) || MODELS[0]!.id;

  const { result } = await runMuapiTool({
    toolId:      "spaces-upscale",
    endpoint:    model,
    payload:     { image_url: imageUrl },
    inputsForDb: { imageUrl, model, source: "spaces" },
  });

  const url = pickResultUrl(result);
  if (!url) throw new Error("لم يتم استلام الناتج");
  ctx.setStatus("success", { output: url });
  return { type: "image", value: url };
});
