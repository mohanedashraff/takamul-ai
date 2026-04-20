"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { StickyNote as StickyNoteIcon } from "lucide-react";

const COLORS = [
  { id: "yellow", bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-100/80" },
  { id: "pink", bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-100/80" },
  { id: "blue", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-100/80" },
  { id: "green", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-100/80" },
];

export function StickyNoteNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [text, setText] = useState((data?.text as string) || "");
  const [colorIdx, setColorIdx] = useState((data?.colorIdx as number) || 0);

  const color = COLORS[colorIdx] || COLORS[0];

  return (
    <div
      className={`
        rounded-2xl ${color.bg} ${color.border} border min-w-[200px] max-w-[280px]
        backdrop-blur-sm transition-all duration-200
        ${selected ? "shadow-lg ring-1 ring-white/20" : ""}
      `}
    >
      {/* Color picker dots */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
        {COLORS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              setColorIdx(i);
              updateNodeData(id, { colorIdx: i });
            }}
            className={`w-3 h-3 rounded-full ${c.bg.replace("/10", "/40")} border ${c.border} transition-transform ${
              colorIdx === i ? "scale-125 ring-1 ring-white/30" : "hover:scale-110"
            }`}
          />
        ))}
        <StickyNoteIcon className="w-3 h-3 text-white/15 ml-auto" />
      </div>

      {/* Note text */}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          updateNodeData(id, { text: e.target.value });
        }}
        placeholder="اكتب ملاحظة..."
        className={`
          w-full bg-transparent px-3 pb-3 pt-1 text-sm ${color.text}
          placeholder-white/15 resize-none focus:outline-none 
        `}
        rows={3}
        dir="auto"
      />
    </div>
  );
}
