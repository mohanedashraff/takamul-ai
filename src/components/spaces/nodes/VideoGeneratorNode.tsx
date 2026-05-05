"use client";

import React, { useState, useCallback, useEffect } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Film, ChevronDown, Download, Maximize2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { BaseNode } from "./BaseNode";
import {
  registerExecutor, runMuapiTool, pickResultUrl, resolvePrompt,
  type NodeOutput,
} from "../lib/graph-executor";

// Text-to-video models
const T2V_MODELS = [
  { id: "kling-v3.0-pro-text-to-video",  label: "Kling 3.0 Pro 🔥"   },
  { id: "kling-v2.6-pro-t2v",            label: "Kling 2.6 Pro"      },
  { id: "veo3.1-text-to-video",          label: "Google Veo 3.1"     },
  { id: "veo3.1-fast-text-to-video",     label: "Veo 3.1 Fast"       },
  { id: "openai-sora-2-text-to-video",   label: "OpenAI Sora 2"      },
  { id: "wan2.6-text-to-video",          label: "Wan 2.6"            },
  { id: "wan2.5-text-to-video-fast",     label: "Wan 2.5 Fast"       },
  { id: "seedance-v2.0-t2v",             label: "Seedance 2.0"       },
];

// Image-to-video models — used automatically when an image is connected
const I2V_MODELS = [
  { id: "kling-v2.1-pro-i2v",         label: "Kling 2.1 Pro" },
  { id: "veo3.1-image-to-video",      label: "Veo 3.1"       },
  { id: "wan2.2-image-to-video",      label: "Wan 2.2"       },
];

const ASPECT_RATIOS = ["16:9", "9:16", "1:1"];
const DURATIONS     = [4, 5, 6, 8, 10] as const;

export function VideoGeneratorNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model,        setModel]        = useState((data?.model as string) || T2V_MODELS[0]!.id);
  const [aspectRatio,  setAspectRatio]  = useState((data?.aspectRatio as string) || "16:9");
  const [duration,     setDuration]     = useState((data?.duration as number) || 5);
  const [prompt,       setPrompt]       = useState((data?.prompt as string) || "");
  const [status,       setStatus]       = useState<"idle" | "running" | "success" | "error">((data?.status as never) ?? "idle");
  const [resultUrl,    setResultUrl]    = useState<string | null>((data?.resultUrl as string) || null);
  const [errMessage,   setErrMessage]   = useState<string>("");

  useEffect(() => {
    updateNodeData(id, { model, aspectRatio, duration, prompt, status, resultUrl });
  }, [id, updateNodeData, model, aspectRatio, duration, prompt, status, resultUrl]);

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("اكتب وصفاً للفيديو");
      return;
    }
    setStatus("running");
    setErrMessage("");
    try {
      const { result } = await runMuapiTool({
        toolId:   "spaces-video",
        endpoint: model,
        payload:  { prompt, aspect_ratio: aspectRatio, duration },
        inputsForDb: { prompt, aspectRatio, duration, model, source: "spaces" },
      });
      const url = pickResultUrl(result);
      if (!url) throw new Error("لم يتم استلام الناتج");
      setResultUrl(url);
      setStatus("success");
      toast.success("تم توليد الفيديو 🎬");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل التوليد";
      setErrMessage(message);
      setStatus("error");
      toast.error(message);
    }
  }, [model, aspectRatio, duration, prompt]);

  return (
    <BaseNode
      id={id}
      type="video-generator"
      selected={selected}
      status={status === "success" ? "success" : status === "error" ? "error" : status === "running" ? "running" : "idle"}
      onRun={handleRun}
      headerIcon={<Film className="w-4 h-4" />}
    >
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="اوصف الفيديو..."
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/90 placeholder-white/25 resize-none focus:outline-none focus:border-amber-500/40"
          />
        </div>

        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-amber-500/40 cursor-pointer"
            >
              <optgroup label="نص → فيديو" className="bg-[#111116]">
                {T2V_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#111116]">{m.label}</option>
                ))}
              </optgroup>
              <optgroup label="صورة → فيديو" className="bg-[#111116]">
                {I2V_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#111116]">{m.label}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">Aspect</label>
            <div className="grid grid-cols-3 gap-1">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    aspectRatio === ar
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }`}
                  type="button"
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">Duration</label>
            <div className="grid grid-cols-5 gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    duration === d
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }`}
                  type="button"
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {status === "running" && (
          <div className="flex items-center justify-center gap-2 py-6 rounded-xl bg-white/[0.03] border border-white/5">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-xs text-white/50">جاري التوليد…</span>
          </div>
        )}

        {status === "success" && resultUrl && (
          <div className="relative rounded-xl overflow-hidden border border-amber-500/20 group">
            <video src={resultUrl} controls loop muted className="w-full h-auto" />
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

// ── Graph executor ────────────────────────────────────────────────────
registerExecutor("video-generator", async (node, ctx): Promise<NodeOutput> => {
  const data = node.data ?? {};
  const promptValue = resolvePrompt(data.prompt, ctx.inputs, "prompt-in");
  if (!promptValue) throw new Error("Video generator needs a prompt");

  // If an image input is connected, auto-route to an i2v model unless the user
  // has already explicitly chosen one.
  const imageIn = ctx.inputs["image-in"];
  let model = (data.model as string) || T2V_MODELS[0]!.id;
  const isI2V = I2V_MODELS.some((m) => m.id === model);
  if (imageIn && !isI2V) model = I2V_MODELS[0]!.id;

  const aspectRatio = (data.aspectRatio as string) || "16:9";
  const duration    = (data.duration as number)    || 5;

  const payload: Record<string, unknown> = {
    prompt:       promptValue,
    aspect_ratio: aspectRatio,
    duration,
  };
  if (imageIn?.value && I2V_MODELS.some((m) => m.id === model)) {
    payload.image_url = imageIn.value;
  }

  const { result } = await runMuapiTool({
    toolId:   "spaces-video",
    endpoint: model,
    payload,
    inputsForDb: { prompt: promptValue, aspectRatio, duration, model, source: "spaces", reference: imageIn?.value },
  });

  const url = pickResultUrl(result);
  if (!url) throw new Error("لم يتم استلام الناتج");
  ctx.setStatus("success", { output: url });
  return { type: "video", value: url };
});
