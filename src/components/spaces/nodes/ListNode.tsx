"use client";

import React, { useState, useCallback } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { List, Plus, X } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function ListNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const [items, setItems] = useState<string[]>((data?.items as string[]) || [""]);

  const addItem = useCallback(() => {
    const updated = [...items, ""];
    setItems(updated);
    updateNodeData(id, { items: updated });
  }, [items, id, updateNodeData]);

  const removeItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      updateNodeData(id, { items: updated });
    },
    [items, id, updateNodeData]
  );

  const updateItem = useCallback(
    (index: number, value: string) => {
      const updated = items.map((item, i) => (i === index ? value : item));
      setItems(updated);
      updateNodeData(id, { items: updated });
    },
    [items, id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      type="list"
      selected={selected}
      headerIcon={<List className="w-4 h-4" />}
    >
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <span className="text-[10px] text-white/20 font-mono w-4 text-center shrink-0">
              {i + 1}
            </span>
            <input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={`عنصر ${i + 1}...`}
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white/70 placeholder-white/15 focus:outline-none focus:border-pink-500/30 transition-colors "
              dir="auto"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(i)}
                className="p-1 text-white/20 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full py-1.5 rounded-lg border border-dashed border-white/[0.08] text-white/25 text-[11px] hover:border-pink-500/30 hover:text-pink-400 flex items-center justify-center gap-1.5 transition-all "
        >
          <Plus className="w-3 h-3" />
          إضافة عنصر
        </button>
        <div className="text-[10px] text-white/20 font-mono text-center">
          {items.filter(Boolean).length} items → batch processing
        </div>
      </div>
    </BaseNode>
  );
}
