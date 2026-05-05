"use client";

import React from "react";
import { type NodeProps } from "@xyflow/react";
import { Volume2, Sparkles } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { registerExecutor } from "../lib/graph-executor";

/**
 * Audio generator — currently disabled because MuAPI doesn't expose
 * native audio (TTS / music / SFX) endpoints. We keep the node visible
 * in the toolbox so the canvas tells a coherent story; running it just
 * surfaces a friendly "coming soon" error.
 */
export function AudioGeneratorNode({ id, selected }: NodeProps) {
  return (
    <BaseNode
      id={id}
      type="audio-generator"
      selected={selected}
      headerIcon={<Volume2 className="w-4 h-4" />}
      hideActions
    >
      <div className="flex flex-col items-center text-center gap-2 py-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
          قريباً
        </span>
        <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
          توليد الصوت (TTS / موسيقى / مؤثرات) قيد التطوير ولم يتم تفعيله بعد.
        </p>
      </div>
    </BaseNode>
  );
}

registerExecutor("audio-generator", async () => {
  throw new Error("توليد الصوت غير متوفر بعد — قريباً");
});
