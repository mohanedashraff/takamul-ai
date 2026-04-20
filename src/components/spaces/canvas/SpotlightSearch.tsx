"use client";

// ============================================================
// Takamul Spaces — Spotlight Search (Command Palette)
// Press Space or / to quickly search and add nodes
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Type, ImagePlus, Film, Volume2, ZoomIn, Bot, Upload, List, StickyNote } from "lucide-react";
import { NODE_TYPES, NODE_CATEGORIES } from "../lib/nodeRegistry";

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: string, position?: { x: number; y: number }) => void;
  position?: { x: number; y: number };
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'text': <Type className="w-4 h-4" />,
  'image-generator': <ImagePlus className="w-4 h-4" />,
  'video-generator': <Film className="w-4 h-4" />,
  'audio-generator': <Volume2 className="w-4 h-4" />,
  'upscaler': <ZoomIn className="w-4 h-4" />,
  'assistant': <Bot className="w-4 h-4" />,
  'upload': <Upload className="w-4 h-4" />,
  'list': <List className="w-4 h-4" />,
  'sticky-note': <StickyNote className="w-4 h-4" />,
};

export function SpotlightSearch({ isOpen, onClose, onAddNode, position }: SpotlightSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allNodes = Object.values(NODE_TYPES);
  const filtered = query
    ? allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.labelAr.includes(query) ||
          n.description.toLowerCase().includes(query.toLowerCase()) ||
          n.descriptionAr.includes(query)
      )
    : allNodes;

  const handleSelect = useCallback(
    (type: string) => {
      onAddNode(type, position);
      onClose();
    },
    [onAddNode, onClose, position]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && filtered.length > 0) {
        handleSelect(filtered[0].type);
      }
    },
    [onClose, filtered, handleSelect]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-h-[460px] bg-[#111116]/98 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن عقدة... أو Search nodes..."
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 focus:outline-none "
            dir="auto"
          />
          <kbd className="text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Nodes list */}
        <div className="overflow-y-auto max-h-[380px] p-2">
          {query ? (
            // Flat search results
            filtered.length > 0 ? (
              <div className="space-y-0.5">
                {filtered.map((node) => (
                  <button
                    key={node.type}
                    onClick={() => handleSelect(node.type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.06] transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${node.color}15`, color: node.color }}
                    >
                      {ICON_MAP[node.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 font-medium">{node.labelAr}</div>
                      <div className="text-[11px] text-white/30">{node.description}</div>
                    </div>
                    <span className="text-[10px] text-white/15 bg-white/[0.04] px-2 py-0.5 rounded-full font-mono">
                      {node.categoryAr}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/20 text-sm">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                لا توجد نتائج
              </div>
            )
          ) : (
            // Categorized list
            <div className="space-y-3">
              {NODE_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <div className="text-[10px] text-white/25 font-mono uppercase tracking-wider px-3 py-1">
                    {cat.labelAr}
                  </div>
                  <div className="space-y-0.5">
                    {cat.nodes.map((nodeType) => {
                      const node = NODE_TYPES[nodeType];
                      if (!node) return null;
                      return (
                        <button
                          key={node.type}
                          onClick={() => handleSelect(node.type)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.06] transition-colors group"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                            style={{ background: `${node.color}15`, color: node.color }}
                          >
                            {ICON_MAP[node.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/80 font-medium">{node.labelAr}</div>
                            <div className="text-[11px] text-white/30">{node.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
