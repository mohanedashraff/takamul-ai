"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { ZoomIn, ChevronDown } from "lucide-react";
import { BaseNode } from "./BaseNode";

const SCALE_OPTIONS = [
  { id: "2x", label: "2x", desc: "سريع" },
  { id: "4x", label: "4x", desc: "عالي الجودة" },
];

export function UpscalerNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [scale, setScale] = useState((data?.scale as string) || "2x");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const handleRun = useCallback(async () => {
    setStatus("running");
    setTimeout(() => setStatus("success"), 2500);
  }, []);

  return (
    <BaseNode
      id={id}
      type="upscaler"
      selected={selected}
      status={status}
      onRun={handleRun}
      headerIcon={<ZoomIn className="w-4 h-4" />}
    >
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1.5 block">
            Scale Factor
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {SCALE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setScale(s.id);
                  updateNodeData(id, { scale: s.id });
                }}
                className={`
                  py-2.5 rounded-lg text-center transition-all
                  ${scale === s.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.05] hover:border-white/10"
                  }
                `}
              >
                <div className="text-lg font-bold">{s.label}</div>
                <div className="text-[10px] opacity-50">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {status === "success" && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
            <ZoomIn className="w-6 h-6 text-cyan-400 mx-auto mb-1 opacity-60" />
            <span className="text-[11px] text-cyan-400/60">تم تحسين الصورة بنجاح</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
