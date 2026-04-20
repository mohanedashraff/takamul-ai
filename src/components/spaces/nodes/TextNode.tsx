"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { Type } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function TextNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [text, setText] = useState((data?.text as string) || "");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);
      updateNodeData(id, { text: value });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode id={id} type="text" selected={selected} headerIcon={<Type className="w-4 h-4" />}>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="اكتب البرومبت هنا..."
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all "
        rows={4}
        dir="auto"
      />
      <div className="flex justify-between mt-2 text-[10px] text-white/25 font-mono">
        <span>{text.length} chars</span>
        <span>{text.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </BaseNode>
  );
}
