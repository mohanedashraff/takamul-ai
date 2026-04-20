"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Bot, ChevronDown } from "lucide-react";
import { BaseNode } from "./BaseNode";

const ASSISTANT_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "claude-sonnet", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "gemini-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek" },
];

export function AssistantNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model, setModel] = useState((data?.model as string) || "gpt-4o");
  const [instruction, setInstruction] = useState(
    (data?.instruction as string) || ""
  );
  const [output, setOutput] = useState((data?.output as string) || "");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const handleRun = useCallback(async () => {
    setStatus("running");
    setTimeout(() => {
      setOutput("تم تحسين البرومبت بنجاح! النتيجة ستظهر هنا...");
      setStatus("success");
      updateNodeData(id, { output: "improved prompt result", status: "success" });
    }, 1500);
  }, [id, updateNodeData]);

  return (
    <BaseNode
      id={id}
      type="assistant"
      selected={selected}
      status={status}
      onRun={handleRun}
      headerIcon={<Bot className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Model */}
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
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-violet-500/40 cursor-pointer transition-colors"
            >
              {ASSISTANT_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111116]">
                  {m.name} — {m.provider}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* System Instruction */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">
            Instruction
          </label>
          <textarea
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value);
              updateNodeData(id, { instruction: e.target.value });
            }}
            placeholder="مثل: حسّن البرومبت وأضف تفاصيل أكثر..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-violet-500/30 transition-colors "
            rows={2}
            dir="auto"
          />
        </div>

        {/* Output */}
        {output && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="text-[11px] text-white/60 leading-relaxed" dir="auto">
              {output}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
