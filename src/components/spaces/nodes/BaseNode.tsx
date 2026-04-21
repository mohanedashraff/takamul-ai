"use client";

// ============================================================
// Yilow Spaces — Base Node Component
// Shared layout for all node types: header, body, handles, actions
// ============================================================

import React, { type ReactNode, useState, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { GripVertical, Play, Copy, Trash2, Loader2, Check, X } from "lucide-react";
import { NODE_TYPES, PORT_COLORS, type PortType } from "../lib/nodeRegistry";

interface BaseNodeProps {
  id: string;
  type: string;
  children: ReactNode;
  selected?: boolean;
  // Execution state
  status?: "idle" | "running" | "success" | "error";
  onRun?: () => void;
  // Optional: override default header icon
  headerIcon?: ReactNode;
  // Optional: hide action bar
  hideActions?: boolean;
  // Optional: custom class for the body
  bodyClassName?: string;
}

export function BaseNode({
  id,
  type,
  children,
  selected,
  status = "idle",
  onRun,
  headerIcon,
  hideActions = false,
  bodyClassName = "",
}: BaseNodeProps) {
  const { deleteElements, getNode, addNodes, setNodes } = useReactFlow();
  const [showActions, setShowActions] = useState(false);

  const nodeDef = NODE_TYPES[type];
  if (!nodeDef) return null;

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleDuplicate = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    const newNode = {
      ...node,
      id: `${type}-${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 60 },
      selected: false,
    };
    addNodes(newNode);
  }, [id, type, getNode, addNodes]);

  // Status indicator
  const statusIcon = {
    idle: null,
    running: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />,
    success: <Check className="w-3.5 h-3.5 text-emerald-400" />,
    error: <X className="w-3.5 h-3.5 text-red-400" />,
  }[status];

  return (
    <div
      className={`
        group relative rounded-2xl border transition-all duration-200
        ${selected
          ? "border-white/30 shadow-[0_0_30px_rgba(241,91,181,0.15)]"
          : "border-white/[0.07] hover:border-white/15"
        }
        bg-[#111116]/95 backdrop-blur-xl
        min-w-[280px] max-w-[380px]
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* === INPUT HANDLES (Left side) === */}
      {nodeDef.inputs.map((port, i) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          className="!w-3 !h-3 !rounded-full !border-2 transition-all hover:!scale-125"
          style={{
            top: `${40 + i * 32}px`,
            background: '#111116',
            borderColor: PORT_COLORS[port.type],
            boxShadow: `0 0 8px ${PORT_COLORS[port.type]}40`,
          }}
          title={port.label}
        />
      ))}

      {/* === NODE HEADER === */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-b border-white/[0.05]"
        style={{
          background: `linear-gradient(135deg, ${nodeDef.color}15, transparent)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${nodeDef.color}20`, color: nodeDef.color }}
          >
            {headerIcon || (
              <span className="text-xs font-bold">
                {nodeDef.labelAr.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white/90 leading-none">
              {nodeDef.labelAr}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5 font-mono">
              {nodeDef.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {statusIcon}
          {onRun && (
            <button
              onClick={onRun}
              disabled={status === "running"}
              className="p-1.5 rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-40"
              title="تشغيل"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* === NODE BODY === */}
      <div className={`px-4 py-3 ${bodyClassName}`}>
        {children}
      </div>

      {/* === Floating Action Bar (on hover) === */}
      {!hideActions && showActions && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a24] border border-white/10 rounded-xl px-2 py-1 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {onRun && (
            <button
              onClick={onRun}
              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors"
              title="تشغيل"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDuplicate}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="نسخ"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* === OUTPUT HANDLES (Right side) === */}
      {nodeDef.outputs.map((port, i) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          className="!w-3 !h-3 !rounded-full !border-2 transition-all hover:!scale-125"
          style={{
            top: `${40 + i * 32}px`,
            background: PORT_COLORS[port.type],
            borderColor: PORT_COLORS[port.type],
            boxShadow: `0 0 8px ${PORT_COLORS[port.type]}40`,
          }}
          title={port.label}
        />
      ))}
    </div>
  );
}
