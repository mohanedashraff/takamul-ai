"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Volume2, ChevronDown, Mic, Music, Speaker } from "lucide-react";
import { BaseNode } from "./BaseNode";

const AUDIO_TYPES = [
  { id: "speech", label: "كلام", labelEn: "Speech", icon: "🎙️" },
  { id: "music", label: "موسيقى", labelEn: "Music", icon: "🎵" },
  { id: "sfx", label: "مؤثرات", labelEn: "SFX", icon: "🔊" },
];

const VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
];

export function AudioGeneratorNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [audioType, setAudioType] = useState((data?.audioType as string) || "speech");
  const [voice, setVoice] = useState((data?.voice as string) || "alloy");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const handleRun = useCallback(async () => {
    setStatus("running");
    setTimeout(() => setStatus("success"), 2000);
  }, []);

  return (
    <BaseNode
      id={id}
      type="audio-generator"
      selected={selected}
      status={status}
      onRun={handleRun}
      headerIcon={<Volume2 className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Audio Type */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {AUDIO_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setAudioType(t.id);
                  updateNodeData(id, { audioType: t.id });
                }}
                className={`
                  py-2 rounded-lg text-[11px] font-medium transition-all flex flex-col items-center gap-1
                  ${audioType === t.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }
                `}
              >
                <span className="text-sm">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selection (only for speech) */}
        {audioType === "speech" && (
          <div>
            <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">
              Voice
            </label>
            <div className="relative">
              <select
                value={voice}
                onChange={(e) => {
                  setVoice(e.target.value);
                  updateNodeData(id, { voice: e.target.value });
                }}
                className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-emerald-500/40 cursor-pointer transition-colors"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#111116]">
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Audio Result */}
        {status === "success" && (
          <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
