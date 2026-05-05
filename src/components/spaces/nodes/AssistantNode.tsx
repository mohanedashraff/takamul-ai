"use client";

import React, { useState, useCallback, useEffect } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Bot, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { BaseNode } from "./BaseNode";
import { CHAT_MODELS } from "@/lib/chat-models";
import {
  registerExecutor, resolvePrompt,
  type NodeOutput,
} from "../lib/graph-executor";

async function callAssistant(params: {
  model:       string;
  instruction: string;
  input:       string;
}): Promise<string> {
  const res = await fetch("/api/assistant", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Assistant failed (${res.status})`);
  }
  return String(data.text ?? "");
}

export function AssistantNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [model,       setModel]       = useState((data?.model as string) || CHAT_MODELS[0]!.id);
  const [instruction, setInstruction] = useState((data?.instruction as string) || "");
  const [inputText,   setInputText]   = useState((data?.input as string) || "");
  const [output,      setOutput]      = useState((data?.output as string) || "");
  const [status,      setStatus]      = useState<"idle" | "running" | "success" | "error">((data?.status as never) ?? "idle");
  const [errMessage,  setErrMessage]  = useState<string>("");

  useEffect(() => {
    updateNodeData(id, { model, instruction, input: inputText, output, status });
  }, [id, updateNodeData, model, instruction, inputText, output, status]);

  const handleRun = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error("اكتب نصاً أو وصّل عقدة نص");
      return;
    }
    setStatus("running");
    setErrMessage("");
    try {
      const text = await callAssistant({
        model,
        instruction: instruction.trim(),
        input:       inputText,
      });
      setOutput(text);
      setStatus("success");
      toast.success("تم الرد ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل الطلب";
      setErrMessage(message);
      setStatus("error");
      toast.error(message);
    }
  }, [model, instruction, inputText]);

  return (
    <BaseNode
      id={id}
      type="assistant"
      selected={selected}
      status={status === "success" ? "success" : status === "error" ? "error" : status === "running" ? "running" : "idle"}
      onRun={handleRun}
      headerIcon={<Bot className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Model */}
        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 pr-8 focus:outline-none focus:border-violet-500/40 cursor-pointer"
            >
              {CHAT_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111116]">{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Instruction</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="مثال: حسّن البرومبت وأضف تفاصيل سينمائية…"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-violet-500/30"
            rows={2}
            dir="auto"
          />
        </div>

        <div>
          <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1 block">Input</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اكتب النص أو وصّل بمدخل من عقدة نص…"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-violet-500/30"
            rows={2}
            dir="auto"
          />
        </div>

        {status === "running" && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span className="text-xs text-white/50">جاري الرد…</span>
          </div>
        )}

        {status === "success" && output && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="text-[11px] text-white/80 leading-relaxed whitespace-pre-wrap" dir="auto">
              {output}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errMessage || "فشل الرد"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

// ── Graph executor ────────────────────────────────────────────────────
registerExecutor("assistant", async (node, ctx): Promise<NodeOutput> => {
  const data = node.data ?? {};
  const inputText = resolvePrompt(data.input, ctx.inputs, "text-in");
  if (!inputText) throw new Error("Assistant needs an input");

  const model       = (data.model as string)        || CHAT_MODELS[0]!.id;
  const instruction = (data.instruction as string)  || "";

  const text = await callAssistant({ model, instruction, input: inputText });
  ctx.setStatus("success", { output: text });
  return { type: "text", value: text };
});
