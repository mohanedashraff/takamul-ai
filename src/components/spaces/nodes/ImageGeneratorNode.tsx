"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { ImagePlus, Settings2, ChevronDown } from "lucide-react";
import { BaseNode } from "./BaseNode";

const MODELS = [
  { id: "dall-e-3", name: "DALL·E 3", provider: "OpenAI" },
  { id: "flux-1.1-pro", name: "FLUX 1.1 Pro", provider: "Black Forest Labs" },
  { id: "sdxl", name: "Stable Diffusion XL", provider: "Stability AI" },
  { id: "midjourney", name: "Midjourney", provider: "Midjourney" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", w: 1024, h: 1024 },
  { id: "16:9", label: "16:9", w: 1280, h: 720 },
  { id: "9:16", label: "9:16", w: 720, h: 1280 },
  { id: "4:3", label: "4:3", w: 1152, h: 864 },
  { id: "3:4", label: "3:4", w: 864, h: 1152 },
];

export function ImageGeneratorNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model, setModel] = useState((data?.model as string) || "dall-e-3");
  const [aspectRatio, setAspectRatio] = useState((data?.aspectRatio as string) || "1:1");
  const [numImages, setNumImages] = useState((data?.numImages as number) || 1);
  const [negativePrompt, setNegativePrompt] = useState((data?.negativePrompt as string) || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>((data?.resultUrl as string) || null);

  const updateData = useCallback(
    (updates: Record<string, unknown>) => {
      updateNodeData(id, updates);
    },
    [id, updateNodeData]
  );

  const handleRun = useCallback(async () => {
    setStatus("running");
    // Simulate execution - will be replaced with real API call
    setTimeout(() => {
      setStatus("success");
      setResultUrl("https://placehold.co/512x512/1a1a2e/22d3ee?text=Generated+Image");
      updateData({ resultUrl: "generated", status: "success" });
    }, 2000);
  }, [updateData]);

  return (
    <BaseNode
      id={id}
      type="image-generator"
      selected={selected}
      status={status}
      onRun={handleRun}
      headerIcon={<ImagePlus className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Model Selector */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">
            Model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                updateData({ model: e.target.value });
              }}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-cyan-500/40 cursor-pointer transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111116]">
                  {m.name} — {m.provider}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-5 gap-1">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => {
                  setAspectRatio(ar.id);
                  updateData({ aspectRatio: ar.id });
                }}
                className={`
                  py-1.5 rounded-lg text-[11px] font-medium transition-all
                  ${aspectRatio === ar.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }
                `}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Images */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Images: {numImages}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={numImages}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setNumImages(val);
              updateData({ numImages: val });
            }}
            className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5 font-mono">
            <span>1</span><span>2</span><span>3</span><span>4</span>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          <span>إعدادات متقدمة</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>

        {showAdvanced && (
          <div className="space-y-2 pt-1">
            <textarea
              value={negativePrompt}
              onChange={(e) => {
                setNegativePrompt(e.target.value);
                updateData({ negativePrompt: e.target.value });
              }}
              placeholder="Negative prompt..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-cyan-500/30 transition-colors"
              rows={2}
            />
          </div>
        )}

        {/* Result Preview */}
        {resultUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.06]">
            <img
              src={resultUrl}
              alt="Generated"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}
