"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Film, ChevronDown, Settings2 } from "lucide-react";
import { BaseNode } from "./BaseNode";

const VIDEO_MODELS = [
  { id: "runway-gen4", name: "Runway Gen-4", provider: "Runway" },
  { id: "luma-ray2", name: "Luma Ray 2", provider: "Luma" },
  { id: "kling-v2", name: "Kling V2", provider: "Kuaishou" },
  { id: "seedance", name: "Seedance 1.0", provider: "ByteDance" },
  { id: "minimax", name: "Minimax Video", provider: "Minimax" },
];

const DURATIONS = [
  { id: "5s", label: "5 ثواني" },
  { id: "10s", label: "10 ثواني" },
];

export function VideoGeneratorNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model, setModel] = useState((data?.model as string) || "runway-gen4");
  const [duration, setDuration] = useState((data?.duration as string) || "5s");
  const [aspectRatio, setAspectRatio] = useState((data?.aspectRatio as string) || "16:9");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    setStatus("running");
    setTimeout(() => {
      setStatus("success");
    }, 3000);
  }, []);

  return (
    <BaseNode
      id={id}
      type="video-generator"
      selected={selected}
      status={status}
      onRun={handleRun}
      headerIcon={<Film className="w-4 h-4" />}
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
                updateNodeData(id, { model: e.target.value });
              }}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-amber-500/40 cursor-pointer transition-colors"
            >
              {VIDEO_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111116]">
                  {m.name} — {m.provider}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Duration
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDuration(d.id);
                  updateNodeData(id, { duration: d.id });
                }}
                className={`
                  py-1.5 rounded-lg text-[11px] font-medium transition-all
                  ${duration === d.id
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }
                `}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1">
            {["16:9", "9:16", "1:1"].map((ar) => (
              <button
                key={ar}
                onClick={() => {
                  setAspectRatio(ar);
                  updateNodeData(id, { aspectRatio: ar });
                }}
                className={`
                  py-1.5 rounded-lg text-[11px] font-medium transition-all
                  ${aspectRatio === ar
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }
                `}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Result Preview */}
        {status === "success" && (
          <div className="mt-2 rounded-xl overflow-hidden border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <Film className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
            <span className="text-[11px] text-amber-400/60">Video generated successfully</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
